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

  if (response.status === 404) {
    return {
      room_id: null
    }
  }

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

export async function apiCreateExpense(session: any, cost: number, desc: string, payerId: number, expenses: any[]) {
  const body = {
    cost,
    description: desc,
    expenses,
    roommate_spendor_id: payerId
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

export async function apiGetProfilePicture(session: any, userId?: string) {
  const url = userId 
    ? `${API_URL}/profile_picture?user_id=${userId}` 
    : `${API_URL}/profile_picture`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${session}`,
      },
    });

    //handle 404 error specifically
    if (response.status === 404) {
      console.log('No profile picture found, returning null.');
      return null; //return null to indicate no profile picture
    }

    // Check if the response is OK (status code 200-299)
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch profile picture');
    }

    //convert the Blob to a base64-encoded string
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);
    return `data:image/jpeg;base64,${base64}`; //prepend the data URI scheme
  } catch (error) {
    console.error('Error fetching profile picture:', error);
    throw new Error('Network error or failed to fetch profile picture');
  }
}

//convert Blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

export async function apiUpdateProfilePicture(session: any, profilePicture: string | File) {
  let body;
  let headers;

  if (typeof profilePicture === 'string') {
    //if profilePicture is base64 string, send it as JSON
    body = JSON.stringify({ profile_picture: profilePicture });
    headers = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session}`,
    };
  } else {
    //if profilePicture file, use FormData
    const formData = new FormData();
    formData.append('profile_picture', {
      uri: profilePicture.uri,
      name: 'profile.jpg', //file name
      type: 'image/jpeg', //adjust the MIME type based on the image
    });

    body = formData;
    headers = {
      'Content-Type': 'multipart/form-data',
      Authorization: `Bearer ${session}`,
    };
  }

  const response = await fetch(`${API_URL}/profile_picture`, {
    method: 'PUT',
    headers,
    body,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update profile picture');
  }

  return await response.json();
}