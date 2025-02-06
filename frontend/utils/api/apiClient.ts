// localhost doesn't work because Flask does not by default allow localhost in CORS policy (even though it resolves to 127.0.0.1)
// const API_URL = "http://127.0.0.1:5000";
const API_URL = "http://192.168.1.135:5000";  // set to your computer's IP if trying to use Expo Go

// returns jwt or throws an error
export async function apiSignIn(username: string, password: string) {
  console.log("Attempting to sign in:", { username, password }); 
  const response = await fetch(`${API_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });
  console.log("Server response status:", response.status);

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to sign in');
  }

  
  const data = await response.json();
  console.log("Received JWT token:");
  return data.access_token;
}

// returns void or throws an error
export async function apiCreateAccount(username: string, password: string) {
  console.log("Attempting to create account for:", { username, password });
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

  console.log("Server response status:", response.status);  // Log status code


  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create account');
  }
  console.log("User successfully registered");
}

// returns the message from the backend or throws an error
export async function apiGetMessage(session: any) {
  console.log("Fetching protected message using session token:", session);

  const response = await fetch(`${API_URL}/protected`, {
    headers: {
      Authorization: `Bearer ${session}`,
    },
  });

  console.log("Server response status:", response.status);  // Log status code

  if (!response.ok) {
    throw new Error('Failed to get message');
  }
  const data = await response.json();
  console.log("Received protected message");
  return data.message;
}