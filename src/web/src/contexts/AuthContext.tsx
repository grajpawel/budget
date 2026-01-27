import {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import {
  signIn,
  signOut,
  signUp,
  confirmSignUp,
  getCurrentUser,
  fetchAuthSession,
  type AuthUser,
} from 'aws-amplify/auth';

interface AuthContextType {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (email: string, password: string) => Promise<void>;
  confirmRegistration: (email: string, code: string) => Promise<void>;
  getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuthState();
  }, []);

  async function checkAuthState() {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const result = await signIn({ username: email, password });
    if (result.isSignedIn) {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    }
  }

  async function logout() {
    await signOut();
    setUser(null);
  }

  async function register(email: string, password: string) {
    await signUp({
      username: email,
      password,
      options: {
        userAttributes: {
          email,
        },
      },
    });
  }

  async function confirmRegistration(email: string, code: string) {
    await confirmSignUp({ username: email, confirmationCode: code });
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
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        register,
        confirmRegistration,
        getAccessToken,
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
