import { Container, Factory, injected, tag, tagged, token } from '../src';

describe('container', () => {
  describe('simple returns', () => {
    it('returns a primitive value', () => {
      const value = 0;
      const valueToken = token<number>('value');

      const container = new Container();
      container.bind(valueToken).toValue(value);

      expect(container.get(valueToken)).toBe(value);
    });

    it('returns a constructor', () => {
      class SomeClass {}
      const valueToken = token<SomeClass>('value');

      const container = new Container();
      container.bind(valueToken).toValue(SomeClass);

      expect(container.get(valueToken)).toBe(SomeClass);
    });

    it('returns a not-dynamic factory', () => {
      class SomeClass {}
      const someClassFactoryToken = token<Factory<SomeClass>>('someClassFactory');

      const container = new Container();
      container.bind(someClassFactoryToken).toFactory(SomeClass);

      const factory = container.get(someClassFactoryToken);
      const firstInstance = factory();
      const secondInstance = factory();

      expect(firstInstance).toBeInstanceOf(SomeClass);
      expect(secondInstance).toBeInstanceOf(SomeClass);
      expect(firstInstance).not.toBe(secondInstance);
    });

    it('returns a dynamic factory whose transformer returns void', () => {
      class SomeClass {
        public str: string = '';

        public num: number = 0;

        public init(str: string, num: number) {
          this.str = str;
          this.num = num;
        }
      }

      const someClassFactoryToken = token<Factory<SomeClass, [str: string, num: number]>>(
        'someClassFactory',
      );

      const container = new Container();
      container
        .bind(someClassFactoryToken)
        .toFactory(SomeClass, (instance, str, num) => instance.init(str, num));

      const str = '1';
      const num = 1;

      const factory = container.get(someClassFactoryToken);
      const instance = factory(str, num);

      expect(instance).toBeInstanceOf(SomeClass);
      expect(instance.str).toBe(str);
      expect(instance.num).toBe(num);
    });

    it('returns a dynamic factory whose transformer returns a value and ignores the value returned from the transformer', () => {
      class SomeClass {
        public str: string = '';

        public num: number = 0;

        public init(str: string, num: number) {
          this.str = str;
          this.num = num;
        }
      }

      const someClassFactoryToken = token<Factory<SomeClass, [str: string, num: number]>>(
        'someClassFactory',
      );

      const container = new Container();
      container.bind(someClassFactoryToken).toFactory(SomeClass, (instance, str, num) => {
        instance.init(str, num);
        return 1;
      });

      const str = '1';
      const num = 1;

      const factory = container.get(someClassFactoryToken);
      const instance = factory(str, num);

      expect(instance).toBeInstanceOf(SomeClass);
      expect(instance.str).toBe(str);
      expect(instance.num).toBe(num);
    });

    it('returns an instance in transient scope', () => {
      class SomeClass {}
      const someClassToken = token<SomeClass>('someClass');

      const container = new Container();
      container.bind(someClassToken).toInstance(SomeClass).inTransientScope();

      const firstInstance = container.get(someClassToken);
      const secondInstance = container.get(someClassToken);

      expect(firstInstance).toBeInstanceOf(SomeClass);
      expect(secondInstance).toBeInstanceOf(SomeClass);
      expect(firstInstance).not.toBe(secondInstance);
    });

    it('returns an instance in singleton scope', () => {
      class SomeClass {}
      const someClassToken = token<SomeClass>('someClass');

      const container = new Container();
      container.bind(someClassToken).toInstance(SomeClass).inSingletonScope();

      const firstInstance = container.get(someClassToken);
      const secondInstance = container.get(someClassToken);

      expect(firstInstance).toBeInstanceOf(SomeClass);
      expect(secondInstance).toBeInstanceOf(SomeClass);
      expect(firstInstance).toBe(secondInstance);
    });

    it('throws when there is not binding', () => {
      const someToken = token<unknown>('some');
      const container = new Container();

      expect(() => container.get(someToken)).toThrowErrorMatchingSnapshot();
    });
  });

  describe('injects', () => {
    it('injects primitive values', () => {
      class SomeClass {
        constructor(public str: string, public num: number) {}
      }

      const str = '1';
      const num = 0;

      const tokens = {
        someClass: token<SomeClass>('someClass'),
        str: token<string>('str'),
        num: token<number>('num'),
      };

      injected(SomeClass, tokens.str, tokens.num);

      const container = new Container();
      container.bind(tokens.someClass).toInstance(SomeClass).inTransientScope();
      container.bind(tokens.str).toValue(str);
      container.bind(tokens.num).toValue(num);

      const instance = container.get(tokens.someClass);

      expect(instance.str).toBe(str);
      expect(instance.num).toBe(num);
    });

    it('injects instances in transient and singleton scopes', () => {
      class FirstClass {}
      class SecondClass {}
      class ThirdClass {
        constructor(public first: FirstClass, public second: SecondClass) {}
      }

      const tokens = {
        firstClass: token<FirstClass>('firstClass'),
        secondClass: token<SecondClass>('secondClass'),
        thirdClass: token<ThirdClass>('thirdClass'),
      };

      injected(ThirdClass, tokens.firstClass, tokens.secondClass);

      const container = new Container();
      container.bind(tokens.firstClass).toInstance(FirstClass).inTransientScope();
      container.bind(tokens.secondClass).toInstance(SecondClass).inSingletonScope();
      container.bind(tokens.thirdClass).toInstance(ThirdClass).inTransientScope();

      const firstComeClassInstance = container.get(tokens.thirdClass);
      const secondComeClassInstance = container.get(tokens.thirdClass);

      expect(firstComeClassInstance.first).toBeInstanceOf(FirstClass);
      expect(firstComeClassInstance.second).toBeInstanceOf(SecondClass);

      expect(firstComeClassInstance.first).not.toBe(secondComeClassInstance.first);
      expect(firstComeClassInstance.second).toBe(secondComeClassInstance.second);
    });

    it('injects instances in resolution scope', () => {
      class ZeroClass {}
      class FirstClass {}
      class SecondClass {
        constructor(public zero: ZeroClass, public first: FirstClass) {}
      }
      class ThirdClass {
        constructor(public zero: ZeroClass, public first: FirstClass, public second: SecondClass) {}
      }
      class FourthClass {
        constructor(
          public zero: ZeroClass,
          public first: FirstClass,
          public second: SecondClass,
          public third: ThirdClass,
        ) {}
      }

      const tokens = {
        zeroClass: token<ZeroClass>('zeroClass'),
        firstClass: token<FirstClass>('firstClass'),
        secondClass: token<SecondClass>('secondClass'),
        thirdClass: token<ThirdClass>('thirdClass'),
        fourthClass: token<FourthClass>('fourthClass'),
      };

      injected(SecondClass, tokens.zeroClass, tokens.firstClass);
      injected(ThirdClass, tokens.zeroClass, tokens.firstClass, tokens.secondClass);
      injected(
        FourthClass,
        tokens.zeroClass,
        tokens.firstClass,
        tokens.secondClass,
        tokens.thirdClass,
      );

      const container = new Container();
      container.bind(tokens.zeroClass).toInstance(ZeroClass).inTransientScope();
      container.bind(tokens.firstClass).toInstance(FirstClass).inResolutionScope();
      container.bind(tokens.secondClass).toInstance(SecondClass).inResolutionScope();
      container.bind(tokens.thirdClass).toInstance(ThirdClass).inTransientScope();
      container.bind(tokens.fourthClass).toInstance(FourthClass).inTransientScope();

      const instance = container.get(tokens.fourthClass);

      expect(instance.first).toBe(instance.second.first);
      expect(instance.first).toBe(instance.third.first);
      expect(instance.first).toBe(instance.third.second.first);

      expect(instance.second).toBe(instance.third.second);

      expect(instance.zero).not.toBe(instance.second.zero);
      expect(instance.zero).not.toBe(instance.third.zero);
      expect(instance.second.zero).not.toBe(instance.third.zero);
    });

    it('throws when tries to construct constructor with arguments when target class is not injected', () => {
      class SomeClass {
        constructor(public str: string) {}
      }
      const someToken = token('some');

      const container = new Container();
      container.bind(someToken).toInstance(SomeClass).inTransientScope();

      expect(() => container.get(someToken)).toThrowErrorMatchingSnapshot();
    });
  });

  describe('tagged injects', () => {
    it('injects when target tagged', () => {
      class FirstClass {}
      class AnotherFirstClass {}
      class SecondClass {
        constructor(public first: FirstClass) {}
      }
      class ThirdClass {
        constructor(public first: FirstClass) {}
      }
      class FourthClass {
        constructor(public first: FirstClass) {}
      }

      const tokens = {
        firstClass: token<FirstClass>('firstClass'),
        secondClass: token<SecondClass>('secondClass'),
        thirdClass: token<ThirdClass>('thirdClass'),
        fourthClass: token<FourthClass>('fourthClass'),
      };

      const tags = {
        some: tag('some'),
        unused: tag('unused'),
      };

      injected(SecondClass, tokens.firstClass);
      injected(ThirdClass, tokens.firstClass);
      injected(FourthClass, tokens.firstClass);

      tagged(ThirdClass, tags.some);
      tagged(FourthClass, tags.unused);

      const container = new Container();
      container.bind(tokens.firstClass).toInstance(FirstClass).inTransientScope();
      container
        .when(tags.some)
        .bind(tokens.firstClass)
        .toInstance(AnotherFirstClass)
        .inTransientScope();

      container.bind(tokens.secondClass).toInstance(SecondClass).inTransientScope();
      container.bind(tokens.thirdClass).toInstance(ThirdClass).inTransientScope();
      container.bind(tokens.fourthClass).toInstance(FourthClass).inTransientScope();

      const secondClassInstance = container.get(tokens.secondClass);
      const thirdClassInstance = container.get(tokens.thirdClass);
      const fourthClassInstance = container.get(tokens.fourthClass);

      expect(secondClassInstance.first).toBeInstanceOf(FirstClass);
      expect(thirdClassInstance.first).toBeInstanceOf(AnotherFirstClass);
      expect(fourthClassInstance.first).toBeInstanceOf(FirstClass);
    });
  });

  describe('hierarchical containers', () => {
    it('returns an instance from a parent container', () => {
      class SomeClass {}
      const someClassToken = token<SomeClass>('someClass');

      const parentContainer = new Container();
      parentContainer.bind(someClassToken).toInstance(SomeClass).inTransientScope();

      const childContainer = new Container(parentContainer);

      expect(childContainer.get(someClassToken)).toBeInstanceOf(SomeClass);
    });

    it("re-binds parent container's binding in a child container", () => {
      class SomeClass {}
      class AnotherClass {}
      const classToken = token<unknown>('class');

      const parentContainer = new Container();
      parentContainer.bind(classToken).toInstance(SomeClass).inTransientScope();

      const childContainer = new Container(parentContainer);
      childContainer.bind(classToken).toInstance(AnotherClass).inTransientScope();

      expect(childContainer.get(classToken)).toBeInstanceOf(AnotherClass);
    });

    it('returns an instance in container scope', () => {
      class SomeClass {}
      const someClassToken = token<SomeClass>('someClass');

      const parentContainer = new Container();
      parentContainer.bind(someClassToken).toInstance(SomeClass).inContainerScope();

      const childContainer = new Container(parentContainer);

      const parentContainerFirstInstance = parentContainer.get(someClassToken);
      const parentContainerSecondInstance = parentContainer.get(someClassToken);
      const childContainerFirstInstance = childContainer.get(someClassToken);
      const childContainerSecondInstance = childContainer.get(someClassToken);

      expect(parentContainerFirstInstance).toBe(parentContainerSecondInstance);
      expect(childContainerFirstInstance).toBe(childContainerSecondInstance);

      expect(parentContainerFirstInstance).not.toBe(childContainerFirstInstance);
      expect(parentContainerFirstInstance).not.toBe(childContainerSecondInstance);
      expect(parentContainerSecondInstance).not.toBe(childContainerFirstInstance);
      expect(parentContainerSecondInstance).not.toBe(childContainerSecondInstance);
    });
  });

  describe('copy', () => {
    it("returns an unlinked container from 'copy' method", () => {
      const values = {
        first: 1,
        second: 2,
        third: 3,
      };

      const tokens = {
        first: token<number>('first'),
        second: token<number>('second'),
        third: token<number>('third'),
      };

      const parentContainer = new Container();
      parentContainer.bind(tokens.first).toValue(values.first);

      const originalContainer = new Container(parentContainer);
      originalContainer.bind(tokens.second).toValue(values.second);

      const copyContainer = originalContainer.copy();
      copyContainer.bind(tokens.third).toValue(values.third);

      expect(copyContainer.get(tokens.first)).toBe(values.first);
      expect(copyContainer.get(tokens.second)).toBe(values.second);
      expect(copyContainer.get(tokens.third)).toBe(values.third);
      expect(() => originalContainer.get(tokens.third)).toThrowErrorMatchingSnapshot();
    });
  });
});
