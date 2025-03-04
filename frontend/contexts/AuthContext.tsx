import { useContext, createContext, type PropsWithChildren } from 'react';
import { useStorageState } from '@/hooks/useStorageState';
import { apiSignIn, apiCreateAccount } from '@/utils/api/apiClient'
import { jwtDecode } from 'jwt-decode';
import { useState, useEffect, useCallback } from 'react';

interface AuthContextType {
  session: string | null;
  sessionLoading: boolean;
  userId: number | null;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => void;
  createAccount: (
    firstName: string,
    lastName: string,
    username: string,
    password: string
  ) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  sessionLoading: false,
  userId: null,
  signIn: async () => {},
  signOut: () => {},
  createAccount: async () => {},
});

// useAuthContext must be wrapped in a <SessionProvider />
export function useAuthContext() {
  return useContext(AuthContext);
}

// Helper function to decode JWT and extract user information
function getUserIdFromToken(token: string): number | null {
  try {
    const decoded: { sub: string } = jwtDecode(token);
    // userId from backend gets stored as a string in JWT
    return Number(decoded.sub);
  } catch (error) {
    console.error('Error decoding JWT:', error);
    return null;
  }
}

export function SessionProvider({ children }: PropsWithChildren) {
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

  const signIn = useCallback(async (username: string, password: string) => {
    try {
      const jwt = await apiSignIn(username, password);
      setSession(jwt);
    } catch (error: any) {
      throw error;
    } finally {
    }
  }, [setSession]);

  const signOut = useCallback(() => {
    setSession(null);
  }, [setSession]);

  const createAccount = useCallback(async (firstName: string, lastName: string, username: string, password: string) => {
    try {
      await apiCreateAccount(firstName, lastName, username, password);
    } catch (error: any) {
      throw error;
    }
  }, []);

  return (
    <AuthContext.Provider value={{ session, sessionLoading, userId, signIn, signOut, createAccount }}>
      {children}
    </AuthContext.Provider>
  );
}