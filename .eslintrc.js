module.exports = {
  'env': {
      'commonjs': true,
      'es2021': true,
      'node': true,
  },
  'extends': [
      'eslint:recommended'
  ],
  'parserOptions': {
      'ecmaVersion': 12
  },
  'rules': {
      'no-unsafe-finally': [
        'off'
      ],
      'no-unused-vars': [
        "error", 
        { "args": "none" }
      ],
      'semi': [
        'warn',
        'always'
      ]
  }
};
