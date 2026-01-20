/**
 * TUI App - Main Application Component
 * Root component that handles navigation and layout
 */
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header.js';
import { Sidebar, defaultMenuItems } from './components/Sidebar.js';
import { StatusBar } from './components/StatusBar.js';
import { HomeScreen } from './screens/HomeScreen.js';
import { ListScreen } from './screens/ListScreen.js';
import { ProblemViewScreen } from './screens/ProblemViewScreen.js';
import { TimerScreen } from './screens/TimerScreen.js';
import { StatsScreen } from './screens/StatsScreen.js';
import { BookmarksScreen } from './screens/BookmarksScreen.js';
import { DailyScreen } from './screens/DailyScreen.js';
import { RandomScreen } from './screens/RandomScreen.js';
import { WorkspaceScreen } from './screens/WorkspaceScreen.js';
import { TestResultScreen } from './screens/TestResultScreen.js';
import { SubmitResultScreen } from './screens/SubmitResultScreen.js';
import { HintScreen } from './screens/HintScreen.js';
import { SubmissionsScreen } from './screens/SubmissionsScreen.js';
import { NotesScreen } from './screens/NotesScreen.js';
import { LoginScreen } from './screens/LoginScreen.js';
import { ConfigScreen } from './screens/ConfigScreen.js';
import type { Problem } from './components/ProblemTable.js';
import { leetcodeClient } from '../api/client.js';
import { credentials } from '../storage/credentials.js';
import { pickCommand } from '../commands/pick.js';
import { colors, icons } from './theme.js';
import Spinner from 'ink-spinner';

type Screen =
  | 'home'
  | 'daily'
  | 'list'
  | 'random'
  | 'bookmarks'
  | 'timer'
  | 'stats'
  | 'workspace'
  | 'config'
  | 'problem-view'
  | 'test-result'
  | 'submit-result'
  | 'hints'
  | 'submissions'
  | 'notes';

interface AppProps {
  username?: string;
}

interface NavigationState {
  screen: Screen;
  selectedProblem?: Problem;
  previousScreen?: Screen;
  timerProblem?: { id: number; title: string; difficulty: 'Easy' | 'Medium' | 'Hard' };
}


export function App({ username: initialUsername }: AppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [navState, setNavState] = useState<NavigationState>({ screen: 'home' });
  const [terminalWidth, setTerminalWidth] = useState(stdout?.columns || 80);
  const [terminalHeight, setTerminalHeight] = useState(stdout?.rows || 24);
  const [currentUsername, setCurrentUsername] = useState(initialUsername || 'Guest');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  // Check for logged in user
  useEffect(() => {
    const checkAuth = async () => {
      setIsCheckingAuth(true);
      const creds = credentials.get();
      if (creds) {
        leetcodeClient.setCredentials(creds);
        try {
          const status = await leetcodeClient.checkAuth();
          if (status.isSignedIn && status.username) {
            setCurrentUsername(status.username);
            setIsLoggedIn(true);
          } else {
            setIsLoggedIn(false);
          }
        } catch (e) {
          setIsLoggedIn(false);
        }
      } else {
        setIsLoggedIn(false);
      }
      setIsCheckingAuth(false);
    };
    checkAuth();
  }, [initialUsername]);

  // Handle login success
  const handleLoginSuccess = (username: string) => {
    setCurrentUsername(username);
    setIsLoggedIn(true);
  };

  // Update terminal dimensions on resize
  useEffect(() => {
    const handleResize = () => {
      if (stdout) {
        setTerminalWidth(stdout.columns);
        setTerminalHeight(stdout.rows);
      }
    };
    stdout?.on('resize', handleResize);
    return () => {
      stdout?.off('resize', handleResize);
    };
  }, [stdout]);

  // Navigate to a screen
  const navigateTo = useCallback((screen: Screen, options?: { problem?: Problem }) => {
    setNavState((prev) => ({
      screen,
      selectedProblem: options?.problem,
      previousScreen: prev.screen,
    }));
  }, []);

  // Go back to previous screen
  const goBack = useCallback(() => {
    setNavState((prev) => {
      const targetScreen = prev.previousScreen || 'home';
      // Preserve selectedProblem when going back to problem-view
      const preserveProblem = targetScreen === 'problem-view';
      return {
        screen: targetScreen,
        selectedProblem: preserveProblem ? prev.selectedProblem : undefined,
        previousScreen: undefined,
      };
    });
  }, []);

  // Handle sidebar navigation - map single-letter keys to screen names
  const handleNavigate = useCallback((key: string) => {
    const keyToScreen: Record<string, Screen> = {
      'd': 'daily',
      'l': 'list',
      'r': 'random',
      'b': 'bookmarks',
      't': 'timer',
      's': 'stats',
      'w': 'workspace',
      'c': 'config',
    };
    
    if (key === 'q') {
      exit();
    } else if (keyToScreen[key]) {
      navigateTo(keyToScreen[key]);
    } else {
      navigateTo(key as Screen);
    }
  }, [exit, navigateTo]);

  // Handle problem selection from list
  const handleSelectProblem = useCallback((problem: Problem) => {
    navigateTo('problem-view', { problem });
  }, [navigateTo]);

  // Handle pick action - runs CLI pick command in background without closing TUI
  const handlePick = useCallback(async (problemIdOrSlug: number | string, slug?: string) => {
    const problemSlug = typeof problemIdOrSlug === 'string' ? problemIdOrSlug : slug;
    
    if (problemSlug) {
      // Run pick command silently - TUI stays open
      // In a real app we'd show a toast/notification here
      await pickCommand(problemSlug.toString(), { 
        open: true,
      });
      
    }
  }, []);

  // Handle test action - navigate to test result screen
  const handleTest = useCallback((problem: Problem) => {
    setNavState((prev) => ({
      ...prev,
      screen: 'test-result',
      selectedProblem: problem,
      previousScreen: prev.screen,
    }));
  }, []);

  // Handle submit action - navigate to submit result screen
  const handleSubmit = useCallback((problem: Problem) => {
    setNavState((prev) => ({
      ...prev,
      screen: 'submit-result',
      selectedProblem: problem,
      previousScreen: prev.screen,
    }));
  }, []);

  // Handle hints action - navigate to hints screen
  const handleHints = useCallback((problem: Problem) => {
    setNavState((prev) => ({
      ...prev,
      screen: 'hints',
      selectedProblem: problem,
      previousScreen: prev.screen,
    }));
  }, []);

  // Handle submissions action - navigate to submissions screen
  const handleSubmissions = useCallback((problem: Problem) => {
    setNavState((prev) => ({
      ...prev,
      screen: 'submissions',
      selectedProblem: problem,
      previousScreen: prev.screen,
    }));
  }, []);

  // Handle notes action - navigate to notes screen
  const handleNotes = useCallback((problem: Problem) => {
    setNavState((prev) => ({
      ...prev,
      screen: 'notes',
      selectedProblem: problem,
      previousScreen: prev.screen,
    }));
  }, []);

  // Handle starting timer for a problem
  const handleStartTimer = useCallback((problem: Problem) => {
    setNavState((prev) => ({
      ...prev,
      screen: 'timer',
      timerProblem: {
        id: problem.id,
        title: problem.title,
        difficulty: problem.difficulty,
      },
      previousScreen: prev.screen,
    }));
  }, []);

  // Global keyboard shortcuts
  useInput((input, key) => {
    if (input === 'q' && navState.screen === 'home') {
      exit();
    }
  });

  const renderScreen = () => {
    switch (navState.screen) {
      case 'home':
        return <HomeScreen username={currentUsername} onNavigate={handleNavigate} />;

      case 'list':
        return (
          <ListScreen
            onSelectProblem={handleSelectProblem}
            onBack={() => navigateTo('home')}
          />
        );

      case 'problem-view':
        if (navState.selectedProblem) {
          return (
            <ProblemViewScreen
              problem={navState.selectedProblem}
              onBack={goBack}
              onPick={(p) => handlePick(p.id, p.titleSlug)}
              onTest={(p) => handleTest(p)}
              onSubmit={(p) => handleSubmit(p)}
              onHints={(p) => handleHints(p)}
              onSubmissions={(p) => handleSubmissions(p)}
              onNotes={(p) => handleNotes(p)}
            />
          );
        }
        return null;

      case 'test-result':
        if (navState.selectedProblem) {
          return (
            <TestResultScreen
              problem={navState.selectedProblem}
              onBack={goBack}
            />
          );
        }
        return null;

      case 'submit-result':
        if (navState.selectedProblem) {
          return (
            <SubmitResultScreen
              problem={navState.selectedProblem}
              onBack={goBack}
            />
          );
        }
        return null;

      case 'hints':
        if (navState.selectedProblem) {
          return (
            <HintScreen
              problem={navState.selectedProblem}
              onBack={goBack}
            />
          );
        }
        return null;

      case 'submissions':
        if (navState.selectedProblem) {
          return (
            <SubmissionsScreen
              problem={navState.selectedProblem}
              onBack={goBack}
            />
          );
        }
        return null;

      case 'notes':
        if (navState.selectedProblem) {
          return (
            <NotesScreen
              problem={navState.selectedProblem}
              onBack={goBack}
            />
          );
        }
        return null;

      case 'daily':
        return (
          <DailyScreen
            onPick={(id, slug) => handlePick(id, slug)}
            onBack={() => navigateTo('home')}
          />
        );

      case 'random':
        return (
          <RandomScreen
            onPick={(id, slug) => handlePick(id, slug)}
            onViewProblem={(problem) => navigateTo('problem-view', { problem })}
            onBack={() => navigateTo('home')}
          />
        );

      case 'stats':
        return <StatsScreen onBack={() => navigateTo('home')} />;

      case 'timer':
        return (
          <TimerScreen
            problemId={navState.timerProblem?.id}
            problemTitle={navState.timerProblem?.title}
            difficulty={navState.timerProblem?.difficulty}
            onBack={() => navigateTo('home')}
            onComplete={() => navigateTo('home')}
          />
        );

      case 'bookmarks':
        return (
          <BookmarksScreen
            onSelectProblem={handleSelectProblem}
            onBack={() => navigateTo('home')}
          />
        );

      case 'config':
        return <ConfigScreen onBack={() => navigateTo('home')} />;

      case 'workspace':
        return <WorkspaceScreen onBack={() => navigateTo('home')} />;

      default:
        return (
          <Box flexDirection="column">
            <Text color={colors.textMuted}>
              Screen: {navState.screen} - Coming soon...
            </Text>
          </Box>
        );
    }
  };

  // Context-aware status hints
  const getStatusHints = () => {
    switch (navState.screen) {
      case 'list':
        return [
          { key: '/', label: 'Search' },
          { key: 'j/k', label: 'Navigate' },
          { key: 'Esc', label: 'Back' },
        ];
      case 'problem-view':
        return [
          { key: 'p', label: 'Pick' },
          { key: 'b', label: 'Bookmark' },
          { key: 'Esc', label: 'Back' },
        ];
      case 'timer':
        return [
          { key: 'Space', label: 'Start/Pause' },
          { key: 'r', label: 'Reset' },
          { key: 'Esc', label: 'Back' },
        ];
      case 'stats':
        return [{ key: 'Esc', label: 'Back' }];
      default:
        return [
          { key: 'l', label: 'List' },
          { key: 'd', label: 'Daily' },
          { key: 'q', label: 'Quit' },
        ];
    }
  };

  // Determine active sidebar key
  const getActiveKey = () => {
    if (navState.screen === 'problem-view') return 'l';
    if (navState.screen === 'home') return 'd';
    return navState.screen[0];
  };

  // Hide sidebar on all screens except home to provide more space and focus
  const showSidebar = navState.screen === 'home';
  
  // Disable sidebar j/k navigation when inside content screens (to prevent conflicts)
  const sidebarDisabled = !['home'].includes(navState.screen);

  // Show loading screen while checking auth
  if (isCheckingAuth) {
    return (
      <Box flexDirection="column" width={terminalWidth} height={terminalHeight - 1} alignItems="center" justifyContent="center">
        <Text color={colors.primary}>
          <Spinner type="dots" /> Checking authentication...
        </Text>
      </Box>
    );
  }

  // Show login screen if not logged in
  if (!isLoggedIn) {
    return (
      <Box flexDirection="column" width={terminalWidth} height={terminalHeight - 1}>
        <LoginScreen onLoginSuccess={handleLoginSuccess} />
      </Box>
    );
  }

  return (
    <Box flexDirection="column" width={terminalWidth} height={terminalHeight - 1}>
      {/* Header */}
      <Header username={currentUsername} connectionStatus="connected" />

      {/* Main Content Area */}
      <Box flexGrow={1} marginTop={1}>
        {/* Sidebar - hidden on some screens */}
        {showSidebar && (
          <Sidebar
            items={defaultMenuItems}
            activeKey={getActiveKey()}
            onSelect={handleNavigate}
            disabled={sidebarDisabled}
          />
        )}

        {/* Main Content */}
        <Box flexDirection="column" flexGrow={1} marginLeft={showSidebar ? 2 : 0}>
          {renderScreen()}
        </Box>
      </Box>

      {/* Status Bar */}
      <StatusBar
        status={navState.screen === 'home' ? 'Connected' : navState.screen}
        user={currentUsername}
        hints={getStatusHints()}
      />
    </Box>
  );
}

export default App;
