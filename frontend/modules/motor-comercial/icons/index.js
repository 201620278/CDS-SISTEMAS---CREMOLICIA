/**
 * Icons — Official Icon Catalog
 *
 * Sprint 2.7: Arquitetura Frontend — catálogo de ícones.
 *
 * @module frontend/modules/motor-comercial/icons
 */

const icons = {
  // ============================================================================
  // NAVIGATION
  // ============================================================================
  home: '🏠',
  dashboard: '📊',
  menu: '☰',
  close: '✕',
  back: '←',
  forward: '→',
  up: '↑',
  down: '↓',
  chevronLeft: '‹',
  chevronRight: '›',
  chevronUp: '▲',
  chevronDown: '▼',

  // ============================================================================
  // ACTIONS
  // ============================================================================
  add: '+',
  remove: '−',
  edit: '✏️',
  delete: '🗑️',
  save: '💾',
  cancel: '❌',
  confirm: '✓',
  search: '🔍',
  filter: '🔽',
  sort: '🔃',
  refresh: '🔄',
  download: '⬇️',
  upload: '⬆️',
  print: '🖨️',
  share: '🔗',
  copy: '📋',
  paste: '📌',
  cut: '✂️',
  undo: '↩️',
  redo: '↪️',

  // ============================================================================
  // STATUS
  // ============================================================================
  success: '✓',
  error: '✕',
  warning: '⚠',
  info: 'ℹ️',
  loading: '⏳',
  offline: '📴',
  online: '🟢',

  // ============================================================================
  // USER
  // ============================================================================
  user: '👤',
  users: '👥',
  admin: '👑',
  guest: '👻',
  profile: '🆔',
  settings: '⚙️',
  logout: '🚪',
  login: '🔑',

  // ============================================================================
  // BUSINESS
  // ============================================================================
  money: '💰',
  dollar: '💵',
  creditCard: '💳',
  bank: '🏦',
  chart: '📈',
  trendUp: '📈',
  trendDown: '📉',
  target: '🎯',
  flag: '🚩',

  // ============================================================================
  // DOCUMENTS
  // ============================================================================
  document: '📄',
  file: '📁',
  folder: '📂',
  pdf: '📕',
  excel: '📊',
  image: '🖼️',
  video: '🎬',
  audio: '🎵',

  // ============================================================================
  // COMMUNICATION
  // ============================================================================
  email: '✉️',
  phone: '📞',
  chat: '💬',
  notification: '🔔',
  mail: '📧',
  send: '📤',
  receive: '📥',

  // ============================================================================
  // COMERCIAL
  // ============================================================================
  box: '📦',
  truck: '🚚',
  cart: '🛒',
  store: '🏪',
  tag: '🏷️',
  barcode: '📊',
  receipt: '🧾',
  invoice: '📝',

  // ============================================================================
  // TIME
  // ============================================================================
  calendar: '📅',
  clock: '🕐',
  hourglass: '⏳',
  timer: '⏱️',

  // ============================================================================
  // MISC
  // ============================================================================
  star: '⭐',
  heart: '❤️',
  bookmark: '🔖',
  pin: '📌',
  flag: '🚩',
  globe: '🌍',
  cloud: '☁️',
  sun: '☀️',
  moon: '🌙',
  bolt: '⚡',
  fire: '🔥',
  snowflake: '❄️',
  umbrella: '☂️'
};

/**
 * Gets icon by key.
 * @param {string} key - Icon key
 * @returns {string}
 */
function getIcon(key) {
  return icons[key] || '❓';
}

/**
 * Gets all icon keys.
 * @returns {Array<string>}
 */
function getAllIconKeys() {
  return Object.keys(icons);
}

/**
 * Gets icons by category.
 * @param {string} category - Category name
 * @returns {Object}
 */
function getIconsByCategory(category) {
  const categories = {
    navigation: ['home', 'dashboard', 'menu', 'close', 'back', 'forward', 'up', 'down', 'chevronLeft', 'chevronRight', 'chevronUp', 'chevronDown'],
    actions: ['add', 'remove', 'edit', 'delete', 'save', 'cancel', 'confirm', 'search', 'filter', 'sort', 'refresh', 'download', 'upload', 'print', 'share', 'copy', 'paste', 'cut', 'undo', 'redo'],
    status: ['success', 'error', 'warning', 'info', 'loading', 'offline', 'online'],
    user: ['user', 'users', 'admin', 'guest', 'profile', 'settings', 'logout', 'login'],
    business: ['money', 'dollar', 'creditCard', 'bank', 'chart', 'trendUp', 'trendDown', 'target', 'flag'],
    documents: ['document', 'file', 'folder', 'pdf', 'excel', 'image', 'video', 'audio'],
    communication: ['email', 'phone', 'chat', 'notification', 'mail', 'send', 'receive'],
    commercial: ['box', 'truck', 'cart', 'store', 'tag', 'barcode', 'receipt', 'invoice'],
    time: ['calendar', 'clock', 'hourglass', 'timer'],
    misc: ['star', 'heart', 'bookmark', 'pin', 'flag', 'globe', 'cloud', 'sun', 'moon', 'bolt', 'fire', 'snowflake', 'umbrella']
  };

  const categoryKeys = categories[category] || [];
  const result = {};

  categoryKeys.forEach(key => {
    result[key] = icons[key];
  });

  return result;
}

module.exports = {
  icons,
  getIcon,
  getAllIconKeys,
  getIconsByCategory
};
