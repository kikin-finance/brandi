import { Tag, Token, TokenType } from '../../pointers';

import { BindingsRegistry } from '../BindingsRegistry';

import { BindingTypeSyntax } from './BindingTypeSyntax';

export class BindingTokenSyntax {
  constructor(
    private readonly bindingsRegistry: BindingsRegistry,
    private readonly tag?: Tag,
  ) {}

  public bind<T extends Token>(token: T): BindingTypeSyntax<TokenType<T>> {
    return new BindingTypeSyntax<TokenType<T>>(
      this.bindingsRegistry,
      token,
      this.tag,
    );
  }
}