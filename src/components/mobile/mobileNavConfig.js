// Mobile bottom-tab configuration. Each role gets up to 4 primary tabs visible
// directly; anything beyond that sits behind a "More" tab (slide-up sheet).
// This mirrors each role's desktop nav (SideNav.jsx ROLE_NAV_IDS) but trimmed to
// what's reachable with a thumb without scrolling a long list.

export const PAGE_ICONS = {
  dashboard: '▢',
  operations: '⚙',
  projects: '▣',
  scheduling: '▦',
  laboratories: '⌂',
  statistics: '◔',
  assets: '◫',
  consumables: '◇',
  personnel: '◍',
  finance: '$',
  auditlog: '▤',
};

export const PAGE_LABELS = {
  dashboard: 'Dashboard',
  operations: 'Operations',
  projects: 'Projects',
  scheduling: 'Scheduling',
  laboratories: 'Labs',
  statistics: 'Stats',
  assets: 'Assets',
  consumables: 'Supplies',
  personnel: 'Staff',
  finance: 'Finance',
  auditlog: 'Audit',
};

// Pages that have a real, purpose-built mobile layout (vs. falling back to the
// scaled-down desktop component). Extend this as more pages get a mobile pass.
export const MOBILE_READY_PAGES = new Set(['dashboard', 'scheduling']);

export const ROLE_TABS = {
  operator: {
    primary: ['dashboard', 'operations', 'assets', 'consumables'],
    more: [],
  },
  test_engineer: {
    primary: ['dashboard', 'projects', 'scheduling', 'statistics'],
    more: ['assets', 'auditlog'],
  },
  lab_manager: {
    primary: ['dashboard', 'scheduling', 'laboratories', 'finance'],
    more: ['statistics', 'consumables', 'personnel', 'auditlog'],
  },
};

export const ROLE_DEFAULT_MOBILE_PAGE = {
  operator: 'dashboard',
  test_engineer: 'dashboard',
  lab_manager: 'dashboard',
};
