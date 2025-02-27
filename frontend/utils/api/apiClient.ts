import { API_URL } from '@/config';

// NOTE: should only be called via AuthContext
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

// Note: should only be called via AuthContext
export async function apiCreateAccount(firstName: string, lastName: string, username: string, password: string) {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ first_name: firstName, last_name: lastName, username, password }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create account');
  }
}

export async function apiGetRoom(session: any) {
  const response = await fetch(`${API_URL}/room`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${session}` },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to fetch Room');
  }
  
  const data = await response.json();
  return data;
}

export async function apiCreateRoom(session: any, roomName: string) {
  const response = await fetch(`${API_URL}/rooms`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session}`
    },
    body: JSON.stringify({ room_name: roomName}),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create Room');
  }
  const data = await response.json();
  return data;
}

export async function apiJoinRoom(session: any, inviteCode: string) {
  const response = await fetch(`${API_URL}/rooms/join`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session}`
    },
    body: JSON.stringify({ 'invite_code' : inviteCode}),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to join Room');
  }
  
  const data = await response.json();
  return data;
}

export async function apiLeaveRoom(session: any) {
  const response = await fetch(`${API_URL}/rooms/leave`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session}`
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to leave Room');
  }
  
  const data = await response.json();
  return data;
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
    throw new Error('Failed to get chores');
  }
  const data = await response.json();
  return data;
}

export async function apiCreateChore(session: any, description: string, endDate: string, autorotate: boolean, isTask: boolean, recurrence: string) {
  const response = await fetch(`${API_URL}/chores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session}`
    },
    body: JSON.stringify({
      description,
      end_date: endDate,
      autorotate,
      is_task: isTask,
      recurrence
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create chore');
  }

  const data = await response.json();
  return data.chore;
}

export async function apiUpdateChore(session: any, choreId: number, updates: {
  description?: string;
  end_date?: string;
  autorotate?: boolean;
  is_task?: boolean;
  recurrence?: string;
  completed?: boolean;
}) {
  const response = await fetch(`${API_URL}/chores/${choreId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session}`
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update chore');
  }

  const data = await response.json();
  return data.chore;
}

export async function apiDeleteChore(session: any, choreId: number) {
  const response = await fetch(`${API_URL}/chores/${choreId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${session}`
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to delete chore');
  }
}