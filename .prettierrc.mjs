/** @type {import('prettier').Config} */
const config = {
  printWidth: 100,
  singleQuote: true,
  overrides: [
    {
      files: '*.html',
      options: {
        parser: 'angular',
      },
    },
  ],
};

export default config;
