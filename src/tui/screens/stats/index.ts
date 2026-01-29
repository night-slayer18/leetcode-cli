import type { StatsScreenModel, StatsMsg, Command } from '../../types.js';
import { Cmd } from '../../types.js';

export function createInitialModel(): StatsScreenModel {
  return {
    loading: true,
    error: null,
    stats: null,
    dailyChallenge: null,
    skillStats: null,
  };
}

export function init(): [StatsScreenModel, Command] {
  return [createInitialModel(), Cmd.fetchStats()];
}

export function update(msg: StatsMsg, model: StatsScreenModel): [StatsScreenModel, Command] {
  switch (msg.type) {
    case 'STATS_FETCH_START':
      return [{ ...model, loading: true, error: null }, Cmd.none()];

    case 'STATS_FETCH_SUCCESS':
      return [
        {
          ...model,
          loading: false,
          stats: msg.stats,
          dailyChallenge: msg.daily,
          skillStats: msg.skills,
        },
        Cmd.none(),
      ];

    case 'STATS_FETCH_ERROR':
      return [{ ...model, loading: false, error: msg.error }, Cmd.none()];

    case 'STATS_REFRESH':
      return [{ ...model, loading: true, error: null }, Cmd.fetchStats()];

    default:
      return [model, Cmd.none()];
  }
}
