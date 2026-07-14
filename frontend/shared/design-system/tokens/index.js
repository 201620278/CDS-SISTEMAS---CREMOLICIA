/**
 * CDS Design System — Tokens Oficiais
 *
 * Sprint DS-01: Fundação da Plataforma CDS Sistemas.
 * Fonte única de verdade para espaçamento, tipografia, cores e demais tokens.
 *
 * @module frontend/shared/design-system/tokens
 */

const tokens = {
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
    xxxl: '64px'
  },

  typography: {
    fontFamily: {
      primary: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      mono: "'JetBrains Mono', 'Fira Code', monospace"
    },
    fontSize: {
      xs: '12px',
      sm: '14px',
      base: '16px',
      lg: '18px',
      xl: '20px',
      '2xl': '24px',
      '3xl': '30px',
      '4xl': '36px',
      '5xl': '48px',
      '6xl': '60px'
    },
    fontWeight: {
      light: 300,
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
      extrabold: 800
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.5,
      relaxed: 1.75
    },
    letterSpacing: {
      tight: '-0.025em',
      normal: '0',
      wide: '0.025em',
      caps: '0.08em'
    }
  },

  colors: {
    primary: {
      50: '#e8f0fe', 100: '#d2e3fc', 200: '#aecbfa', 300: '#8ab4f8',
      400: '#669df6', 500: '#4285f4', 600: '#3367d6', 700: '#2962ff',
      800: '#1a73e8', 900: '#174ea6'
    },
    secondary: {
      50: '#f3e8ff', 100: '#e9d5ff', 200: '#d8b4fe', 300: '#c084fc',
      400: '#a855f7', 500: '#9333ea', 600: '#7e22ce', 700: '#6b21a8',
      800: '#581c87', 900: '#4c1d95'
    },
    success: {
      50: '#f0fdf4', 100: '#dcfce7', 200: '#bbf7d0', 300: '#86efac',
      400: '#4ade80', 500: '#22c55e', 600: '#16a34a', 700: '#15803d',
      800: '#166534', 900: '#14532d'
    },
    warning: {
      50: '#fffbeb', 100: '#fef3c7', 200: '#fde68a', 300: '#fcd34d',
      400: '#fbbf24', 500: '#f59e0b', 600: '#d97706', 700: '#b45309',
      800: '#92400e', 900: '#78350f'
    },
    error: {
      50: '#fef2f2', 100: '#fee2e2', 200: '#fecaca', 300: '#fca5a5',
      400: '#f87171', 500: '#ef4444', 600: '#dc2626', 700: '#b91c1c',
      800: '#991b1b', 900: '#7f1d1d'
    },
    neutral: {
      50: '#f8fafc', 100: '#f1f5f9', 200: '#e2e8f0', 300: '#cbd5e1',
      400: '#94a3b8', 500: '#64748b', 600: '#475569', 700: '#334155',
      800: '#1e293b', 900: '#0f172a'
    },
    status: {
      active: '#22c55e',
      inactive: '#6b7280',
      pending: '#f59e0b',
      blocked: '#ef4444',
      draft: '#6366f1',
      completed: '#10b981',
      cancelled: '#ef4444'
    }
  },

  radius: {
    none: '0', sm: '4px', md: '8px', lg: '12px', xl: '16px', '2xl': '24px', full: '9999px'
  },

  shadow: {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.06)'
  },

  breakpoints: {
    xs: '0px', sm: '640px', md: '768px', lg: '1024px', xl: '1280px', '2xl': '1536px'
  },

  zindex: {
    dropdown: 1000, sticky: 1020, fixed: 1030, modalBackdrop: 1040,
    modal: 1050, popover: 1060, tooltip: 1070, notification: 1080
  },

  animations: {
    duration: { fast: '150ms', normal: '300ms', slow: '500ms' },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
    }
  },

  borders: {
    width: { thin: '1px', normal: '2px', thick: '4px' },
    style: { solid: 'solid', dashed: 'dashed', dotted: 'dotted' }
  },

  grid: {
    columns: 12,
    gutter: '24px',
    maxWidth: '1400px'
  },

  icons: {
    sizes: { sm: '16px', md: '20px', lg: '24px', xl: '32px' }
  }
};

module.exports = tokens;
