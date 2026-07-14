/**
 * Storybook Configuration — Motor Comercial
 *
 * Sprint 2.7: Arquitetura Frontend — configuração do Storybook.
 *
 * @module frontend/modules/motor-comercial/.storybook
 */

module.exports = {
  stories: [
    '../components/**/*.stories.js',
    '../pages/**/*.stories.js'
  ],
  addons: [
    '@storybook/addon-essentials'
  ],
  framework: {
    name: '@storybook/html-webpack5',
    options: {}
  },
  docs: {
    autodocs: true
  }
};
