import type { ProblemDrawerMode } from '../../types.js';

type Viewport = {
  bodyHeight: number;
  drawerHeight: number;
};

function targetDrawerHeight(mode: ProblemDrawerMode): number {
  switch (mode) {
    case 'status':
    case 'testResult':
    case 'submitResult':
      return 6;
    case 'hint':
    case 'submissions':
    case 'snapshots':
      return 10;
    case 'note':
    case 'diff':
      return 12;
    default:
      return 0;
  }
}

export function computeProblemViewport(
  contentHeight: number,
  drawerMode: ProblemDrawerMode
): Viewport {
  const safeHeight = Math.max(10, contentHeight);
  const headerHeight = 3;
  const footerHeight = 2;
  const baseHeight = Math.max(4, safeHeight - headerHeight - footerHeight);

  if (drawerMode === 'none') {
    return { bodyHeight: baseHeight, drawerHeight: 0 };
  }

  const dividerHeight = 1;
  const minBodyHeight = baseHeight >= 14 ? 8 : 5;
  const maxDrawerHeight = Math.max(3, baseHeight - minBodyHeight - dividerHeight);
  const drawerHeight = Math.max(3, Math.min(targetDrawerHeight(drawerMode), maxDrawerHeight));
  const bodyHeight = Math.max(3, baseHeight - dividerHeight - drawerHeight);

  return { bodyHeight, drawerHeight };
}

