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
    throw new Error(errorData.message);
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
    throw new Error(errorData.message);
  }
}

export async function apiGetRoom(session: any) {
  const response = await fetch(`${API_URL}/room`, {
    method: 'GET',
    headers: { 'Authorization': `Bearer ${session}` },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
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
    throw new Error(errorData.message);
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
    throw new Error(errorData.message);
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
    throw new Error(errorData.message);
  }
  
  const data = await response.json();
  return data;
}

export async function apiGetChores(session: any) {
  const response = await fetch(`${API_URL}/chores`, {
    headers: {
      Authorization: `Bearer ${session}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
  const data = await response.json();
  return data.chores;
}

export async function apiCreateChore(
  session: any,
  description: string,
  startDate: string,
  endDate: string,
  isTask: boolean,
  recurrence: string,
  assignedRoommateId: number,
  rotationOrder: number[] | null
) {
  const response = await fetch(`${API_URL}/chores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session}`
    },
    body: JSON.stringify({
      description,
      start_date: startDate,
      end_date: endDate,
      is_task: isTask,
      recurrence,
      assigned_roommate_id: assignedRoommateId,
      rotation_order: rotationOrder
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }

  const data = await response.json();
  return data.chore;
}

export async function apiUpdateChore(session: any, choreId: number, updates: {
  description?: string;
  start_date?: string;
  end_date?: string;
  is_task?: boolean;
  recurrence?: string;
  completed?: boolean;
  assigned_roommate_id?: number;
  rotation_order?: number[] | null;
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
    throw new Error(errorData.message);
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
    throw new Error(errorData.message);
  }
}

export async function apiGetRoommates(session: any) {
  const response = await fetch(`${API_URL}/roommates`, {
    headers: {
      Authorization: `Bearer ${session}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
  const data = await response.json();
  return data.roommates;
}