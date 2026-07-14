/**
 * CDS Design System — Tema Oficial
 *
 * @module frontend/shared/design-system/theme
 */

const tokens = require('../tokens');

const theme = {
  ...tokens,

  components: {
    button: {
      primary: {
        backgroundColor: tokens.colors.primary[600],
        color: '#ffffff',
        hoverBackgroundColor: tokens.colors.primary[700],
        activeBackgroundColor: tokens.colors.primary[800]
      },
      secondary: {
        backgroundColor: tokens.colors.neutral[100],
        color: tokens.colors.neutral[900],
        hoverBackgroundColor: tokens.colors.neutral[200],
        activeBackgroundColor: tokens.colors.neutral[300]
      },
      danger: {
        backgroundColor: tokens.colors.error[600],
        color: '#ffffff',
        hoverBackgroundColor: tokens.colors.error[700],
        activeBackgroundColor: tokens.colors.error[800]
      },
      success: {
        backgroundColor: tokens.colors.success[600],
        color: '#ffffff',
        hoverBackgroundColor: tokens.colors.success[700],
        activeBackgroundColor: tokens.colors.success[800]
      }
    },
    card: {
      backgroundColor: '#ffffff',
      borderColor: tokens.colors.neutral[200],
      shadow: tokens.shadow.sm,
      radius: tokens.radius.lg
    },
    input: {
      borderColor: tokens.colors.neutral[300],
      focusBorderColor: tokens.colors.primary[500],
      errorBorderColor: tokens.colors.error[500],
      backgroundColor: '#ffffff',
      disabledBackgroundColor: tokens.colors.neutral[100]
    },
    table: {
      headerBackgroundColor: tokens.colors.neutral[50],
      headerTextColor: tokens.colors.neutral[700],
      rowHoverBackgroundColor: tokens.colors.neutral[50],
      borderColor: tokens.colors.neutral[200]
    },
    badge: {
      success: { backgroundColor: tokens.colors.success[100], color: tokens.colors.success[700] },
      warning: { backgroundColor: tokens.colors.warning[100], color: tokens.colors.warning[700] },
      error: { backgroundColor: tokens.colors.error[100], color: tokens.colors.error[700] },
      info: { backgroundColor: tokens.colors.primary[100], color: tokens.colors.primary[700] }
    }
  },

  status: { ...tokens.colors.status }
};

module.exports = theme;
