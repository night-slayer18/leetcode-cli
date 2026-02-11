import type {
  AppModel,
  AppMsg,
  Command,
  ScreenState,
  ListMsg,
  HomeMsg,
  TimerMsg,
  StatsMsg,
  ConfigMsg,
  HelpMsg,
} from './types.js';
import { Cmd } from './types.js';
import * as ListScreen from './screens/list/index.js';
import * as HomeScreen from './screens/home/index.js';
import * as TimerScreen from './screens/timer/index.js';
import * as StatsScreen from './screens/stats/index.js';
import * as ConfigScreen from './screens/config/index.js';
import * as ProblemScreen from './screens/problem/index.js';
import * as WorkspaceScreen from './screens/workspace/index.js';
import * as ChangelogScreen from './screens/changelog/index.js';
import * as LoginScreen from './screens/login/index.js';
import { estimateHelpMaxScroll } from './view.js';

export function update(msg: AppMsg, model: AppModel): [AppModel, Command] {
  switch (msg.type) {
    case 'INIT':
      return [{ ...model, needsRender: true }, Cmd.checkAuth()];

    case 'KEY_PRESS': {
      const { key } = msg;

      if (key.ctrl && key.name === 'c') {
        return [model, Cmd.exit()];
      }

      if (key.name === 'q' && model.screenState.screen === 'home') {
        return [model, Cmd.exit()];
      }

      if (key.name === '?') {
        if (model.screenState.screen === 'help') {
          return [{ ...model, ...goBack(model), needsRender: true }, Cmd.none()];
        }
        return [
          {
            ...model,
            ...navigateTo(model, { screen: 'help', model: { scrollOffset: 0 } }),
            needsRender: true,
          },
          Cmd.none(),
        ];
      }

      if (key.name === 'escape' && model.screenState.screen !== 'home') {
        if (model.screenState.screen === 'config' && model.screenState.model.isEditing) {
          return handleScreenKeyPress(model, msg);
        }

        if (model.screenState.screen === 'problem') {
          const probModel = model.screenState.model as import('./types.js').ProblemScreenModel;
          if (probModel.activePanel !== 'none') {
            const [newProbModel, cmd] = ProblemScreen.update(
              { type: 'PROBLEM_CLOSE_RESULT' },
              probModel,
              model.terminalHeight,
              model.terminalWidth
            );

            return [
              {
                ...model,
                screenState: { screen: 'problem', model: newProbModel },
                needsRender: true,
              },
              cmd,
            ];
          }
        }

        if (model.screenState.screen === 'workspace') {
          const wsModel = model.screenState.model as import('./types.js').WorkspaceScreenModel;
          if (wsModel.showCreateInput || wsModel.showDeleteConfirm || wsModel.isEditing) {
            return handleScreenKeyPress(model, msg);
          }
        }

        if (model.screenState.screen === 'login') {
          return handleScreenKeyPress(model, msg);
        }

        return [{ ...model, ...goBack(model), needsRender: true }, Cmd.none()];
      }

      return handleScreenKeyPress(model, msg);
    }

    case 'RESIZE':
      return [
        { ...model, terminalWidth: msg.width, terminalHeight: msg.height, needsRender: true },
        Cmd.none(),
      ];

    case 'NAVIGATE':
      return [{ ...model, ...navigateTo(model, msg.to), needsRender: true }, Cmd.none()];

    case 'GO_BACK':
      return [{ ...model, ...goBack(model), needsRender: true }, Cmd.none()];

    case 'AUTH_CHECK_COMPLETE':
      if (msg.user) {
        return [
          {
            ...model,
            isCheckingAuth: false,
            user: { username: msg.user.username, isLoggedIn: true },
            needsRender: true,
          },
          Cmd.none(),
        ];
      }

      return [
        {
          ...model,
          isCheckingAuth: false,
          user: null,
          screenState: {
            screen: 'login',
            model: {
              step: 'instructions',
              sessionToken: '',
              csrfToken: '',
              focusedField: 'session',
              error: null,
            },
          },
          needsRender: true,
        },
        Cmd.none(),
      ];

    case 'GLOBAL_ERROR':
      return [{ ...model, globalError: msg.error, needsRender: true }, Cmd.none()];

    case 'CLEAR_ERROR':
      return [{ ...model, globalError: null, needsRender: true }, Cmd.none()];

    case 'FETCH_DAILY_SUCCESS': {
      const [problemModel, problemCmd] = ProblemScreen.init(msg.slug);
      return [
        {
          ...model,
          ...navigateTo(model, { screen: 'problem', model: problemModel }),
          needsRender: true,
        },
        problemCmd,
      ];
    }

    case 'FETCH_RANDOM_SUCCESS': {
      const [problemModel, problemCmd] = ProblemScreen.init(msg.slug);
      return [
        {
          ...model,
          ...navigateTo(model, { screen: 'problem', model: problemModel }),
          needsRender: true,
        },
        problemCmd,
      ];
    }

    case 'QUIT':
      return [model, Cmd.exit()];

    case 'LOGIN_SUCCESS':
      return [
        {
          ...model,
          user: { username: msg.username, isLoggedIn: true },
          screenState: { screen: 'home', model: { menuIndex: 0 } },
          needsRender: true,
        },
        Cmd.none(),
      ];

    default:
      return delegateToScreen(msg, model);
  }
}

function navigateTo(model: AppModel, to: ScreenState): Partial<AppModel> {
  return {
    screenState: to,
    history: [...model.history, model.screenState],
  };
}

function goBack(model: AppModel): Partial<AppModel> {
  if (model.history.length === 0) {
    return { screenState: { screen: 'home', model: { menuIndex: 0 } } };
  }

  const history = [...model.history];
  const previous = history.pop()!;

  return { screenState: previous, history };
}

function handleScreenKeyPress(model: AppModel, msg: AppMsg): [AppModel, Command] {
  const { screenState } = model;

  switch (screenState.screen) {
    case 'home':
      return handleHomeKeyPress(model, msg);

    case 'list':
      return handleListKeyPress(model, msg);

    case 'problem':
      return handleProblemKeyPress(model, msg);

    case 'timer':
    case 'stats':
    case 'config':
      return handleGenericKeyPress(model, msg);
    case 'help':
      return handleHelpKeyPress(model, msg);
    case 'workspace':
      return handleWorkspaceKeyPress(model, msg);
    case 'changelog':
      return handleChangelogKeyPress(model, msg);
    case 'login':
      return handleLoginKeyPress(model, msg);
    default:
      return [model, Cmd.none()];
  }
}

function handleHomeKeyPress(model: AppModel, msg: AppMsg): [AppModel, Command] {
  if (msg.type !== 'KEY_PRESS') return [model, Cmd.none()];

  const { key } = msg;
  const homeModel = model.screenState.model as { menuIndex: number };

  if (key.name === 'l') {
    const [listModel, listCmd] = ListScreen.init();
    return [
      { ...model, ...navigateTo(model, { screen: 'list', model: listModel }), needsRender: true },
      listCmd,
    ];
  }

  if (key.name === 'd') {
    return [model, Cmd.fetchDaily()];
  }

  if (key.name === 'r') {
    return [model, Cmd.fetchRandom()];
  }

  if (key.name === 'b') {
    const [listModel, listCmd] = ListScreen.init();
    return [
      {
        ...model,
        ...navigateTo(model, { screen: 'list', model: { ...listModel, bookmarkFilter: true } }),
        needsRender: true,
      },
      listCmd,
    ];
  }

  if (key.name === 't') {
    return [
      {
        ...model,
        ...navigateTo(model, {
          screen: 'timer',
          model: {
            problemId: null,
            problemTitle: 'Practice',
            difficulty: 'Medium',
            remainingSeconds: 2400,
            totalSeconds: 2400,
            status: 'idle',
            viewMode: 'timer',
          },
        }),
        needsRender: true,
      },
      Cmd.none(),
    ];
  }

  if (key.name === 's') {
    const [statsModel, statsCmd] = StatsScreen.init();
    return [
      { ...model, ...navigateTo(model, { screen: 'stats', model: statsModel }), needsRender: true },
      statsCmd,
    ];
  }

  if (key.name === 'y') {
    return [
      {
        ...model,
        globalError: 'Use CLI command: leet sync (requires terminal interaction)',
        needsRender: true,
      },
      Cmd.none(),
    ];
  }

  if (key.name === 'w') {
    const [workspaceModel, workspaceCmd] = WorkspaceScreen.init();
    return [
      {
        ...model,
        ...navigateTo(model, { screen: 'workspace', model: workspaceModel }),
        needsRender: true,
      },
      workspaceCmd,
    ];
  }

  if (key.name === 'c') {
    const [configModel, configCmd] = ConfigScreen.init();
    return [
      {
        ...model,
        ...navigateTo(model, { screen: 'config', model: configModel }),
        needsRender: true,
      },
      configCmd,
    ];
  }

  if (key.name === '?') {
    return [
      {
        ...model,
        ...navigateTo(model, { screen: 'help', model: { scrollOffset: 0 } }),
        needsRender: true,
      },
      Cmd.none(),
    ];
  }

  if (key.name === 'v') {
    const [changelogModel, changelogCmd] = ChangelogScreen.init();
    return [
      {
        ...model,
        ...navigateTo(model, { screen: 'changelog', model: changelogModel }),
        needsRender: true,
      },
      changelogCmd,
    ];
  }

  if (key.name === 'L') {
    return [model, Cmd.logout()];
  }

  if (key.name === 'j' || key.name === 'down') {
    const [newScreenModel, cmd] = HomeScreen.update({ type: 'HOME_MENU_DOWN' }, homeModel);
    return [
      { ...model, screenState: { screen: 'home', model: newScreenModel }, needsRender: true },
      cmd,
    ];
  }

  if (key.name === 'k' || key.name === 'up') {
    const [newScreenModel, cmd] = HomeScreen.update({ type: 'HOME_MENU_UP' }, homeModel);
    return [
      { ...model, screenState: { screen: 'home', model: newScreenModel }, needsRender: true },
      cmd,
    ];
  }

  if (key.name === 'return') {
    const menuActions = ['l', 'd', 'r', 'b', 't', 's', 'y', 'w', 'c', 'v', 'L', '?'];
    const actionKey = menuActions[homeModel.menuIndex];
    if (actionKey) {
      return handleHomeKeyPress(model, {
        type: 'KEY_PRESS',
        key: { name: actionKey, sequence: actionKey, ctrl: false, meta: false, shift: false },
      });
    }
  }

  return [model, Cmd.none()];
}

function handleListKeyPress(model: AppModel, msg: AppMsg): [AppModel, Command] {
  if (msg.type !== 'KEY_PRESS') return [model, Cmd.none()];

  const { key } = msg;
  const listModel = model.screenState.model as import('./types.js').ListScreenModel;

  let listMsg: ListMsg | null = null;

  if (listModel.searchMode) {
    if (key.name === 'escape') {
      listMsg = { type: 'LIST_SEARCH_CANCEL' };
    } else if (key.name === 'return') {
      listMsg = { type: 'LIST_SEARCH_SUBMIT' };
    } else if (key.name === 'backspace') {
      listMsg = { type: 'LIST_SEARCH_BACKSPACE' };
    } else if (key.sequence.length === 1 && !key.ctrl && !key.meta) {
      listMsg = { type: 'LIST_SEARCH_INPUT', char: key.sequence };
    }
  } else {
    if (key.name === 'j' || key.name === 'down') {
      listMsg = { type: 'LIST_CURSOR_DOWN' };
    } else if (key.name === 'k' || key.name === 'up') {
      listMsg = { type: 'LIST_CURSOR_UP' };
    } else if (key.name === 'g') {
      listMsg = { type: 'LIST_GO_TOP' };
    } else if (key.name === 'G') {
      listMsg = { type: 'LIST_GO_BOTTOM' };
    } else if (key.name === '/') {
      listMsg = { type: 'LIST_SEARCH_START' };
    } else if (key.name === 'return') {
      const problem = listModel.problems[listModel.cursor];
      if (problem) {
        const [problemModel, problemCmd] = ProblemScreen.init(problem.titleSlug);
        return [
          {
            ...model,
            ...navigateTo(model, { screen: 'problem', model: problemModel }),
            needsRender: true,
          },
          problemCmd,
        ];
      }
      listMsg = { type: 'LIST_SELECT' };
    } else if (key.name === '1') {
      listMsg = {
        type: 'LIST_FILTER_DIFFICULTY',
        difficulty: listModel.difficultyFilter === 'Easy' ? null : 'Easy',
      };
    } else if (key.name === '2') {
      listMsg = {
        type: 'LIST_FILTER_DIFFICULTY',
        difficulty: listModel.difficultyFilter === 'Medium' ? null : 'Medium',
      };
    } else if (key.name === '3') {
      listMsg = {
        type: 'LIST_FILTER_DIFFICULTY',
        difficulty: listModel.difficultyFilter === 'Hard' ? null : 'Hard',
      };
    } else if (key.name === 's') {
      listMsg = {
        type: 'LIST_FILTER_STATUS',
        status: listModel.statusFilter === 'solved' ? null : 'solved',
      };
    } else if (key.name === 'a') {
      listMsg = {
        type: 'LIST_FILTER_STATUS',
        status: listModel.statusFilter === 'attempted' ? null : 'attempted',
      };
    } else if (key.name === 'b') {
      listMsg = { type: 'LIST_FILTER_BOOKMARKS' };
    } else if (key.name === 'c') {
      listMsg = { type: 'LIST_CLEAR_FILTERS' };
    } else if (key.name === 'R') {
      listMsg = { type: 'LIST_REFRESH' };
    }
  }

  if (listMsg) {
    const [newScreenModel, cmd] = ListScreen.update(listMsg, listModel, model.terminalHeight);
    return [
      { ...model, screenState: { screen: 'list', model: newScreenModel }, needsRender: true },
      cmd,
    ];
  }

  return [model, Cmd.none()];
}

function delegateToScreen(msg: AppMsg, model: AppModel): [AppModel, Command] {
  const { screenState } = model;
  const terminalHeight = model.terminalHeight;

  switch (screenState.screen) {
    case 'list': {
      if (!isListMsg(msg)) return [model, Cmd.none()];
      const [newScreenModel, cmd] = ListScreen.update(msg, screenState.model, terminalHeight);
      return [
        { ...model, screenState: { screen: 'list', model: newScreenModel }, needsRender: true },
        cmd,
      ];
    }

    case 'home': {
      if (!isHomeMsg(msg)) return [model, Cmd.none()];
      const [newScreenModel, cmd] = HomeScreen.update(msg, screenState.model);
      return [
        { ...model, screenState: { screen: 'home', model: newScreenModel }, needsRender: true },
        cmd,
      ];
    }

    case 'timer': {
      if (!isTimerMsg(msg)) return [model, Cmd.none()];
      const [newScreenModel, cmd] = TimerScreen.update(msg, screenState.model);
      return [
        { ...model, screenState: { screen: 'timer', model: newScreenModel }, needsRender: true },
        cmd,
      ];
    }

    case 'stats': {
      if (!isStatsMsg(msg)) return [model, Cmd.none()];
      const [newScreenModel, cmd] = StatsScreen.update(msg, screenState.model);
      return [
        { ...model, screenState: { screen: 'stats', model: newScreenModel }, needsRender: true },
        cmd,
      ];
    }

    case 'config': {
      if (!isConfigMsg(msg)) return [model, Cmd.none()];
      const [newScreenModel, cmd] = ConfigScreen.update(msg, screenState.model);
      return [
        { ...model, screenState: { screen: 'config', model: newScreenModel }, needsRender: true },
        cmd,
      ];
    }

    case 'help': {
      if (!isHelpMsg(msg)) return [model, Cmd.none()];
      const helpModel = screenState.model as import('./types.js').HelpScreenModel;
      const maxScroll = estimateHelpMaxScroll(model.terminalWidth, model.terminalHeight - 4);
      const pageSize = Math.max(3, Math.floor((model.terminalHeight - 4) / 2));
      let nextOffset = helpModel.scrollOffset;

      switch (msg.type) {
        case 'HELP_SCROLL_UP':
          nextOffset = Math.max(0, helpModel.scrollOffset - 1);
          break;
        case 'HELP_SCROLL_DOWN':
          nextOffset = Math.min(maxScroll, helpModel.scrollOffset + 1);
          break;
        case 'HELP_PAGE_UP':
          nextOffset = Math.max(0, helpModel.scrollOffset - pageSize);
          break;
        case 'HELP_PAGE_DOWN':
          nextOffset = Math.min(maxScroll, helpModel.scrollOffset + pageSize);
          break;
        case 'HELP_TOP':
          nextOffset = 0;
          break;
        case 'HELP_BOTTOM':
          nextOffset = maxScroll;
          break;
      }

      return [
        {
          ...model,
          screenState: { screen: 'help', model: { scrollOffset: nextOffset } },
          needsRender: true,
        },
        Cmd.none(),
      ];
    }

    case 'workspace': {
      if (!isWorkspaceMsg(msg)) return [model, Cmd.none()];
      const [newScreenModel, cmd] = WorkspaceScreen.update(msg, screenState.model);
      return [
        {
          ...model,
          screenState: { screen: 'workspace', model: newScreenModel },
          needsRender: true,
        },
        cmd,
      ];
    }

    case 'problem': {
      if (!isProblemMsg(msg)) return [model, Cmd.none()];
      const [newScreenModel, cmd] = ProblemScreen.update(
        msg,
        screenState.model,
        terminalHeight,
        model.terminalWidth
      );
      return [
        { ...model, screenState: { ...screenState, model: newScreenModel }, needsRender: true },
        cmd,
      ];
    }

    case 'changelog': {
      if (!isChangelogMsg(msg)) return [model, Cmd.none()];
      const [newScreenModel, cmd] = ChangelogScreen.update(
        msg,
        screenState.model,
        terminalHeight,
        model.terminalWidth
      );
      return [
        {
          ...model,
          screenState: { screen: 'changelog', model: newScreenModel },
          needsRender: true,
        },
        cmd,
      ];
    }

    case 'login': {
      if (!isLoginMsg(msg)) return [model, Cmd.none()];
      const [newScreenModel, cmd] = LoginScreen.update(msg, screenState.model);
      return [
        { ...model, screenState: { screen: 'login', model: newScreenModel }, needsRender: true },
        cmd,
      ];
    }

    default:
      return [model, Cmd.none()];
  }
}

function handleProblemKeyPress(model: AppModel, msg: AppMsg): [AppModel, Command] {
  if (msg.type !== 'KEY_PRESS') return [model, Cmd.none()];
  const { key } = msg;

  const problemModel = model.screenState.model as import('./types.js').ProblemScreenModel;
  let problemMsg: import('./types.js').ProblemMsg | null = null;

  const globalActionMsg = mapProblemGlobalAction(key.name);
  if (globalActionMsg) {
    problemMsg = globalActionMsg;
  }

  if (!problemMsg && problemModel.activePanel === 'snapshots') {
    if (key.name === 'j' || key.name === 'down') problemMsg = { type: 'PROBLEM_SNAPSHOT_DOWN' };
    else if (key.name === 'k' || key.name === 'up') problemMsg = { type: 'PROBLEM_SNAPSHOT_UP' };
    else if (key.name === 'd') problemMsg = { type: 'PROBLEM_DIFF_SNAPSHOT' };
    else if (key.name === 'r') problemMsg = { type: 'PROBLEM_RESTORE_SNAPSHOT' };
    else if (key.name === 'V' || key.name === 'v' || key.name === 'escape')
      problemMsg = { type: 'PROBLEM_CLOSE_SNAPSHOTS' };
  } else if (!problemMsg && problemModel.activePanel === 'note') {
    if (key.name === 'e') problemMsg = { type: 'PROBLEM_NOTES' };
    else if (key.name === 'n' || key.name === 'escape') problemMsg = { type: 'PROBLEM_CLOSE_NOTE' };
    else if (key.name === 'j' || key.name === 'down')
      problemMsg = { type: 'PROBLEM_NOTE_SCROLL_DOWN' };
    else if (key.name === 'k' || key.name === 'up') problemMsg = { type: 'PROBLEM_NOTE_SCROLL_UP' };
  } else if (!problemMsg && problemModel.activePanel === 'diff') {
    if (key.name === 'd' || key.name === 'escape') problemMsg = { type: 'PROBLEM_CLOSE_DIFF' };
    else if (key.name === 'j' || key.name === 'down')
      problemMsg = { type: 'PROBLEM_DIFF_SCROLL_DOWN' };
    else if (key.name === 'k' || key.name === 'up') problemMsg = { type: 'PROBLEM_DIFF_SCROLL_UP' };
  } else if (!problemMsg && problemModel.activePanel === 'submissions') {
    if (key.name === 'H' || key.name === 'S' || key.name === 'escape')
      problemMsg = { type: 'PROBLEM_CLOSE_SUBMISSIONS' };
    else if (key.name === 'j' || key.name === 'down')
      problemMsg = { type: 'PROBLEM_SUBMISSIONS_SCROLL_DOWN' };
    else if (key.name === 'k' || key.name === 'up')
      problemMsg = { type: 'PROBLEM_SUBMISSIONS_SCROLL_UP' };
  } else if (!problemMsg && problemModel.activePanel === 'hint') {
    if (key.name === 'left') problemMsg = { type: 'PROBLEM_PREV_HINT' };
    else if (key.name === 'right') problemMsg = { type: 'PROBLEM_NEXT_HINT' };
    else if (key.name === 'h' || key.name === 'escape') problemMsg = { type: 'PROBLEM_TOGGLE_HINT' };
    else if (key.name === 'j' || key.name === 'down')
      problemMsg = { type: 'PROBLEM_HINT_SCROLL_DOWN' };
    else if (key.name === 'k' || key.name === 'up') problemMsg = { type: 'PROBLEM_HINT_SCROLL_UP' };
  } else if (
    !problemMsg &&
    (problemModel.activePanel === 'status' ||
      problemModel.activePanel === 'testResult' ||
      problemModel.activePanel === 'submitResult')
  ) {
    if (key.name === 'escape') problemMsg = { type: 'PROBLEM_CLOSE_RESULT' };
  } else if (!problemMsg) {
    if (key.name === 'j' || key.name === 'down') {
      problemMsg = { type: 'PROBLEM_SCROLL_DOWN' };
    } else if (key.name === 'k' || key.name === 'up') {
      problemMsg = { type: 'PROBLEM_SCROLL_UP' };
    } else if (key.name === 'pagedown') {
      problemMsg = { type: 'PROBLEM_PAGE_DOWN' };
    } else if (key.name === 'pageup') {
      problemMsg = { type: 'PROBLEM_PAGE_UP' };
    } else if (key.name === 'g') {
      problemMsg = { type: 'PROBLEM_TOP' };
    } else if (key.name === 'G') {
      problemMsg = { type: 'PROBLEM_BOTTOM' };
    } else if (key.name === 'p') {
      problemMsg = { type: 'PROBLEM_PICK' };
    } else if (key.name === 't') {
      problemMsg = { type: 'PROBLEM_TEST' };
    } else if (key.name === 's') {
      problemMsg = { type: 'PROBLEM_SUBMIT' };
    } else if (key.name === 'b') {
      problemMsg = { type: 'PROBLEM_BOOKMARK' };
    } else if (key.name === 'n') {
      problemMsg = { type: 'PROBLEM_VIEW_NOTE' };
    } else if (key.name === 'e') {
      problemMsg = { type: 'PROBLEM_NOTES' };
    } else if (key.name === 'h') {
      problemMsg = { type: 'PROBLEM_TOGGLE_HINT' };
    } else if (key.name === 'H' || key.name === 'S') {
      problemMsg = { type: 'PROBLEM_SHOW_SUBMISSIONS' };
    } else if (key.name === 'v' || key.name === 'w') {
      problemMsg = { type: 'PROBLEM_SHOW_SNAPSHOTS' };
    }
  }

  if (problemMsg) {
    const [newScreenModel, cmd] = ProblemScreen.update(
      problemMsg,
      problemModel,
      model.terminalHeight,
      model.terminalWidth
    );
    return [
      { ...model, screenState: { screen: 'problem', model: newScreenModel }, needsRender: true },
      cmd,
    ];
  }

  return [model, Cmd.none()];
}

function mapProblemGlobalAction(
  keyName: string
): import('./types.js').ProblemMsg | null {
  if (keyName === 'p') return { type: 'PROBLEM_PICK' };
  if (keyName === 't') return { type: 'PROBLEM_TEST' };
  if (keyName === 's') return { type: 'PROBLEM_SUBMIT' };
  if (keyName === 'b') return { type: 'PROBLEM_BOOKMARK' };
  if (keyName === 'n') return { type: 'PROBLEM_VIEW_NOTE' };
  if (keyName === 'e') return { type: 'PROBLEM_NOTES' };
  if (keyName === 'h') return { type: 'PROBLEM_TOGGLE_HINT' };
  if (keyName === 'H' || keyName === 'S') return { type: 'PROBLEM_SHOW_SUBMISSIONS' };
  if (keyName === 'v' || keyName === 'V' || keyName === 'w')
    return { type: 'PROBLEM_SHOW_SNAPSHOTS' };
  return null;
}

function handleGenericKeyPress(model: AppModel, msg: AppMsg): [AppModel, Command] {
  if (msg.type !== 'KEY_PRESS') return [model, Cmd.none()];
  const { key } = msg;
  const { screenState } = model;

  if (screenState.screen === 'timer') {
    const timerModel = screenState.model;
    if (key.name === 'space') {
      const [newModel, cmd] = TimerScreen.update(
        { type: timerModel.status === 'running' ? 'TIMER_PAUSE' : 'TIMER_START' },
        timerModel
      );
      return [
        { ...model, screenState: { ...screenState, model: newModel }, needsRender: true },
        cmd,
      ];
    }
    if (key.name === 'r') {
      const [newModel, cmd] = TimerScreen.update({ type: 'TIMER_RESET' }, timerModel);
      return [
        { ...model, screenState: { ...screenState, model: newModel }, needsRender: true },
        cmd,
      ];
    }
  }

  if (screenState.screen === 'config') {
    const configModel = screenState.model as import('./types.js').ConfigScreenModel;
    let configMsg: import('./types.js').ConfigMsg | null = null;

    if (key.name === 'tab' || key.name === 'h' || key.name === 'l') {
      configMsg = { type: 'CONFIG_TOGGLE_FOCUS' };
    } else if (key.name === 'left') {
      configMsg = { type: 'CONFIG_FOCUS_LIST' };
    } else if (key.name === 'right') {
      configMsg = { type: 'CONFIG_FOCUS_EDITOR' };
    } else if (configModel.isEditing) {
      if (key.name === 'escape') configMsg = { type: 'CONFIG_EDIT_CANCEL' };
      else if (key.name === 'return' || key.name === 'enter')
        configMsg = { type: 'CONFIG_EDIT_SAVE' };
      else if (key.name === 'backspace') configMsg = { type: 'CONFIG_EDIT_BACKSPACE' };
      else if (key.sequence.length === 1 && !key.ctrl && !key.meta)
        configMsg = { type: 'CONFIG_EDIT_INPUT', char: key.sequence };
    } else {
      if (key.name === 'j' || key.name === 'down') configMsg = { type: 'CONFIG_OPTION_DOWN' };
      else if (key.name === 'k' || key.name === 'up') configMsg = { type: 'CONFIG_OPTION_UP' };
      else if (key.name === 'return' || key.name === 'enter')
        configMsg = { type: 'CONFIG_EDIT_START' };
    }

    if (configMsg) {
      const [newModel, cmd] = ConfigScreen.update(configMsg, configModel);
      return [
        { ...model, screenState: { ...screenState, model: newModel }, needsRender: true },
        cmd,
      ];
    }
  }

  if (screenState.screen === 'stats') {
    const statsModel = screenState.model;
    if (key.name === 'r' || key.name === 'R') {
      const [newModel, cmd] = StatsScreen.update({ type: 'STATS_REFRESH' }, statsModel);
      return [
        { ...model, screenState: { ...screenState, model: newModel }, needsRender: true },
        cmd,
      ];
    }
  }

  return [model, Cmd.none()];
}

function handleHelpKeyPress(model: AppModel, msg: AppMsg): [AppModel, Command] {
  if (msg.type !== 'KEY_PRESS') return [model, Cmd.none()];
  const { key } = msg;

  let helpMsg: import('./types.js').HelpMsg | null = null;

  if (key.name === 'j' || key.name === 'down') helpMsg = { type: 'HELP_SCROLL_DOWN' };
  else if (key.name === 'k' || key.name === 'up') helpMsg = { type: 'HELP_SCROLL_UP' };
  else if (key.name === 'pagedown') helpMsg = { type: 'HELP_PAGE_DOWN' };
  else if (key.name === 'pageup') helpMsg = { type: 'HELP_PAGE_UP' };
  else if (key.name === 'g') helpMsg = { type: 'HELP_TOP' };
  else if (key.name === 'G') helpMsg = { type: 'HELP_BOTTOM' };

  if (helpMsg) {
    return delegateToScreen(helpMsg, model);
  }

  return [model, Cmd.none()];
}

function isListMsg(msg: AppMsg): msg is ListMsg {
  return msg.type.startsWith('LIST_');
}

function isHomeMsg(msg: AppMsg): msg is HomeMsg {
  return msg.type.startsWith('HOME_');
}

function isTimerMsg(msg: AppMsg): msg is TimerMsg {
  return msg.type.startsWith('TIMER_');
}

function isStatsMsg(msg: AppMsg): msg is StatsMsg {
  return msg.type.startsWith('STATS_');
}

function isConfigMsg(msg: AppMsg): msg is ConfigMsg {
  return msg.type.startsWith('CONFIG_');
}

function isHelpMsg(msg: AppMsg): msg is HelpMsg {
  return msg.type.startsWith('HELP_');
}

function isProblemMsg(msg: AppMsg): msg is import('./types.js').ProblemMsg {
  return msg.type.startsWith('PROBLEM_');
}

function isWorkspaceMsg(msg: AppMsg): msg is import('./types.js').WorkspaceMsg {
  return msg.type.startsWith('WORKSPACE_');
}

function isChangelogMsg(msg: AppMsg): msg is import('./types.js').ChangelogMsg {
  return msg.type.startsWith('CHANGELOG_');
}

function isLoginMsg(msg: AppMsg): msg is import('./types.js').LoginMsg {
  return msg.type.startsWith('LOGIN_');
}

function handleWorkspaceKeyPress(model: AppModel, msg: AppMsg): [AppModel, Command] {
  if (msg.type !== 'KEY_PRESS') return [model, Cmd.none()];
  const { key } = msg;
  const wsModel = model.screenState.model as import('./types.js').WorkspaceScreenModel;
  let wsMsg: import('./types.js').WorkspaceMsg | null = null;

  if (wsModel.showCreateInput) {
    if (key.name === 'escape') wsMsg = { type: 'WORKSPACE_CREATE_CANCEL' };
    else if (key.name === 'return' || key.name === 'enter')
      wsMsg = { type: 'WORKSPACE_CREATE_SUBMIT' };
    else if (key.name === 'backspace') wsMsg = { type: 'WORKSPACE_CREATE_BACKSPACE' };
    else if (key.sequence.length === 1 && !key.ctrl && !key.meta)
      wsMsg = { type: 'WORKSPACE_CREATE_INPUT', char: key.sequence };
  } else if (wsModel.showDeleteConfirm) {
    if (key.name === 'y' || key.name === 'return' || key.name === 'enter')
      wsMsg = { type: 'WORKSPACE_DELETE_CONFIRM' };
    else if (key.name === 'n' || key.name === 'escape') wsMsg = { type: 'WORKSPACE_DELETE_CANCEL' };
  } else if (wsModel.isEditing) {
    if (key.name === 'escape') wsMsg = { type: 'WORKSPACE_EDIT_CANCEL' };
    else if (key.name === 'return' || key.name === 'enter') wsMsg = { type: 'WORKSPACE_EDIT_SAVE' };
    else if (key.name === 'backspace') wsMsg = { type: 'WORKSPACE_EDIT_BACKSPACE' };
    else if (key.sequence.length === 1 && !key.ctrl && !key.meta)
      wsMsg = { type: 'WORKSPACE_EDIT_INPUT', char: key.sequence };
  } else {
    if (key.name === 'tab' || key.name === 'h' || key.name === 'l')
      wsMsg = { type: 'WORKSPACE_TOGGLE_FOCUS' };
    else if (key.name === 'left') wsMsg = { type: 'WORKSPACE_FOCUS_LIST' };
    else if (key.name === 'right') wsMsg = { type: 'WORKSPACE_FOCUS_EDITOR' };
    else if (wsModel.paneFocus === 'list') {
      if (key.name === 'j' || key.name === 'down') wsMsg = { type: 'WORKSPACE_DOWN' };
      else if (key.name === 'k' || key.name === 'up') wsMsg = { type: 'WORKSPACE_UP' };
      else if (key.name === 'return' || key.name === 'enter') wsMsg = { type: 'WORKSPACE_SELECT' };
      else if (key.name === 'c') wsMsg = { type: 'WORKSPACE_CREATE_START' };
      else if (key.name === 'd') wsMsg = { type: 'WORKSPACE_DELETE' };
    } else {
      if (key.name === 'j' || key.name === 'down') wsMsg = { type: 'WORKSPACE_FIELD_DOWN' };
      else if (key.name === 'k' || key.name === 'up') wsMsg = { type: 'WORKSPACE_FIELD_UP' };
      else if (key.name === 'return' || key.name === 'enter') wsMsg = { type: 'WORKSPACE_EDIT_START' };
    }
  }

  if (wsMsg) {
    const [newModel, cmd] = WorkspaceScreen.update(wsMsg, wsModel);
    return [
      { ...model, screenState: { screen: 'workspace', model: newModel }, needsRender: true },
      cmd,
    ];
  }
  return [model, Cmd.none()];
}

function handleChangelogKeyPress(model: AppModel, msg: AppMsg): [AppModel, Command] {
  if (msg.type !== 'KEY_PRESS') return [model, Cmd.none()];
  const { key } = msg;

  if (key.name === 'k' || key.name === 'up')
    return updateModel(model, { type: 'CHANGELOG_SCROLL_UP' });
  if (key.name === 'j' || key.name === 'down')
    return updateModel(model, { type: 'CHANGELOG_SCROLL_DOWN' });

  return [model, Cmd.none()];

  function updateModel(
    model: AppModel,
    msg: import('./types.js').ChangelogMsg
  ): [AppModel, Command] {
    const screenState = model.screenState;
    if (screenState.screen !== 'changelog') return [model, Cmd.none()];

    const [newScreenModel, cmd] = ChangelogScreen.update(
      msg,
      screenState.model,
      model.terminalHeight,
      model.terminalWidth
    );
    return [
      { ...model, screenState: { screen: 'changelog', model: newScreenModel }, needsRender: true },
      cmd,
    ];
  }
}

function handleLoginKeyPress(model: AppModel, msg: AppMsg): [AppModel, Command] {
  if (msg.type !== 'KEY_PRESS') return [model, Cmd.none()];
  const { key } = msg;
  const loginModel = model.screenState.model as import('./types.js').LoginScreenModel;

  if (key.ctrl && key.name === 'c') return [model, Cmd.exit()];

  if (loginModel.step === 'instructions') {
    if (key.name === 'return' || key.name === 'enter') {
      return updateLogin(model, { type: 'LOGIN_SUBMIT' });
    } else if (key.name === 'escape') {
      return [model, Cmd.exit()];
    }
  } else if (loginModel.step === 'input' || loginModel.step === 'error') {
    if (key.name === 'escape') {
      return updateLogin(model, { type: 'LOGIN_BACK' });
    } else if (key.name === 'tab' || key.name === 'down' || key.name === 'up') {
      return updateLogin(model, { type: 'LOGIN_SWITCH_FOCUS' });
    } else if (key.name === 'return' || key.name === 'enter') {
      if (loginModel.focusedField === 'session') {
        if (loginModel.sessionToken.length > 0) {
          return updateLogin(model, { type: 'LOGIN_SET_FOCUS', field: 'csrf' });
        }
      } else {
        if (loginModel.csrfToken.length > 0 && loginModel.sessionToken.length > 0) {
          return updateLogin(model, { type: 'LOGIN_SUBMIT' });
        }
      }
    } else if (key.name === 'backspace') {
      if (loginModel.focusedField === 'session') {
        if (loginModel.sessionToken.length > 0) {
          return updateLogin(model, {
            type: 'LOGIN_SESSION_INPUT',
            value: loginModel.sessionToken.slice(0, -1),
          });
        }
      } else {
        if (loginModel.csrfToken.length > 0) {
          return updateLogin(model, {
            type: 'LOGIN_CSRF_INPUT',
            value: loginModel.csrfToken.slice(0, -1),
          });
        }
      }
    } else if (!key.ctrl && !key.meta) {
      if (loginModel.focusedField === 'session') {
        return updateLogin(model, {
          type: 'LOGIN_SESSION_INPUT',
          value: loginModel.sessionToken + key.sequence,
        });
      } else {
        return updateLogin(model, {
          type: 'LOGIN_CSRF_INPUT',
          value: loginModel.csrfToken + key.sequence,
        });
      }
    }
  }

  return [model, Cmd.none()];

  function updateLogin(model: AppModel, msg: import('./types.js').LoginMsg): [AppModel, Command] {
    const [newModel, cmd] = LoginScreen.update(
      msg,
      model.screenState.model as import('./types.js').LoginScreenModel
    );
    return [
      { ...model, screenState: { screen: 'login', model: newModel }, needsRender: true },
      cmd,
    ];
  }
}
