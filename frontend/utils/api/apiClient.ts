// Create a file at frontend/config.ts that exports constant API_URL with your device's IP address
// Example: `export const API_URL = "http://YOUR_LOCAL_IP_ADDRESS:5000";`
// Localhost might not work because Flask doesn't recognize it in its CORS policy
import { API_URL } from '@/config';

// returns jwt or throws an error
export async function apiSignIn(username: string, password: string) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to sign in');
  }
  
  const data = await response.json();
  return data.access_token;
}

// returns void or throws an error
export async function apiCreateAccount(username: string, password: string) {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create account');
  }
}

// returns the message from the backend or throws an error
export async function apiGetMessage(session: any) {
  const response = await fetch(`${API_URL}/protected`, {
    headers: {
      Authorization: `Bearer ${session}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get message');
  }
  const data = await response.json();
  return data.message;
}

// returns the message from the backend or throws an error
export async function apiGetChores(session: any) {
  const response = await fetch(`${API_URL}/chores`, {
    headers: {
      Authorization: `Bearer ${session}`,
    },
  });

  if (!response.ok) {
    throw new Error('Failed to get message');
  }
  const data = await response.json();
  return data;
}