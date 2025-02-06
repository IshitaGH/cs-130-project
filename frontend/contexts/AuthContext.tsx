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
      console.log("Calling apiSignIn...");
      const jwt = await apiSignIn(username, password);
      console.log("Sign-in successful, setting session with JWT token.");
      setSession(jwt);
    } catch (error: any) {
      // Pass the error message up so the UI can display it
      console.error('Login error:', error.message);
      throw error;
    }
  }

  function signOut() {
    setSession(null);
  }

  async function createAccount(username: string, password: string) {
    try {
      console.log("Calling apiCreateAccount...");
      await apiCreateAccount(username, password);
      console.log("User successfully created.");
    } catch (error: any) {
      console.error('Registration error:', error.message);
      throw error;
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, signOut, createAccount, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}