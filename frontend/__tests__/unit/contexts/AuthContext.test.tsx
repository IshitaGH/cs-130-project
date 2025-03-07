import React from 'react';
import { renderHook, act, waitFor } from '@testing-library/react-native';
import { SessionProvider, useAuthContext } from '@/contexts/AuthContext';
import { apiSignIn, apiCreateAccount } from '@/utils/api/apiClient';
import { jwtDecode } from 'jwt-decode';
import * as SecureStore from 'expo-secure-store';

// Mock dependencies
jest.mock('@/utils/api/apiClient', () => ({
  apiSignIn: jest.fn(),
  apiCreateAccount: jest.fn(),
}));

jest.mock('jwt-decode', () => ({
  jwtDecode: jest.fn(),
}));

// Mock expo-secure-store instead of async-storage
jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(),
  setItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

// Mock Platform.OS to simulate non-web environment
jest.mock('react-native', () => ({
  Platform: {
    OS: 'ios'
  }
}));

describe('AuthContext', () => {
  // Setup for all tests
  beforeEach(() => {
    jest.clearAllMocks();
    (SecureStore.getItemAsync as jest.Mock).mockResolvedValue(null);
    // Provide a default mock implementation for jwtDecode
    (jwtDecode as jest.Mock).mockImplementation(() => ({ sub: null }));
    
    // Spy on console.error to suppress the expected error messages
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    // Restore console.error
    jest.restoreAllMocks();
  });

  // Helper function to render the hook with provider
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <SessionProvider>{children}</SessionProvider>
  );

  describe('Session Management', () => {
    test('initializes with null session and userId', async () => {
      const { result } = renderHook(() => useAuthContext(), { wrapper });
      
      // Wait for initial state to settle
      await waitFor(() => {
        expect(result.current.sessionLoading).toBe(false);
      });
      
      expect(result.current.session).toBeNull();
      expect(result.current.userId).toBeNull();
    });

    test('updates userId when session changes', async () => {
      // Mock JWT decode to return a user ID
      (jwtDecode as jest.Mock).mockReturnValue({ sub: '123' });
      
      const { result } = renderHook(() => useAuthContext(), { wrapper });
      
      // Wait for initial state to settle
      await waitFor(() => {
        expect(result.current.sessionLoading).toBe(false);
      });
      
      // Initially null
      expect(result.current.userId).toBeNull();
      
      // Simulate sign in
      (apiSignIn as jest.Mock).mockResolvedValue('fake-jwt-token');
      
      await act(async () => {
        await result.current.signIn('testuser', 'password');
      });
      
      // Should have updated userId from JWT
      expect(result.current.userId).toBe(123);
    });
  });

  describe('signIn', () => {
    test('successfully signs in and sets session', async () => {
      const mockToken = 'fake-jwt-token';
      (apiSignIn as jest.Mock).mockResolvedValue(mockToken);
      (jwtDecode as jest.Mock).mockReturnValue({ sub: '123' });
      
      const { result } = renderHook(() => useAuthContext(), { wrapper });
      
      // Wait for initial state to settle
      await waitFor(() => {
        expect(result.current.sessionLoading).toBe(false);
      });
      
      await act(async () => {
        await result.current.signIn('testuser', 'password');
      });
      
      expect(apiSignIn).toHaveBeenCalledWith('testuser', 'password');
      expect(result.current.session).toBe(mockToken);
      expect(result.current.userId).toBe(123);
    });

    test('throws error when sign in fails', async () => {
      const mockError = new Error('Invalid credentials');
      (apiSignIn as jest.Mock).mockRejectedValue(mockError);
      
      const { result } = renderHook(() => useAuthContext(), { wrapper });
      
      // Wait for initial state to settle
      await waitFor(() => {
        expect(result.current.sessionLoading).toBe(false);
      });
      
      await expect(
        act(async () => {
          await result.current.signIn('testuser', 'wrong-password');
        })
      ).rejects.toThrow('Invalid credentials');
      
      expect(result.current.session).toBeNull();
      expect(result.current.userId).toBeNull();
    });
  });

  describe('signOut', () => {
    test('clears session and userId on sign out', async () => {
      // Setup: first sign in
      const mockToken = 'fake-jwt-token';
      (apiSignIn as jest.Mock).mockResolvedValue(mockToken);
      (jwtDecode as jest.Mock).mockReturnValue({ sub: '123' });
      
      const { result } = renderHook(() => useAuthContext(), { wrapper });
      
      await act(async () => {
        await result.current.signIn('testuser', 'password');
      });
      
      // Verify signed in state
      expect(result.current.session).toBe(mockToken);
      expect(result.current.userId).toBe(123);
      
      // Now sign out
      act(() => {
        result.current.signOut();
      });
      
      // Verify signed out state
      expect(result.current.session).toBeNull();
      expect(result.current.userId).toBeNull();
    });
  });

  describe('createAccount', () => {
    test('successfully creates an account', async () => {
      (apiCreateAccount as jest.Mock).mockResolvedValue(undefined);
      
      const { result } = renderHook(() => useAuthContext(), { wrapper });
      
      await act(async () => {
        await result.current.createAccount('John', 'Doe', 'johndoe', 'password123');
      });
      
      expect(apiCreateAccount).toHaveBeenCalledWith('John', 'Doe', 'johndoe', 'password123');
      // Creating an account doesn't automatically sign in
      expect(result.current.session).toBeNull();
    });

    test('throws error when account creation fails', async () => {
      const mockError = new Error('Username already exists');
      (apiCreateAccount as jest.Mock).mockRejectedValue(mockError);
      
      const { result } = renderHook(() => useAuthContext(), { wrapper });
      
      await expect(
        act(async () => {
          await result.current.createAccount('John', 'Doe', 'existinguser', 'password123');
        })
      ).rejects.toThrow('Username already exists');
    });
  });

  describe('JWT Decoding', () => {
    test('handles invalid JWT gracefully', async () => {
      // Setup: mock JWT decode to throw an error
      (jwtDecode as jest.Mock).mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      // Mock a successful sign in but with an invalid token
      (apiSignIn as jest.Mock).mockResolvedValue('invalid-token');
      
      const { result } = renderHook(() => useAuthContext(), { wrapper });
      
      await act(async () => {
        await result.current.signIn('testuser', 'password');
      });
      
      // Session should be set but userId should be null due to decode error
      expect(result.current.session).toBe('invalid-token');
      expect(result.current.userId).toBeNull();
    });

    test('handles non-numeric user ID in JWT', async () => {
      // Setup: mock JWT decode to return a non-numeric user ID
      (jwtDecode as jest.Mock).mockReturnValue({ sub: 'not-a-number' });
      
      // Mock a successful sign in
      (apiSignIn as jest.Mock).mockResolvedValue('token-with-non-numeric-id');
      
      const { result } = renderHook(() => useAuthContext(), { wrapper });
      
      await act(async () => {
        await result.current.signIn('testuser', 'password');
      });
      
      // Session should be set but userId should be NaN
      expect(result.current.session).toBe('token-with-non-numeric-id');
      expect(result.current.userId).toBeNaN();
    });
  });
}); 