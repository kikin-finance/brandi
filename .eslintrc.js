const path = require('path');

module.exports = {
  extends: [
    'airbnb-typescript/base',
    'prettier',
    'prettier/@typescript-eslint',
  ],
  parserOptions: {
    project: path.join(__dirname, 'tsconfig.json'),
  },
  rules: {
    'max-classes-per-file': 'off',
    'no-console': ['error', { allow: ['warn', 'error'] }],
    'sort-imports': [
      'error',
      {
        ignoreCase: false,
        ignoreDeclarationSort: false,
        ignoreMemberSort: false,
        memberSyntaxSortOrder: ['none', 'all', 'multiple', 'single'],
        allowSeparatedGroups: true,
      },
    ],
    'import/prefer-default-export': 'off',
    '@typescript-eslint/explicit-member-accessibility': [
      'error',
      {
        accessibility: 'explicit',
        overrides: {
          constructors: 'no-public',
        },
      },
    ],
  },
  overrides: [
    {
      files: ['**/spec/*.ts'],
      env: { 'jest/globals': true },
      plugins: ['jest'],
      extends: ['plugin:jest/all'],
      rules: {
        'jest/prefer-expect-assertions': [
          'error',
          { onlyFunctionsWithAsyncKeyword: true },
        ],
        'jest/no-hooks': [
          'error',
          {
            allow: ['beforeAll', 'afterEach'],
          },
        ],
      },
    },
  ],
};
