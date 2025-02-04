// localhost doesn't work because Flask does not by default allow localhost in CORS policy (even though it resolves to 127.0.0.1)
const API_URL = "http://127.0.0.1:5000";
// const API_URL = "http://192.168.1.135:5000";  // set to your computer's IP if trying to use Expo Go

// returns jwt or throws an error
export async function apiSignIn(username: string, password: string) {
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    throw new Error('Failed to sign in');
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
    throw new Error('Failed to create account');
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