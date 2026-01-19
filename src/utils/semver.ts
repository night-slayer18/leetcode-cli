// Semantic version comparison utilities

export function isNewerVersion(v1: string, v2: string): boolean {
  const v1Parts = v1.replace('v', '').split('.').map(Number);
  const v2Parts = v2.replace('v', '').split('.').map(Number);

  for (let i = 0; i < 3; i++) {
    const p1 = v1Parts[i] || 0;
    const p2 = v2Parts[i] || 0;
    if (p1 > p2) return true;
    if (p1 < p2) return false;
  }
  return false;
}

/**
 * Check if major version has bumped (indicates breaking changes)
 */
export function hasMajorVersionBump(current: string, latest: string): boolean {
  const currentMajor = parseInt(current.replace('v', '').split('.')[0]) || 0;
  const latestMajor = parseInt(latest.replace('v', '').split('.')[0]) || 0;
  return latestMajor > currentMajor;
}

/**
 * Parse version string into parts
 */
export function parseVersion(version: string): { major: number; minor: number; patch: number } {
  const parts = version.replace('v', '').split('.').map(Number);
  return {
    major: parts[0] || 0,
    minor: parts[1] || 0,
    patch: parts[2] || 0,
  };
}
