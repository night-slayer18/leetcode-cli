/**
 * Login Screen
 * Handles user authentication within the TUI
 */
import { Box, Text, useInput, useApp, useStdout } from 'ink';
import { useState, useEffect, useRef } from 'react';
import Spinner from 'ink-spinner';
import Gradient from 'ink-gradient';
import { leetcodeClient } from '../../api/client.js';
import { credentials } from '../../storage/credentials.js';
import { colors, icons } from '../theme.js';
import type { LeetCodeCredentials } from '../../types.js';

// ASCII Art Logo
const LOGO = `
██╗     ███████╗███████╗████████╗ ██████╗  ██████╗ ██████╗ ███████╗
██║     ██╔════╝██╔════╝╚══██╔══╝██╔════╝ ██╔═══██╗██╔══██╗██╔════╝
██║     █████╗  █████╗     ██║   ██║      ██║   ██║██║  ██║█████╗  
██║     ██╔══╝  ██╔══╝     ██║   ██║      ██║   ██║██║  ██║██╔══╝  
███████╗███████╗███████╗   ██║   ╚██████╗ ╚██████╔╝██████╔╝███████╗
╚══════╝╚══════╝╚══════╝   ╚═╝    ╚═════╝  ╚═════╝ ╚═════╝ ╚══════╝
`;

interface LoginScreenProps {
  onLoginSuccess: (username: string) => void;
}

type LoginStep = 'welcome' | 'session' | 'csrf' | 'verifying' | 'success' | 'error';

export function LoginScreen({ onLoginSuccess }: LoginScreenProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const [step, setStep] = useState<LoginStep>('welcome');
  const [session, setSession] = useState('');
  const [csrfToken, setCsrfToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [username, setUsername] = useState('');

  const terminalWidth = stdout?.columns || 80;
  const terminalHeight = stdout?.rows || 24;

  // Use stdin directly for proper paste support (useInput has buffer limits)
  useEffect(() => {
    if (step !== 'session' && step !== 'csrf') return;

    const handleData = (data: Buffer) => {
      const str = data.toString();
      
      // Check for Enter key
      if (str === '\r' || str === '\n') {
        if (step === 'session' && session.trim()) {
          setStep('csrf');
        } else if (step === 'csrf' && csrfToken.trim()) {
          handleLogin();
        }
        return;
      }
      
      // Check for backspace
      if (str === '\x7f' || str === '\b') {
        if (step === 'session') {
          setSession(prev => prev.slice(0, -1));
        } else if (step === 'csrf') {
          setCsrfToken(prev => prev.slice(0, -1));
        }
        return;
      }
      
      // Append all printable characters (handles paste of any size)
      const printable = str.replace(/[\x00-\x1F\x7F]/g, '');
      if (printable) {
        if (step === 'session') {
          setSession(prev => prev + printable);
        } else if (step === 'csrf') {
          setCsrfToken(prev => prev + printable);
        }
      }
    };

    process.stdin.on('data', handleData);
    return () => {
      process.stdin.off('data', handleData);
    };
  }, [step, session, csrfToken]);

  // Handle welcome and error screens with useInput
  useInput((input, key) => {
    if (step === 'welcome') {
      if (key.return || input === 'l') {
        setStep('session');
      }
      if (input === 'q') {
        exit();
      }
    }
    if (step === 'error' && key.return) {
      setStep('session');
      setSession('');
      setCsrfToken('');
      setError(null);
    }
  });

  const handleLogin = async () => {
    setStep('verifying');

    const creds: LeetCodeCredentials = {
      session: session.trim(),
      csrfToken: csrfToken.trim(),
    };

    try {
      leetcodeClient.setCredentials(creds);
      const authResult = await leetcodeClient.checkAuth();

      if (!authResult.isSignedIn || !authResult.username) {
        setError(`Invalid credentials (session: ${session.length} chars, csrf: ${csrfToken.length} chars)`);
        setStep('error');
        return;
      }

      credentials.set(creds);
      setUsername(authResult.username);
      setStep('success');

      setTimeout(() => {
        onLoginSuccess(authResult.username!);
      }, 1500);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      setError(`Error: ${errMsg}`);
      setStep('error');
    }
  };

  // Welcome screen
  if (step === 'welcome') {
    return (
      <Box
        flexDirection="column"
        width={terminalWidth}
        height={terminalHeight - 2}
        alignItems="center"
        justifyContent="center"
      >
        <Box marginBottom={1}>
          <Gradient name="passion">
            <Text>{LOGO}</Text>
          </Gradient>
        </Box>

        <Box marginBottom={2}>
          <Gradient name="teen">
            <Text bold>━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</Text>
          </Gradient>
        </Box>

        <Box marginBottom={1}>
          <Text color="#ffffff" bold>Terminal Edition</Text>
        </Box>

        <Box marginBottom={3}>
          <Text color={colors.textMuted}>A modern command-line interface for solving LeetCode problems</Text>
        </Box>

        <Box flexDirection="column" alignItems="center" marginBottom={3}>
          <Box>
            <Text color={colors.success}>{icons.check}</Text>
            <Text color={colors.text}> Browse & filter problems</Text>
          </Box>
          <Box>
            <Text color={colors.success}>{icons.check}</Text>
            <Text color={colors.text}> Test & submit solutions</Text>
          </Box>
          <Box>
            <Text color={colors.success}>{icons.check}</Text>
            <Text color={colors.text}> Track your progress</Text>
          </Box>
        </Box>

        <Box
          flexDirection="column"
          alignItems="center"
          borderStyle="round"
          borderColor={colors.primary}
          paddingX={4}
          paddingY={1}
        >
          <Box>
            <Text color={colors.primary} bold>[L]</Text>
            <Text color={colors.textBright}> Login with LeetCode cookies</Text>
          </Box>
        </Box>

        <Box marginTop={2}>
          <Text color={colors.textMuted} dimColor>[Q] Quit</Text>
        </Box>

        <Box marginTop={3}>
          <Text color={colors.textMuted} dimColor>
            v2.2.2 • github.com/night-slayer18/leetcode-cli
          </Text>
        </Box>
      </Box>
    );
  }

  // Session input
  if (step === 'session') {
    return (
      <Box
        flexDirection="column"
        width={terminalWidth}
        height={terminalHeight - 2}
        alignItems="center"
        justifyContent="center"
      >
        <Box marginBottom={2}>
          <Gradient name="passion">
            <Text bold>🔐 Login to LeetCode</Text>
          </Gradient>
        </Box>

        <Box
          flexDirection="column"
          borderStyle="round"
          borderColor={colors.primary}
          paddingX={3}
          paddingY={1}
          marginBottom={2}
        >
          <Text color={colors.textMuted}>To get your session cookies:</Text>
          <Text color={colors.textMuted}>1. Open <Text color={colors.cyan}>https://leetcode.com</Text> in browser</Text>
          <Text color={colors.textMuted}>2. Login to your account</Text>
          <Text color={colors.textMuted}>3. DevTools (F12) → Application → Cookies</Text>
          <Text color={colors.textMuted}>4. Copy <Text color={colors.warning}>LEETCODE_SESSION</Text> and <Text color={colors.warning}>csrftoken</Text></Text>
        </Box>

        <Box flexDirection="column" alignItems="center">
          <Box marginBottom={1}>
            <Text color={colors.textBright} bold>LEETCODE_SESSION:</Text>
          </Box>
          <Box
            borderStyle="single"
            borderColor={session.length > 0 ? colors.success : colors.primary}
            paddingX={2}
            paddingY={0}
          >
            <Text color={session.length > 0 ? colors.success : colors.textMuted}>
              {session.length > 0 ? `Received (${session.length} chars)` : 'Waiting for paste...'}
            </Text>
          </Box>
        </Box>

        <Box marginTop={2}>
          <Text color={colors.textMuted} dimColor>Paste your token, press Enter when done</Text>
        </Box>
      </Box>
    );
  }

  // CSRF input
  if (step === 'csrf') {
    return (
      <Box
        flexDirection="column"
        width={terminalWidth}
        height={terminalHeight - 2}
        alignItems="center"
        justifyContent="center"
      >
        <Box marginBottom={2}>
          <Gradient name="passion">
            <Text bold>🔐 Login to LeetCode</Text>
          </Gradient>
        </Box>

        <Box marginBottom={2}>
          <Text color={colors.success}>{icons.check} LEETCODE_SESSION saved</Text>
        </Box>

        <Box flexDirection="column" alignItems="center">
          <Box marginBottom={1}>
            <Text color={colors.textBright} bold>csrftoken:</Text>
          </Box>
          <Box
            borderStyle="single"
            borderColor={csrfToken.length > 0 ? colors.success : colors.primary}
            paddingX={2}
            paddingY={0}
          >
            <Text color={csrfToken.length > 0 ? colors.success : colors.textMuted}>
              {csrfToken.length > 0 ? `Received (${csrfToken.length} chars)` : 'Waiting for paste...'}
            </Text>
          </Box>
        </Box>

        <Box marginTop={2}>
          <Text color={colors.textMuted} dimColor>Paste your token, press Enter to login</Text>
        </Box>
      </Box>
    );
  }

  // Verifying
  if (step === 'verifying') {
    return (
      <Box
        flexDirection="column"
        width={terminalWidth}
        height={terminalHeight - 2}
        alignItems="center"
        justifyContent="center"
      >
        <Box>
          <Text color={colors.primary}>
            <Spinner type="dots" />
          </Text>
          <Text color={colors.textBright}> Verifying credentials...</Text>
        </Box>
      </Box>
    );
  }

  // Success
  if (step === 'success') {
    return (
      <Box
        flexDirection="column"
        width={terminalWidth}
        height={terminalHeight - 2}
        alignItems="center"
        justifyContent="center"
      >
        <Box marginBottom={1}>
          <Text color={colors.success} bold>
            {icons.check} Login successful!
          </Text>
        </Box>
        <Box marginBottom={2}>
          <Text color={colors.textBright}>Welcome back, </Text>
          <Text color={colors.primary} bold>{username}</Text>
          <Text color={colors.textBright}>!</Text>
        </Box>
        <Box>
          <Text color={colors.textMuted}>
            <Spinner type="dots" /> Entering dashboard...
          </Text>
        </Box>
      </Box>
    );
  }

  // Error
  if (step === 'error') {
    return (
      <Box
        flexDirection="column"
        width={terminalWidth}
        height={terminalHeight - 2}
        alignItems="center"
        justifyContent="center"
      >
        <Box marginBottom={1}>
          <Text color={colors.error} bold>{icons.cross} Login Failed</Text>
        </Box>
        <Box
          borderStyle="round"
          borderColor={colors.error}
          paddingX={3}
          paddingY={1}
          marginBottom={2}
        >
          <Text color={colors.error}>{error}</Text>
        </Box>
        <Box>
          <Text color={colors.textMuted}>Press </Text>
          <Text color={colors.primary}>Enter</Text>
          <Text color={colors.textMuted}> to try again</Text>
        </Box>
      </Box>
    );
  }

  return null;
}
