

import type { TimerScreenModel, TimerMsg, Command } from '../../types.js';
import { Cmd } from '../../types.js';

const DEFAULT_DURATION = 40 * 60; 

export function createInitialModel(): TimerScreenModel {
  return {
    problemId: null,
    problemTitle: 'Custom Session',
    difficulty: 'Medium', 
    remainingSeconds: DEFAULT_DURATION,
    totalSeconds: DEFAULT_DURATION,
    status: 'idle',
    viewMode: 'timer'
  };
}

export function init(problem?: { id: string, title: string, difficulty: 'Easy'|'Medium'|'Hard' }): [TimerScreenModel, Command] {
  const model = createInitialModel();
  if (problem) {
    return [{
      ...model,
      problemId: problem.id,
      problemTitle: problem.title,
      difficulty: problem.difficulty
    }, Cmd.none()];
  }
  return [model, Cmd.none()];
}

export function update(msg: TimerMsg, model: TimerScreenModel): [TimerScreenModel, Command] {
  switch (msg.type) {
    case 'TIMER_START':
      if (model.status === 'running') return [model, Cmd.none()];
      return [{ ...model, status: 'running' }, Cmd.startTimer(1000)];

    case 'TIMER_PAUSE':
      if (model.status !== 'running') return [model, Cmd.none()];
      return [{ ...model, status: 'paused' }, Cmd.stopTimer()];

    case 'TIMER_RESET':
      return [{ 
        ...model, 
        remainingSeconds: model.totalSeconds, 
        status: 'idle' 
      }, Cmd.stopTimer()];

    case 'TIMER_TICK':
      if (model.status !== 'running') return [model, Cmd.none()];
      
      if (model.remainingSeconds <= 1) {
        return [{
           ...model,
           remainingSeconds: 0,
           status: 'completed'
        }, Cmd.stopTimer()];
      }

      return [{
        ...model,
        remainingSeconds: model.remainingSeconds - 1
      }, Cmd.none()];

    case 'TIMER_COMPLETE':
      return [{ ...model, status: 'completed' }, Cmd.stopTimer()];

    case 'TIMER_SWITCH_VIEW':
      return [{ ...model, viewMode: msg.view }, Cmd.none()];

    default:
      return [model, Cmd.none()];
  }
}
