/**
 * CDS Design System — Ponto de entrada oficial
 *
 * Sprint DS-01: Fundação da Plataforma CDS Sistemas.
 * Sprint UX/UI 2.0.1: Fundação visual (tokens CSS, temas, animações).
 *
 * @module frontend/shared/design-system
 */

const tokens = require('./tokens');
const theme = require('./theme');
const themes = require('./themes');
const {
  injectDesignSystemStyles,
  injectFoundationStyles
} = require('./styles/inject');
const primitives = {
  base: require('./primitives/base'),
  layouts: require('./primitives/layouts'),
  form: require('./primitives/form'),
  data: require('./primitives/data'),
  navigation: require('./primitives/navigation'),
  special: require('./primitives/special')
};

const buttons = require('./components/buttons');
const layouts = require('./components/layouts');
const forms = require('./components/forms');
const feedback = require('./components/feedback');
const navigation = require('./components/navigation');
const search = require('./components/search');
const cards = require('./components/cards');
const data = require('./components/data');
const charts = require('./charts');

module.exports = {
  tokens,
  theme,
  themes,
  charts,
  THEMES: themes.THEMES,
  setTheme: themes.setTheme,
  getTheme: themes.getTheme,
  toggleTheme: themes.toggleTheme,
  initTheme: themes.initTheme,
  injectDesignSystemStyles,
  injectFoundationStyles,
  primitives,
  buttons,
  layouts,
  forms,
  feedback,
  navigation,
  search,
  cards,
  data,
  components: {
    ...buttons,
    ...layouts,
    ...forms,
    ...feedback,
    ...navigation,
    ...search,
    ...cards,
    ...data
  }
};
