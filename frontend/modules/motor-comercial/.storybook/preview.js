/**
 * Storybook Preview — Motor Comercial
 *
 * Sprint 2.7: Arquitetura Frontend — preview do Storybook.
 *
 * @module frontend/modules/motor-comercial/.storybook
 */

import '../theme/index.css';

export const parameters = {
  actions: { argTypesRegex: '^on[A-Z].*' },
  controls: {
    matchers: {
      color: /(background|color)$/i,
      date: /Date$/,
    },
  },
};
