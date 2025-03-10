import { API_URL } from '@/config';
import { cacheImage, getCachedImage, formatBase64Image } from '../imageCache';

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
export async function apiCreateAccount(
  firstName: string,
  lastName: string,
  username: string,
  password: string,
) {
  const response = await fetch(`${API_URL}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      first_name: firstName,
      last_name: lastName,
      username,
      password,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
}

export async function apiGetRoom(session: any) {
  const response = await fetch(`${API_URL}/room`, {
    method: 'GET',
    headers: { Authorization: `Bearer ${session}` },
  });

  if (response.status === 404) {
    return {
      room_id: null,
    };
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
      Authorization: `Bearer ${session}`,
    },
    body: JSON.stringify({ room_name: roomName }),
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
      Authorization: `Bearer ${session}`,
    },
    body: JSON.stringify({ invite_code: inviteCode }),
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
      Authorization: `Bearer ${session}`,
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
  rotationOrder: number[] | null,
) {
  const response = await fetch(`${API_URL}/chores`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session}`,
    },
    body: JSON.stringify({
      description,
      start_date: startDate,
      end_date: endDate,
      is_task: isTask,
      recurrence,
      assigned_roommate_id: assignedRoommateId,
      rotation_order: rotationOrder,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }

  const data = await response.json();
  return data.chore;
}

export async function apiUpdateChore(
  session: any,
  choreId: number,
  updates: {
    description?: string;
    start_date?: string;
    end_date?: string;
    is_task?: boolean;
    recurrence?: string;
    completed?: boolean;
    assigned_roommate_id?: number;
    rotation_order?: number[] | null;
  },
) {
  const response = await fetch(`${API_URL}/chores/${choreId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session}`,
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
      Authorization: `Bearer ${session}`,
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
      Authorization: `Bearer ${session}`,
    },
    body: '{}',
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(
      errorData.message || 'Failed to create initial expense period',
    );
  }
}

export async function apiGetExpenses(session: any) {
  const response = await fetch(`${API_URL}/expense_period`, {
    headers: {
      Authorization: `Bearer ${session}`,
    },
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to get expenses');
  }

  if (data.length === 0) {
    // new room; need to create first expense period
    await apiCreateFirstExpensePeriod(session);
    return await apiGetExpenses(session);
  }

  return data;
}

export async function apiCreateExpense(
  session: any,
  cost: number,
  desc: string,
  payerId: number,
  expenses: any[],
) {
  const body = {
    cost,
    description: desc,
    expenses,
    roommate_spendor_id: payerId,
  };

  const response = await fetch(`${API_URL}/expense`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session}`,
    },
    body: JSON.stringify(body),
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
      Authorization: `Bearer ${session}`,
    },
    body: JSON.stringify({ id }),
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
      Authorization: `Bearer ${session}`,
    },
    body: '{}',
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || 'Failed to close expense period');
  }

  return data;
}

export async function apiGetProfilePicture(session: any, userId?: string) {
  // Check cache first
  const cacheKey = `profile_${userId || 'self'}`;
  const cachedImage = getCachedImage(cacheKey);

  if (cachedImage) {
    return cachedImage;
  }

  // If not in cache, fetch from API
  let url = `${API_URL}/profile_picture`;
  if (userId) {
    url += `?user_id=${userId}`;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${session}`,
      },
    });

    if (!response.ok) {
      if (response.status === 404) {
        // Not found is expected for users without profile pictures
        return null;
      }
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch profile picture');
    }

    // Convert the blob to base64
    const blob = await response.blob();
    const base64 = await blobToBase64(blob);

    // Format and cache the image
    const formattedImage = formatBase64Image(base64);
    cacheImage(cacheKey, formattedImage);

    return formattedImage;
  } catch (error) {
    console.error('Error fetching profile picture:', error);
    throw error;
  }
}

/**
 * Optimized function to get roommates with their profile pictures in a batch
 * This reduces the number of network requests and improves loading performance
 */
export async function apiGetRoommatesWithProfiles(session: any) {
  try {
    // First get all roommates
    const roommatesData = await apiGetRoommates(session);

    // Prepare array for promises
    const profileFetchPromises = roommatesData.map(async (roommate: any) => {
      try {
        // Fetch profile picture in parallel
        const profilePicture = await apiGetProfilePicture(
          session,
          roommate.id.toString(),
        );
        return {
          ...roommate,
          profilePicture,
        };
      } catch (error) {
        // If profile picture fetch fails, just return roommate without picture
        console.error(
          `Failed to fetch profile for roommate ${roommate.id}:`,
          error,
        );
        return {
          ...roommate,
          profilePicture: null,
        };
      }
    });

    // Wait for all profile picture requests to complete
    const roommatesWithProfiles = await Promise.all(profileFetchPromises);

    return roommatesWithProfiles;
  } catch (error) {
    console.error('Error fetching roommates with profiles:', error);
    throw error;
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

export async function apiUpdateProfilePicture(
  session: any,
  profilePicture: string | File,
) {
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
    formData.append('profile_picture', profilePicture, 'profile.jpg');

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

//Notifications API
export async function apiCreateNotification(
  session: any,
  notification: {
    title?: string;
    description?: string;
    notification_sender: number;
    notification_recipient: number;
  },
) {
  const response = await fetch(`${API_URL}/notifications`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session}`,
    },
    body: JSON.stringify(notification),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
  return response.json();
}

export async function apiGetNotifications(
  session: any,
  query?: {
    notification_id?: number;
    notification_sender?: number;
    notification_recipient?: number;
  },
) {
  const url = new URL(`${API_URL}/notifications`);
  if (query) {
    Object.entries(query).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });
  }
  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${session}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
  return response.json();
}

export async function apiUpdateNotification(
  session: any,
  notification: {
    notification_id: number;
    title?: string;
    notification_sender?: number;
    notification_recipient?: number;
  },
) {
  const response = await fetch(`${API_URL}/notifications`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session}`,
    },
    body: JSON.stringify(notification),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
  return response.json();
}

export async function apiDeleteNotification(
  session: any,
  notification_id: number,
) {
  const response = await fetch(`${API_URL}/notifications`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session}`,
    },
    body: JSON.stringify({ notification_id }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message);
  }
}

export async function apiUpdateUserInfo(
  session: any,
  updates: {
    first_name?: string;
    last_name?: string;
  },
) {
  const response = await fetch(`${API_URL}/user`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${session}`,
    },
    body: JSON.stringify(updates),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.message || 'Failed to update user information');
  }
  return response.json();
}
