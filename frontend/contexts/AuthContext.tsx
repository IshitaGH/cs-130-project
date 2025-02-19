import { useContext, createContext, type PropsWithChildren } from 'react';
import { useStorageState } from '@/hooks/useStorageState';
import { apiSignIn, apiCreateAccount } from '@/utils/api/apiClient'
import { jwtDecode } from 'jwt-decode';
import { useState, useEffect } from 'react';

const AuthContext = createContext<{
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  createAccount: (username: string, password: string) => Promise<void>;
  session?: string | null;
  userId?: number | null;
  sessionLoading: boolean;
}>({
  signIn: async () => {},
  signOut: () => {},
  createAccount: async () => {},
  session: null,
  userId: null,
  sessionLoading: false,
});

// useSession must be wrapped in a <SessionProvider />
export function useSession() {
  const value = useContext(AuthContext);
  return value;
}

// Helper function to decode JWT and extract user information
function getUserIdFromToken(token: string): number | null {
  try {
    // const decoded: { sub: string } = jwtDecode(token);
    // return Number(decoded.sub); // the userId from the backend gets stored as a string in the JWT
    return 100;
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

export function SessionProvider({ children }: PropsWithChildren) {
  // session is the JWT and will be passed into the AuthContext
  const [[sessionLoading, session], setSession] = useStorageState('session');
  const [userId, setUserId] = useState<number | null>(null);

  // Update userId whenever session changes
  useEffect(() => {
    if (session) {
      const id = getUserIdFromToken(session);
      setUserId(id);
    } else {
      setUserId(null);
    }
  }, [session]);

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
    <AuthContext.Provider value={{ signIn, signOut, createAccount, session, userId, sessionLoading }}>
      {children}
    </AuthContext.Provider>
  );
}