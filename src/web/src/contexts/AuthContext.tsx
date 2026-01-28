import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  type ReactNode,
} from 'react';
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  resendSignUpCode,
  resetPassword,
  confirmResetPassword,
  getCurrentUser,
  fetchAuthSession,
  type AuthUser,
} from 'aws-amplify/auth';

/** Friendly error messages for common Cognito error codes */
const ERROR_MESSAGES: Record<string, string> = {
  UserNotFoundException: 'No account found with this email address.',
  NotAuthorizedException: 'Incorrect email or password.',
  UserNotConfirmedException: 'Please verify your email before signing in.',
  UsernameExistsException: 'An account with this email already exists.',
  InvalidPasswordException: 'Password does not meet requirements.',
  CodeMismatchException: 'Invalid verification code. Please try again.',
  ExpiredCodeException: 'Verification code has expired. Please request a new one.',
  LimitExceededException: 'Too many attempts. Please try again later.',
  InvalidParameterException: 'Invalid input. Please check your information.',
  UserLambdaValidationException: 'Account validation failed. Please try again.',
  TooManyRequestsException: 'Too many requests. Please wait and try again.',
  PasswordResetRequiredException: 'Password reset is required for this account.',
  NetworkError: 'Network error. Please check your connection.',
};

/** Get a user-friendly error message from an error */
function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    // Check for Cognito error codes
    const errorName = (error as Error & { name?: string }).name;
    if (errorName && ERROR_MESSAGES[errorName]) {
      return ERROR_MESSAGES[errorName];
    }

    // Check message content for common patterns
    const message = error.message.toLowerCase();
    if (message.includes('network')) {
      return ERROR_MESSAGES.NetworkError;
    }

    return error.message;
  }
  return 'An unexpected error occurred. Please try again.';
}

interface AuthState {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  /** Sign in with email and password */
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;

  /** Sign out the current user */
  logout: () => Promise<void>;

  /** Register a new account */
  register: (email: string, password: string, displayName?: string) => Promise<void>;

  /** Confirm registration with verification code */
  confirmRegistration: (email: string, code: string) => Promise<void>;

  /** Resend verification code */
  resendVerificationCode: (email: string) => Promise<void>;

  /** Initiate password reset (sends code to email) */
  forgotPassword: (email: string) => Promise<void>;

  /** Complete password reset with code and new password */
  resetPasswordConfirm: (email: string, code: string, newPassword: string) => Promise<void>;

  /** Get the current access token for API calls */
  getAccessToken: () => Promise<string | null>;

  /** Refresh the current session */
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Session refresh interval in milliseconds (14 minutes) */
const SESSION_REFRESH_INTERVAL = 14 * 60 * 1000;

/** Storage key for remember me preference */
const REMEMBER_ME_KEY = 'budget_remember_me';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
  });

  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  /** Check current auth state on mount */
  useEffect(() => {
    checkAuthState();

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  /** Start session refresh interval when authenticated */
  useEffect(() => {
    if (state.isAuthenticated) {
      startSessionRefresh();
    } else {
      stopSessionRefresh();
    }

    return () => {
      stopSessionRefresh();
    };
  }, [state.isAuthenticated]);

  async function checkAuthState() {
    try {
      const currentUser = await getCurrentUser();
      setState({
        user: currentUser,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }

  function startSessionRefresh() {
    if (refreshIntervalRef.current) {
      return; // Already running
    }

    refreshIntervalRef.current = setInterval(() => {
      refreshSession();
    }, SESSION_REFRESH_INTERVAL);
  }

  function stopSessionRefresh() {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  }

  const refreshSession = useCallback(async () => {
    try {
      // fetchAuthSession will automatically refresh tokens if needed
      await fetchAuthSession({ forceRefresh: true });
    } catch (error) {
      console.error('Failed to refresh session:', error);
      // If refresh fails, log out the user
      await logout();
    }
  }, []);

  async function login(email: string, password: string, rememberMe = false) {
    try {
      // Store remember me preference
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
        sessionStorage.setItem(REMEMBER_ME_KEY, 'session');
      }

      const result = await signIn({ username: email, password });

      if (result.isSignedIn) {
        const currentUser = await getCurrentUser();
        setState({
          user: currentUser,
          isLoading: false,
          isAuthenticated: true,
        });
      } else if (result.nextStep?.signInStep === 'CONFIRM_SIGN_UP') {
        throw new Error('UserNotConfirmedException');
      }
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async function logout() {
    try {
      await signOut();
    } finally {
      localStorage.removeItem(REMEMBER_ME_KEY);
      sessionStorage.removeItem(REMEMBER_ME_KEY);
      setState({
        user: null,
        isLoading: false,
        isAuthenticated: false,
      });
    }
  }

  async function register(email: string, password: string, displayName?: string) {
    try {
      await signUp({
        username: email,
        password,
        options: {
          userAttributes: {
            email,
            ...(displayName && { name: displayName }),
          },
        },
      });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async function confirmRegistration(email: string, code: string) {
    try {
      await confirmSignUp({ username: email, confirmationCode: code });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async function resendVerificationCode(email: string) {
    try {
      await resendSignUpCode({ username: email });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async function forgotPassword(email: string) {
    try {
      await resetPassword({ username: email });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async function resetPasswordConfirm(email: string, code: string, newPassword: string) {
    try {
      await confirmResetPassword({
        username: email,
        confirmationCode: code,
        newPassword,
      });
    } catch (error) {
      throw new Error(getErrorMessage(error));
    }
  }

  async function getAccessToken(): Promise<string | null> {
    try {
      const session = await fetchAuthSession();
      return session.tokens?.accessToken?.toString() ?? null;
    } catch {
      return null;
    }
  }

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        logout,
        register,
        confirmRegistration,
        resendVerificationCode,
        forgotPassword,
        resetPasswordConfirm,
        getAccessToken,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
