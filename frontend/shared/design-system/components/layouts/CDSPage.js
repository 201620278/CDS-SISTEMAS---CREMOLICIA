/**
 * CDSPage — Layout de página oficial
 *
 * @module frontend/shared/design-system/components/layouts/CDSPage
 */

const DashboardLayout = require('../../primitives/layouts/DashboardLayout');
const theme = require('../../theme');

class CDSPage {
  static create(options = {}) {
    const page = DashboardLayout.create(options);
    page.classList.add('cds-page');
    return page;
  }

  static getStyles() {
    const t = theme;
    return `
      ${DashboardLayout.getStyles()}
      .cds-page {
        font-family: ${t.typography.fontFamily.primary};
        color: ${t.colors.neutral[800]};
      }
      .cds-page .cds-dashboard-layout__content {
        padding: ${t.spacing.lg};
        max-width: ${t.grid.maxWidth};
        margin: 0 auto;
        width: 100%;
      }
      @media (max-width: ${t.breakpoints.md}) {
        .cds-page .cds-dashboard-layout__main { flex-direction: column; }
        .cds-page .cds-dashboard-layout__sidebar { width: 100%; }
      }
    `;
  }
}

module.exports = CDSPage;
