/**
 * Timer Screen
 * Interview timer with live countdown and problem context
 */
import { Box, Text, useInput, useApp } from 'ink';
import { useState, useEffect, useCallback, JSX } from 'react';
import { Panel } from '../components/Panel.js';
import { colors, icons } from '../theme.js';

interface TimerScreenProps {
  problemId?: number;
  problemTitle?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  onBack: () => void;
  onComplete: () => void;
}

// Default time limits by difficulty (in minutes)
const DEFAULT_TIMES = {
  Easy: 20,
  Medium: 40,
  Hard: 60,
};

// Format seconds to MM:SS
function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

// ASCII art for large timer display
function getAsciiDigit(digit: string): string[] {
  const digits: Record<string, string[]> = {
    '0': ['█████', '█   █', '█   █', '█   █', '█████'],
    '1': ['  █  ', ' ██  ', '  █  ', '  █  ', '█████'],
    '2': ['█████', '    █', '█████', '█    ', '█████'],
    '3': ['█████', '    █', '█████', '    █', '█████'],
    '4': ['█   █', '█   █', '█████', '    █', '    █'],
    '5': ['█████', '█    ', '█████', '    █', '█████'],
    '6': ['█████', '█    ', '█████', '█   █', '█████'],
    '7': ['█████', '    █', '   █ ', '  █  ', '  █  '],
    '8': ['█████', '█   █', '█████', '█   █', '█████'],
    '9': ['█████', '█   █', '█████', '    █', '█████'],
    ':': ['     ', '  █  ', '     ', '  █  ', '     '],
  };
  return digits[digit] || ['     ', '     ', '     ', '     ', '     '];
}

function renderAsciiTime(time: string, color: string): JSX.Element[] {
  const rows: JSX.Element[] = [];
  for (let row = 0; row < 5; row++) {
    const line = time.split('').map(char => getAsciiDigit(char)[row]).join(' ');
    rows.push(
      <Text key={row} color={color}>
        {line}
      </Text>
    );
  }
  return rows;
}

type TimerStatus = 'idle' | 'running' | 'paused' | 'completed' | 'overtime';

export function TimerScreen({
  problemId,
  problemTitle = 'Practice Session',
  difficulty = 'Medium',
  onBack,
  onComplete,
}: TimerScreenProps) {
  const { exit } = useApp();
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [totalSeconds, setTotalSeconds] = useState(DEFAULT_TIMES[difficulty] * 60);
  const [remainingSeconds, setRemainingSeconds] = useState(totalSeconds);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Timer tick
  useEffect(() => {
    if (status !== 'running') return;

    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          setStatus('overtime');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [status]);

  // Keyboard controls
  useInput((input, key) => {
    if (key.escape) {
      onBack();
    }
    if (input === ' ' || input === 'p') {
      // Space or P to pause/resume
      if (status === 'idle' || status === 'paused') {
        setStatus('running');
      } else if (status === 'running') {
        setStatus('paused');
      }
    }
    if (input === 'r') {
      // Reset timer
      setStatus('idle');
      setRemainingSeconds(totalSeconds);
      setElapsedSeconds(0);
    }
    if (input === 's') {
      // Start
      setStatus('running');
    }
    if (input === 'c') {
      // Complete
      setStatus('completed');
      onComplete();
    }
  });

  // Timer color based on remaining time
  const getTimerColor = () => {
    if (status === 'overtime') return colors.error;
    if (status === 'paused') return colors.warning;
    if (status === 'completed') return colors.success;
    const percentRemaining = remainingSeconds / totalSeconds;
    if (percentRemaining <= 0.1) return colors.error;
    if (percentRemaining <= 0.25) return colors.warning;
    return colors.primary;
  };

  const timerColor = getTimerColor();
  const displayTime = status === 'overtime' 
    ? `-${formatTime(elapsedSeconds - totalSeconds)}`
    : formatTime(remainingSeconds);

  const difficultyColor = {
    Easy: colors.success,
    Medium: colors.warning,
    Hard: colors.error,
  }[difficulty];

  return (
    <Box flexDirection="column" alignItems="center" justifyContent="center" flexGrow={1}>
      {/* Problem Info */}
      <Box marginBottom={2}>
        {problemId && (
          <Text color={colors.textMuted}>#{problemId} </Text>
        )}
        <Text color={colors.textBright} bold>
          {problemTitle}
        </Text>
        <Text color={difficultyColor}> [{difficulty}]</Text>
      </Box>

      {/* Status */}
      <Box marginBottom={1}>
        <Text color={timerColor} bold>
          {status === 'idle' && `${icons.clock} Ready to start`}
          {status === 'running' && `${icons.lightning} Running`}
          {status === 'paused' && `⏸ Paused`}
          {status === 'overtime' && `${icons.fire} OVERTIME!`}
          {status === 'completed' && `${icons.check} Completed!`}
        </Text>
      </Box>

      {/* Large ASCII Timer */}
      <Panel title={status === 'overtime' ? '⚠️ Time Exceeded' : '⏱ Time Remaining'}>
        <Box flexDirection="column" alignItems="center" paddingX={2} paddingY={1}>
          {renderAsciiTime(displayTime.replace('-', ''), timerColor)}
        </Box>
      </Panel>

      {/* Elapsed time */}
      <Box marginTop={2}>
        <Text color={colors.textMuted}>
          Elapsed: {formatTime(elapsedSeconds)} / {formatTime(totalSeconds)}
        </Text>
      </Box>

      {/* Progress bar */}
      <Box marginTop={1} width={50}>
        <Text color={timerColor}>
          {'█'.repeat(Math.floor((1 - remainingSeconds / totalSeconds) * 50))}
        </Text>
        <Text color={colors.textDim}>
          {'░'.repeat(Math.ceil((remainingSeconds / totalSeconds) * 50))}
        </Text>
      </Box>

      {/* Controls */}
      <Box marginTop={2} flexDirection="column" alignItems="center">
        <Text color={colors.textMuted}>
          {status === 'idle' || status === 'paused' ? (
            <>
              <Text color={colors.primary}>[Space/s]</Text> Start{' '}
            </>
          ) : status === 'running' ? (
            <>
              <Text color={colors.primary}>[Space/p]</Text> Pause{' '}
            </>
          ) : null}
          <Text color={colors.primary}>[r]</Text> Reset{' '}
          <Text color={colors.primary}>[c]</Text> Complete{' '}
          <Text color={colors.primary}>[Esc]</Text> Back
        </Text>
      </Box>
    </Box>
  );
}
