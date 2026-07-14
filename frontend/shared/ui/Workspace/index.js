/**
 * Workspace — Shared UI barrel (FOUNDATION F2)
 *
 * @module frontend/shared/ui/Workspace
 */

const Workspace = require('./Workspace');
const WorkspaceHeader = require('./WorkspaceHeader');
const WorkspaceBody = require('./WorkspaceBody');
const WorkspaceFooter = require('./WorkspaceFooter');

module.exports = Workspace;
module.exports.Workspace = Workspace;
module.exports.WorkspaceHeader = WorkspaceHeader;
module.exports.WorkspaceBody = WorkspaceBody;
module.exports.WorkspaceFooter = WorkspaceFooter;
module.exports.Header = WorkspaceHeader;
module.exports.Body = WorkspaceBody;
module.exports.Footer = WorkspaceFooter;
module.exports.STATUS = Workspace.STATUS;
module.exports.create = Workspace.create.bind(Workspace);
module.exports.compose = Workspace.compose.bind(Workspace);
module.exports.getStyles = Workspace.getStyles.bind(Workspace);
module.exports.ensureStyles = Workspace.ensureStyles.bind(Workspace);
