// @ts-ignore
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

  if (response.status === 404) {
    return {
      room_id: null
    }
  }

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
  return data.chores;
}

export async function apiCreateChore(session: any, description: string, startDate: string, endDate: string, autorotate: boolean, isTask: boolean, recurrence: string, assignedRoommateId: number) {
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
      autorotate,
      is_task: isTask,
      recurrence,
      assigned_roommate_id: assignedRoommateId
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
  start_date?: string;
  end_date?: string;
  autorotate?: boolean;
  is_task?: boolean;
  recurrence?: string;
  completed?: boolean;
  assigned_roommate_id?: number;
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

export async function apiGetRoommates(session: any) {
  const response = await fetch(`${API_URL}/roommates`, {
    headers: {
      Authorization: `Bearer ${session}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to get roommates');
  }
  const data = await response.json();
  return data.roommates;
}

export async function apiGetRoommates(session: any) {
  const response = await fetch(`${API_URL}/roommates`, {
    headers: {
      Authorization: `Bearer ${session}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to get roommates');
  }
  const data = await response.json();
  return data;
}

// EXPENSES
async function apiCreateFirstExpensePeriod(session: any) {
  const response = await fetch(`${API_URL}/expense_period`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session}`
    },
    body: "{}"
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to create initial expense period');
  }
}

export async function apiGetExpenses(session: any) {
  const response = await fetch(`${API_URL}/expense_period`, {
    headers: {
      Authorization: `Bearer ${session}`
    }
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to get expenses');
  }

  if (data.length === 0) { // new room; need to create first expense period
    await apiCreateFirstExpensePeriod(session);
    return await apiGetExpenses(session);
  }

  return data;
}

export async function apiCreateExpense(session: any, cost: number, desc: string, expenses: any[]) {
  const body = {
    title: "a",
    cost,
    description: desc,
    expenses
  };

  const response = await fetch(`${API_URL}/expense`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session}`
    },
    body: JSON.stringify(body)
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to create expense');
  }

  return data;
}

export async function apiDeleteExpense(session: any, id: number) {
  const response = await fetch(`${API_URL}/expense`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session}`
    },
    body: JSON.stringify({ id })
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.message || 'Failed to delete expense');
  }
}

export async function apiCloseExpensePeriod(session: any) {
  const response = await fetch(`${API_URL}/expense_period`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session}`
    },
    body: '{}'
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to close expense period');
  }

  return data;
}
