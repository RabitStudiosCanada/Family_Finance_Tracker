module.exports = {
  root: true,
  env: {
    es2021: true
  },
  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module'
  },
  settings: {
    react: {
      version: 'detect'
    }
  },
  plugins: ['react', 'react-hooks', 'import', 'jsx-a11y'],
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:import/react',
    'prettier'
  ],
  overrides: [
    {
      files: ['backend/**/*.js'],
      env: {
        node: true,
        jest: true
      },
      rules: {
        'react/react-in-jsx-scope': 'off'
      }
    },
    {
      files: ['frontend/src/**/*.{js,jsx}'],
      env: {
        browser: true,
        es2021: true
      },
      globals: {
        module: 'readonly'
      },
      rules: {
        'react/react-in-jsx-scope': 'off'
      }
    },
    {
      files: ['**/*.config.js', '**/*.config.cjs'],
      env: {
        node: true
      }
    }
  ]
};
