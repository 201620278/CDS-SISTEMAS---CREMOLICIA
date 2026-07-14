/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'jsdom',
  rootDir: __dirname,
  testMatch: ['**/Workspace/**/*.test.js', '**/*.test.js'],
  transform: {}
};
