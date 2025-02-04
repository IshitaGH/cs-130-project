import { useContext, createContext, type PropsWithChildren } from 'react';
import { useStorageState } from '@/hooks/useStorageState';
import { apiSignIn, apiCreateAccount } from '@/utils/api/apiClient'

const AuthContext = createContext<{
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  createAccount: (username: string, password: string) => Promise<void>;
  session?: string | null;
  isLoading: boolean;
}>({
  signIn: async () => {},
  signOut: () => {},
  createAccount: async () => {},
  session: null,
  isLoading: false,
});

// useSession must be wrapped in a <SessionProvider />
export function useSession() {
  const value = useContext(AuthContext);
  return value;
}

export function SessionProvider({ children }: PropsWithChildren) {
  // session is the JWT and will be passed into the AuthContext
  const [[isLoading, session], setSession] = useStorageState('session');

  async function signIn(username: string, password: string) {
    try {
      const jwt = await apiSignIn(username, password);
      setSession(jwt);
    } catch (error) {
      console.error('Login error:', error);
    }
  }

  function signOut() {
    setSession(null);
  }

  async function createAccount(username: string, password: string) {
    try {
      await apiCreateAccount(username, password);
    } catch (error) {
      console.error('Registration error:', error);
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, signOut, createAccount, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}