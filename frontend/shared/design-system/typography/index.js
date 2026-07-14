/**
 * Tipografia oficial do CDS Design System
 *
 * @module frontend/shared/design-system/typography
 */

const theme = require('../theme');

const typography = {
  scale: theme.typography.fontSize,
  weights: theme.typography.fontWeight,
  families: theme.typography.fontFamily,
  lineHeights: theme.typography.lineHeight,
  letterSpacing: theme.typography.letterSpacing,

  styles: {
    pageTitle: { fontSize: '2xl', fontWeight: 'semibold', letterSpacing: 'tight' },
    sectionTitle: { fontSize: 'lg', fontWeight: 'semibold' },
    body: { fontSize: 'base', fontWeight: 'normal' },
    caption: { fontSize: 'sm', fontWeight: 'normal' },
    label: { fontSize: 'xs', fontWeight: 'medium', letterSpacing: 'caps' }
  }
};

module.exports = typography;
