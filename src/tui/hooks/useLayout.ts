/**
 * Responsive Layout Hook
 * Centralized terminal dimension and layout calculations
 */
import { useStdout } from 'ink';
import { useMemo } from 'react';

export interface LayoutDimensions {
  /** Terminal width in columns */
  width: number;
  /** Terminal height in rows */
  height: number;
  /** Content width after accounting for app padding */
  contentWidth: number;
  /** Content height after accounting for header/footer */
  contentHeight: number;
  /** Width for sidebar when shown */
  sidebarWidth: number;
  /** Width for main content when sidebar is shown */
  mainWidth: number;
  /** Whether terminal is small (< 100 cols) */
  isCompact: boolean;
}

export interface TableColumnWidths {
  selector: number;
  status: number;
  id: number;
  difficulty: number;
  acceptance: number;
  premium: number;
}

// Fixed column widths for consistent table layouts
export const TABLE_COLUMNS: TableColumnWidths = {
  selector: 3,
  status: 3,
  id: 6,
  difficulty: 8,
  acceptance: 7,
  premium: 4,
} as const;

// Sum of fixed columns (title is flexible)
export const FIXED_COLUMNS_WIDTH =
  TABLE_COLUMNS.selector +
  TABLE_COLUMNS.status +
  TABLE_COLUMNS.id +
  TABLE_COLUMNS.difficulty +
  TABLE_COLUMNS.acceptance +
  TABLE_COLUMNS.premium;

/**
 * Hook for responsive layout calculations
 * Use this instead of manual dimension calculations in screens
 */
export function useLayout(): LayoutDimensions {
  const { stdout } = useStdout();

  return useMemo(() => {
    const width = stdout?.columns || 80;
    const height = stdout?.rows || 24;

    // App padding: 2 chars on each side
    const APP_PADDING = 4;

    // Header: 3 lines, Status bar: 2 lines, margins: 2 lines
    const CHROME_HEIGHT = 7;

    // Sidebar width (when shown)
    const SIDEBAR_WIDTH = 22;
    const SIDEBAR_GAP = 2;

    const contentWidth = Math.max(40, width - APP_PADDING);
    const contentHeight = Math.max(10, height - CHROME_HEIGHT);
    const mainWidth = Math.max(40, contentWidth - SIDEBAR_WIDTH - SIDEBAR_GAP);

    return {
      width,
      height,
      contentWidth,
      contentHeight,
      sidebarWidth: SIDEBAR_WIDTH,
      mainWidth,
      isCompact: width < 100,
    };
  }, [stdout?.columns, stdout?.rows]);
}

/**
 * Calculate available height for a scrollable list
 * @param reservedLines - Lines used by header, footer, filters, etc.
 */
export function useListHeight(reservedLines: number = 10): number {
  const { height } = useLayout();
  return Math.max(5, height - reservedLines);
}

/**
 * Calculate content width for problem description
 * Accounts for borders, padding, and sidebar
 */
export function useProblemContentWidth(sidebarWidth: number = 24): number {
  const { width } = useLayout();
  // Borders: 2, Padding: 3, Gap: 2
  const OVERHEAD = 7;
  return Math.max(40, width - sidebarWidth - OVERHEAD);
}

export default useLayout;
