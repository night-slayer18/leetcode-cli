export interface VersionEntry {
  version: string;
  content: string;
  hasBreakingChanges: boolean;
  date?: string;
}

export function parseReleases(content: string): VersionEntry[] {
  const entries: VersionEntry[] = [];

  const versionRegex = /^## v?([\d.]+)/gm;
  const matches = [...content.matchAll(versionRegex)];

  for (let i = 0; i < matches.length; i++) {
    const match = matches[i];
    const version = `v${match[1]}`;
    const startIndex = match.index! + match[0].length;
    const endIndex = i + 1 < matches.length ? matches[i + 1].index! : content.length;
    const versionContent = content.slice(startIndex, endIndex).trim();

    const hasBreakingChanges = versionContent.includes('⚠️ Breaking Change');

    const dateMatch = versionContent.match(/> \*\*Release Date\*\*: (.*)/);
    const date = dateMatch ? dateMatch[1].trim() : undefined;

    entries.push({
      version,
      content: versionContent,
      hasBreakingChanges,
      date,
    });
  }

  return entries;
}
