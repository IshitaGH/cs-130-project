import { useContext, createContext, type PropsWithChildren } from 'react';
import { useStorageState } from '@/hooks/useStorageState';
import API_URL from '@/utils/api/apiClient'

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
      const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        throw new Error('Failed to sign in');
      }

      const data = await response.json();
      setSession(data.access_token); // Save JWT
    } catch (error) {
      console.error('Login error:', error);
    }
  }

  function signOut() {
    setSession(null);
  }

  async function createAccount(username: string, password: string) {
    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to create account');
      }
    } catch (error) {
      console.error('Registration error:', error);
      throw error; // Re-throw error to display in the UI if needed
    }
  }

  return (
    <AuthContext.Provider value={{ signIn, signOut, createAccount, session, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}