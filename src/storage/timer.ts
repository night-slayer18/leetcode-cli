// Timer storage for tracking solve times
import Conf from 'conf';
import { homedir } from 'os';
import { join } from 'path';

interface SolveTimeEntry {
  problemId: string;
  title: string;
  difficulty: string;
  solvedAt: string;
  durationSeconds: number;
  timerMinutes: number;
}

interface TimerSchema {
  solveTimes: Record<string, SolveTimeEntry[]>;
  activeTimer: {
    problemId: string;
    title: string;
    difficulty: string;
    startedAt: string;
    durationMinutes: number;
  } | null;
}

const timerStore = new Conf<TimerSchema>({
  projectName: 'leetcode-cli-timer',
  cwd: join(homedir(), '.leetcode'),
  defaults: {
    solveTimes: {},
    activeTimer: null,
  },
});

export const timerStorage = {
  startTimer(problemId: string, title: string, difficulty: string, durationMinutes: number): void {
    timerStore.set('activeTimer', {
      problemId,
      title,
      difficulty,
      startedAt: new Date().toISOString(),
      durationMinutes,
    });
  },

  getActiveTimer() {
    return timerStore.get('activeTimer');
  },

  stopTimer(): { durationSeconds: number } | null {
    const active = timerStore.get('activeTimer');
    if (!active) return null;

    const startedAt = new Date(active.startedAt);
    const now = new Date();
    const durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

    timerStore.set('activeTimer', null);

    return { durationSeconds };
  },

  recordSolveTime(
    problemId: string,
    title: string,
    difficulty: string,
    durationSeconds: number,
    timerMinutes: number
  ): void {
    const solveTimes = timerStore.get('solveTimes') ?? {};
    
    if (!solveTimes[problemId]) {
      solveTimes[problemId] = [];
    }

    solveTimes[problemId].push({
      problemId,
      title,
      difficulty,
      solvedAt: new Date().toISOString(),
      durationSeconds,
      timerMinutes,
    });

    timerStore.set('solveTimes', solveTimes);
  },

  getSolveTimes(problemId: string): SolveTimeEntry[] {
    const solveTimes = timerStore.get('solveTimes') ?? {};
    return solveTimes[problemId] ?? [];
  },

  getAllSolveTimes(): Record<string, SolveTimeEntry[]> {
    return timerStore.get('solveTimes') ?? {};
  },

  getStats(): { totalProblems: number; totalTime: number; avgTime: number } {
    const solveTimes = timerStore.get('solveTimes') ?? {};
    let totalProblems = 0;
    let totalTime = 0;

    for (const times of Object.values(solveTimes)) {
      totalProblems += times.length;
      for (const t of times) {
        totalTime += t.durationSeconds;
      }
    }

    return {
      totalProblems,
      totalTime,
      avgTime: totalProblems > 0 ? Math.floor(totalTime / totalProblems) : 0,
    };
  },
};
