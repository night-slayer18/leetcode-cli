// Timer storage for tracking solve times - workspace-aware
import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname } from 'path';
import { workspaceStorage } from './workspaces.js';

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

function getTimerPath(): string {
  return workspaceStorage.getTimerPath();
}

function loadTimer(): TimerSchema {
  const path = getTimerPath();
  if (existsSync(path)) {
    return JSON.parse(readFileSync(path, 'utf-8'));
  }
  return { solveTimes: {}, activeTimer: null };
}

function saveTimer(data: TimerSchema): void {
  const timerPath = getTimerPath();
  const dir = dirname(timerPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }
  writeFileSync(timerPath, JSON.stringify(data, null, 2));
}

export const timerStorage = {
  startTimer(problemId: string, title: string, difficulty: string, durationMinutes: number): void {
    const data = loadTimer();
    data.activeTimer = {
      problemId,
      title,
      difficulty,
      startedAt: new Date().toISOString(),
      durationMinutes,
    };
    saveTimer(data);
  },

  getActiveTimer() {
    return loadTimer().activeTimer;
  },

  stopTimer(): { durationSeconds: number } | null {
    const data = loadTimer();
    const active = data.activeTimer;
    if (!active) return null;

    const startedAt = new Date(active.startedAt);
    const now = new Date();
    const durationSeconds = Math.floor((now.getTime() - startedAt.getTime()) / 1000);

    data.activeTimer = null;
    saveTimer(data);

    return { durationSeconds };
  },

  recordSolveTime(
    problemId: string,
    title: string,
    difficulty: string,
    durationSeconds: number,
    timerMinutes: number
  ): void {
    const data = loadTimer();

    if (!data.solveTimes[problemId]) {
      data.solveTimes[problemId] = [];
    }

    data.solveTimes[problemId].push({
      problemId,
      title,
      difficulty,
      solvedAt: new Date().toISOString(),
      durationSeconds,
      timerMinutes,
    });

    saveTimer(data);
  },

  getSolveTimes(problemId: string): SolveTimeEntry[] {
    const data = loadTimer();
    return data.solveTimes[problemId] ?? [];
  },

  getAllSolveTimes(): Record<string, SolveTimeEntry[]> {
    return loadTimer().solveTimes ?? {};
  },

  getStats(): { totalProblems: number; totalTime: number; avgTime: number } {
    const solveTimes = loadTimer().solveTimes ?? {};
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
