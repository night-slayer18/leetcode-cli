/**
 * TUI Theme Configuration
 * Design tokens for consistent styling across all TUI components
 */

// Color palette - Curated for terminal aesthetics
export const colors = {
  // Primary colors
  primary: '#61AFEF',
  primaryDim: '#4D8AC9',

  // Status colors
  success: '#98C379',
  warning: '#E5C07B',
  error: '#E06C75',
  info: '#56B6C2',

  // Text hierarchy
  text: '#ABB2BF',
  textBright: '#FFFFFF',
  textMuted: '#5C6370',
  textDim: '#4B5263',

  // Background (for reference, terminal bg is usually transparent)
  bg: '#282C34',
  bgHighlight: '#3E4451',

  // Accent colors
  purple: '#C678DD',
  cyan: '#56B6C2',
  orange: '#D19A66',
} as const;

// Difficulty-specific colors
export const difficulty = {
  easy: '#98C379',
  medium: '#E5C07B',
  hard: '#E06C75',
} as const;

// Status indicators
export const status = {
  solved: '#98C379',
  attempted: '#E5C07B',
  todo: '#5C6370',
} as const;

// Spacing scale (in characters)
export const spacing = {
  xs: 1,
  sm: 2,
  md: 4,
  lg: 6,
  xl: 8,
} as const;

// Box drawing characters for premium borders
export const borders = {
  // Light borders
  topLeft: '┌',
  topRight: '┐',
  bottomLeft: '└',
  bottomRight: '┘',
  horizontal: '─',
  vertical: '│',

  // Heavy borders
  heavyTopLeft: '┏',
  heavyTopRight: '┓',
  heavyBottomLeft: '┗',
  heavyBottomRight: '┛',
  heavyHorizontal: '━',
  heavyVertical: '┃',

  // Rounded borders
  roundTopLeft: '╭',
  roundTopRight: '╮',
  roundBottomLeft: '╰',
  roundBottomRight: '╯',

  // T-junctions
  tLeft: '├',
  tRight: '┤',
  tTop: '┬',
  tBottom: '┴',
  cross: '┼',
} as const;

// Progress bar characters
export const progressChars = {
  filled: '█',
  halfFilled: '▓',
  lightFilled: '▒',
  empty: '░',
  // Alternative style
  block: '■',
  emptyBlock: '□',
} as const;

// Icons/Symbols
export const icons = {
  check: '✓',
  cross: '✗',
  bullet: '•',
  arrow: '→',
  arrowLeft: '←',
  arrowUp: '↑',
  arrowDown: '↓',
  star: '★',
  starEmpty: '☆',
  fire: '🔥',
  clock: '⏱',
  bookmark: '🔖',
  folder: '📁',
  code: '💻',
  stats: '📊',
  gear: '⚙',
  lightning: '⚡',
  target: '🎯',
} as const;

// Keyboard hints styling
export const keyStyle = {
  bracket: ['[', ']'],
  color: colors.primary,
} as const;

// Screen dimensions (will be dynamic)
export const defaultDimensions = {
  minWidth: 80,
  minHeight: 24,
  sidebarWidth: 20,
  statusBarHeight: 1,
  headerHeight: 3,
} as const;

// Layout configuration for consistent screen structure
export const layout = {
  // Standard padding values (in characters)
  padding: {
    none: 0,
    xs: 1,
    sm: 2,
    md: 3,
    lg: 4,
  },

  // Standard gaps between elements
  gap: {
    none: 0,
    xs: 1,
    sm: 2,
    md: 3,
  },

  // Minimum dimensions
  minWidth: 80,
  minHeight: 24,

  // Sidebar dimensions
  sidebarWidth: 22,

  // Problem view sidebar
  problemSidebarWidth: 24,

  // Header and status bar heights
  headerHeight: 3,
  statusBarHeight: 2,

  // Panel height constraints
  panelMinHeight: 6,

  // Table column widths for problem lists
  tableColumns: {
    selector: 3,
    status: 3,
    id: 6,
    difficulty: 8,
    acceptance: 7,
    premium: 4,
    // Total fixed: 31 characters, title is flexible
  },
} as const;

// Type exports for TypeScript
export type ColorKey = keyof typeof colors;
export type DifficultyKey = keyof typeof difficulty;
export type StatusKey = keyof typeof status;
export type LayoutKey = keyof typeof layout;
