/**
 * Stats Screen
 * User statistics with visual charts, matching CLI `stat` command
 * Modes: default (summary), calendar, skills, trend
 */
import { Box, Text, useInput } from 'ink';
import { useState, useEffect } from 'react';
import Spinner from 'ink-spinner';
import { leetcodeClient } from '../../api/client.js';
import { credentials } from '../../storage/credentials.js';
import { Panel } from '../components/Panel.js';
import { DifficultyProgress } from '../components/ProgressBar.js';
import { colors, icons, progressChars } from '../theme.js';

interface StatsScreenProps {
  onBack: () => void;
}

type ViewMode = 'summary' | 'calendar' | 'skills' | 'trend';

interface UserProfile {
  username: string;
  ranking: number;
  streak: number;
  totalActiveDays: number;
  acSubmissionNum: Array<{ difficulty: string; count: number }>;
  submissionCalendar?: string;
}

interface TagStat {
  tagName: string;
  problemsSolved: number;
}

interface SkillStats {
  fundamental: TagStat[];
  intermediate: TagStat[];
  advanced: TagStat[];
}

// Parse submission calendar for activity data
function parseCalendar(calendarJson: string): { [timestamp: string]: number } {
  try {
    return JSON.parse(calendarJson);
  } catch {
    return {};
  }
}

// Activity Heatmap Component (12 weeks)
function ActivityHeatmap({ calendarData }: { calendarData: { [ts: string]: number } }) {
  const now = new Date();
  const weeks: Array<{ label: string; submissions: number; activeDays: number }> = [];

  for (let w = 11; w >= 0; w--) {
    const weekStart = new Date(now);
    weekStart.setDate(weekStart.getDate() - w * 7 - weekStart.getDay());

    let weekCount = 0;
    let activeDays = 0;

    for (let d = 0; d < 7; d++) {
      const day = new Date(weekStart);
      day.setDate(day.getDate() + d);
      if (day > now) break;

      const midnight = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()));
      const timestamp = Math.floor(midnight.getTime() / 1000).toString();
      const count = calendarData[timestamp] || 0;
      weekCount += count;
      if (count > 0) activeDays++;
    }

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    const label = `${months[weekStart.getMonth()]} ${weekStart.getDate()} - ${months[weekEnd.getMonth()]} ${weekEnd.getDate()}`;

    weeks.push({ label, submissions: weekCount, activeDays });
  }

  const totalSubs = weeks.reduce((sum, w) => sum + w.submissions, 0);
  const totalActive = weeks.reduce((sum, w) => sum + w.activeDays, 0);

  return (
    <Box flexDirection="column">
      <Text color={colors.textMuted}>Activity (Last 12 Weeks)</Text>
      <Box flexDirection="column" marginTop={1}>
        {weeks.map((week, i) => (
          <Box key={i} gap={1}>
            <Text color={colors.textMuted}>{week.label.padEnd(18)}</Text>
            <Text color={week.submissions > 0 ? colors.success : colors.textDim}>
              {week.submissions > 0 ? '█'.repeat(Math.min(week.submissions, 10)).padEnd(10) : '·'.padEnd(10)}
            </Text>
            <Text color={colors.cyan}>{week.submissions > 0 ? `${week.submissions} subs`.padEnd(10) : ''.padEnd(10)}</Text>
            <Text color={colors.warning}>{week.activeDays > 0 ? `${week.activeDays}d active` : ''}</Text>
          </Box>
        ))}
      </Box>
      <Box marginTop={1}>
        <Text color={colors.textBright} bold>Total: </Text>
        <Text color={colors.cyan}>{totalSubs} submissions</Text>
        <Text color={colors.textMuted}>, </Text>
        <Text color={colors.warning}>{totalActive} days active</Text>
      </Box>
    </Box>
  );
}

// 7-day Trend Chart Component
function TrendChart({ calendarData }: { calendarData: { [ts: string]: number } }) {
  const now = new Date();
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const days: Array<{ label: string; count: number }> = [];

  for (let d = 6; d >= 0; d--) {
    const day = new Date(now);
    day.setDate(day.getDate() - d);
    const midnight = new Date(Date.UTC(day.getFullYear(), day.getMonth(), day.getDate()));
    const timestamp = Math.floor(midnight.getTime() / 1000).toString();
    days.push({ label: dayNames[day.getDay()], count: calendarData[timestamp] || 0 });
  }

  const maxVal = Math.max(...days.map(d => d.count), 1);
  const chartHeight = 6;
  const total = days.reduce((sum, d) => sum + d.count, 0);

  return (
    <Box flexDirection="column">
      <Text color={colors.textMuted}>Submission Trend (Last 7 Days)</Text>
      <Box flexDirection="column" marginTop={1}>
        {Array.from({ length: chartHeight }).map((_, row) => {
          const rowNum = chartHeight - row;
          return (
            <Box key={row}>
              <Text color={colors.textMuted}>{rowNum === chartHeight ? String(maxVal).padStart(2) : '  '} │</Text>
              {days.map((day, i) => {
                const barHeight = Math.round((day.count / maxVal) * chartHeight);
                return (
                  <Text key={i} color={colors.success}>
                    {barHeight >= rowNum ? ' ██ ' : '    '}
                  </Text>
                );
              })}
            </Box>
          );
        })}
        <Box>
          <Text color={colors.textMuted}>   0 └{'────'.repeat(7)}</Text>
        </Box>
        <Box>
          <Text color={colors.textMuted}>       {days.map(d => d.label.padEnd(4)).join('')}</Text>
        </Box>
        <Box>
          <Text color={colors.textDim}>       {days.map(d => String(d.count).padEnd(4)).join('')}</Text>
        </Box>
      </Box>
      <Box marginTop={1}>
        <Text color={colors.textBright}>Total: {total} submissions this week</Text>
      </Box>
    </Box>
  );
}

// Skills Breakdown Component
function SkillsBreakdown({ skills }: { skills: SkillStats }) {
  const renderSection = (title: string, stats: TagStat[], color: string) => {
    if (stats.length === 0) return null;
    const sorted = [...stats].sort((a, b) => b.problemsSolved - a.problemsSolved).slice(0, 8);
    return (
      <Box flexDirection="column" marginBottom={1}>
        <Text color={color} bold>{title}</Text>
        {sorted.map((stat, i) => (
          <Box key={i} gap={1}>
            <Text color={colors.text}>{stat.tagName.padEnd(22)}</Text>
            <Text color={color}>{progressChars.filled.repeat(Math.min(stat.problemsSolved, 15))}</Text>
            <Text color={colors.textMuted}> {stat.problemsSolved}</Text>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box flexDirection="column">
      <Text color={colors.textMuted}>Skill Breakdown</Text>
      <Box flexDirection="column" marginTop={1}>
        {renderSection('Fundamental', skills.fundamental, colors.success)}
        {renderSection('Intermediate', skills.intermediate, colors.warning)}
        {renderSection('Advanced', skills.advanced, colors.error)}
      </Box>
    </Box>
  );
}

export function StatsScreen({ onBack }: StatsScreenProps) {
  const [mode, setMode] = useState<ViewMode>('summary');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [skills, setSkills] = useState<SkillStats | null>(null);
  const [skillsLoading, setSkillsLoading] = useState(false);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const creds = credentials.get();
        if (!creds) {
          setError('Please login first');
          setLoading(false);
          return;
        }
        leetcodeClient.setCredentials(creds);
        const auth = await leetcodeClient.checkAuth();
        if (!auth.isSignedIn || !auth.username) {
          setError('Please login first');
          setLoading(false);
          return;
        }
        const data = await leetcodeClient.getUserProfile(auth.username);
        setProfile(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch stats');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  // Fetch skills when switching to skills mode
  useEffect(() => {
    if (mode === 'skills' && !skills && profile) {
      const fetchSkills = async () => {
        setSkillsLoading(true);
        try {
          const data = await leetcodeClient.getSkillStats(profile.username);
          setSkills(data);
        } catch {
          // Skills may not be available
        } finally {
          setSkillsLoading(false);
        }
      };
      fetchSkills();
    }
  }, [mode, skills, profile]);

  useInput((input, key) => {
    if (key.escape) { onBack(); return; }
    // Mode switching
    if (input === '1') setMode('summary');
    if (input === '2') setMode('calendar');
    if (input === '3') setMode('skills');
    if (input === '4') setMode('trend');
  });

  if (loading) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <Text color={colors.primary}><Spinner type="dots" /></Text>
        <Text color={colors.textMuted}> Loading statistics...</Text>
      </Box>
    );
  }

  if (error || !profile) {
    return (
      <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
        <Text color={colors.error}>{icons.cross} {error || 'No data'}</Text>
        <Text color={colors.textMuted}>Press [Esc] to go back</Text>
      </Box>
    );
  }

  // Parse stats
  const easy = profile.acSubmissionNum.find(s => s.difficulty === 'Easy')?.count || 0;
  const medium = profile.acSubmissionNum.find(s => s.difficulty === 'Medium')?.count || 0;
  const hard = profile.acSubmissionNum.find(s => s.difficulty === 'Hard')?.count || 0;
  const total = profile.acSubmissionNum.find(s => s.difficulty === 'All')?.count || 0;
  const calendarData = profile.submissionCalendar ? parseCalendar(profile.submissionCalendar) : {};

  return (
    <Box flexDirection="column" flexGrow={1}>
      {/* Header */}
      <Box marginBottom={1} gap={2}>
        <Text color={colors.primary} bold>{icons.stats} Statistics</Text>
        <Text color={colors.textMuted}>— @{profile.username}</Text>
      </Box>

      {/* Mode Tabs */}
      <Box marginBottom={1} gap={2}>
        <Text color={mode === 'summary' ? colors.primary : colors.textMuted} bold={mode === 'summary'}>
          [1] Summary
        </Text>
        <Text color={mode === 'calendar' ? colors.primary : colors.textMuted} bold={mode === 'calendar'}>
          [2] Calendar
        </Text>
        <Text color={mode === 'skills' ? colors.primary : colors.textMuted} bold={mode === 'skills'}>
          [3] Skills
        </Text>
        <Text color={mode === 'trend' ? colors.primary : colors.textMuted} bold={mode === 'trend'}>
          [4] Trend
        </Text>
      </Box>

      {/* Content based on mode */}
      <Box flexDirection="column" flexGrow={1} width="100%">
        {mode === 'summary' && (
          <Box flexDirection="row" gap={1} width="100%">
            {/* Progress Panel - Grows to fill space */}
            <Box flexDirection="column" flexGrow={1} flexBasis="50%">
              <Panel title="📊 Progress Overview" highlight>
                <Box flexDirection="column" gap={1} flexGrow={1}>
                  <DifficultyProgress
                    easy={{ solved: easy, total: 600 }}
                    medium={{ solved: medium, total: 1300 }}
                    hard={{ solved: hard, total: 500 }}
                    width={35} // Explicit width for bar, but container flexible
                  />
                  <Box marginTop={1} justifyContent="space-between">
                    <Text color={colors.text}>Solved: <Text bold color={colors.primary}>{total}</Text></Text>
                  </Box>
                </Box>
              </Panel>
            </Box>

            {/* Ranking Panel - Grows to fill space */}
            <Box flexDirection="column" flexGrow={1} flexBasis="50%">
              <Panel title="🏆 Ranking">
                <Box flexDirection="column" gap={1} flexGrow={1}>
                  <Box justifyContent="space-between">
                     <Text color={colors.textMuted}>Rank:</Text>
                     <Text color={colors.purple} bold>#{profile.ranking.toLocaleString()}</Text>
                  </Box>
                  <Box justifyContent="space-between">
                     <Text color={colors.textMuted}>Streak:</Text>
                     <Text color={colors.orange} bold>{profile.streak} days {icons.fire}</Text>
                  </Box>
                  <Box justifyContent="space-between">
                     <Text color={colors.textMuted}>Active:</Text>
                     <Text color={colors.success}>{profile.totalActiveDays} days</Text>
                  </Box>
                </Box>
              </Panel>
            </Box>
          </Box>
        )}

        {mode === 'calendar' && (
          <Panel title="📅 Activity Calendar">
            {Object.keys(calendarData).length > 0 ? (
              <ActivityHeatmap calendarData={calendarData} />
            ) : (
              <Text color={colors.textMuted}>No calendar data available</Text>
            )}
          </Panel>
        )}

        {mode === 'skills' && (
          <Panel title="🎯 Skills Breakdown">
            {skillsLoading ? (
              <Box><Text color={colors.primary}><Spinner type="dots" /></Text><Text> Loading skills...</Text></Box>
            ) : skills ? (
              <SkillsBreakdown skills={skills} />
            ) : (
              <Text color={colors.textMuted}>No skills data available</Text>
            )}
          </Panel>
        )}

        {mode === 'trend' && (
          <Panel title="📈 Submission Trend">
            {Object.keys(calendarData).length > 0 ? (
              <TrendChart calendarData={calendarData} />
            ) : (
              <Text color={colors.textMuted}>No trend data available</Text>
            )}
          </Panel>
        )}
      </Box>

      {/* Footer */}
      <Box marginTop={2}>
        <Text color={colors.textMuted} dimColor>
          Press <Text color={colors.primary}>[1-4]</Text> to switch views, <Text color={colors.primary}>[Esc]</Text> to go back
        </Text>
      </Box>
    </Box>
  );
}
