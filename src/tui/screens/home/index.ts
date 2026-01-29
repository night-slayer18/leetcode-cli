

import type { HomeScreenModel, HomeMsg, Command } from '../../types.js';
import { Cmd } from '../../types.js';

export const MENU_ITEMS = [
  { key: 'l', label: 'Problem List', description: 'Browse and search problems' },
  { key: 'd', label: 'Daily Challenge', description: "Today's daily problem" },
  { key: 'r', label: 'Random Problem', description: 'Pick a random problem' },
  { key: 'b', label: 'Bookmarks', description: 'View bookmarked problems' },
  { key: 't', label: 'Timer', description: 'Practice timer' },
  { key: 's', label: 'Statistics', description: 'View your progress' },
  { key: 'y', label: 'Sync', description: 'Sync solutions to GitHub' },
  { key: 'w', label: 'Workspaces', description: 'Manage workspaces' },
  { key: 'c', label: 'Config', description: 'Settings and preferences' },
  { key: 'v', label: 'Changelog', description: "What's new in this version" },
  { key: 'L', label: 'Logout', description: 'Sign out of LeetCode' },
  { key: '?', label: 'Help', description: 'Keyboard shortcuts and help' },
];

export function createInitialModel(): HomeScreenModel {
  return { menuIndex: 0 };
}

export function update(msg: HomeMsg, model: HomeScreenModel): [HomeScreenModel, Command] {
  switch (msg.type) {
    case 'HOME_MENU_UP': {
      const newIndex = Math.max(0, model.menuIndex - 1);
      return [{ ...model, menuIndex: newIndex }, Cmd.none()];
    }

    case 'HOME_MENU_DOWN': {
      const newIndex = Math.min(MENU_ITEMS.length - 1, model.menuIndex + 1);
      return [{ ...model, menuIndex: newIndex }, Cmd.none()];
    }

    case 'HOME_MENU_SELECT':
      
      return [model, Cmd.none()];

    default:
      return [model, Cmd.none()];
  }
}
