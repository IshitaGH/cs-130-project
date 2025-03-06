import {
  apiSignIn,
  apiCreateAccount,
  apiGetRoom,
  apiCreateRoom,
  apiJoinRoom,
  apiLeaveRoom,
  apiGetChores,
  apiCreateChore,
  apiUpdateChore,
  apiDeleteChore,
  apiGetRoommates
} from '@/utils/api/apiClient';
import { API_URL } from '@/config';

global.fetch = jest.fn();

describe('API Client', () => {
  const mockSession = 'fake-jwt-token';
  
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('apiSignIn', () => {
    test('returns access token on successful login', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ access_token: 'jwt-token' })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiSignIn('testuser', 'password123');

      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: 'testuser', password: 'password123' })
      });
      expect(result).toBe('jwt-token');
    });

    test('throws error on failed login', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ message: 'Invalid credentials' })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(apiSignIn('testuser', 'wrongpassword')).rejects.toThrow('Invalid credentials');
    });
  });

  describe('apiCreateAccount', () => {
    test('successfully creates an account', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({})
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await apiCreateAccount('John', 'Doe', 'johndoe', 'password123');

      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          first_name: 'John', 
          last_name: 'Doe', 
          username: 'johndoe', 
          password: 'password123' 
        })
      });
    });

    test('throws error on account creation failure', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ message: 'Username already exists' })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(apiCreateAccount('John', 'Doe', 'existinguser', 'password123')).rejects.toThrow('Username already exists');
    });
  });

  describe('apiGetRoom', () => {
    test('returns room data on success', async () => {
      const mockRoomData = { room_id: 123, room_name: 'Test Room' };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockRoomData)
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiGetRoom(mockSession);

      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/room`, {
        method: 'GET',
        headers: { 'Authorization': `Bearer ${mockSession}` }
      });
      expect(result).toEqual(mockRoomData);
    });

    test('throws error when getting room fails', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ message: 'Unauthorized' })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(apiGetRoom(mockSession)).rejects.toThrow('Unauthorized');
    });
  });

  describe('apiCreateRoom', () => {
    test('creates a room successfully', async () => {
      const mockRoomData = { room_id: 123, room_name: 'New Room' };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockRoomData)
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiCreateRoom(mockSession, 'New Room');

      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/rooms`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockSession}`
        },
        body: JSON.stringify({ room_name: 'New Room' })
      });
      expect(result).toEqual(mockRoomData);
    });

    test('throws error when creating room fails', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ message: 'Room creation failed' })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(apiCreateRoom(mockSession, 'New Room')).rejects.toThrow('Room creation failed');
    });
  });

  describe('apiJoinRoom', () => {
    test('joins a room successfully', async () => {
      const mockRoomData = { room_id: 123, room_name: 'Joined Room' };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue(mockRoomData)
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiJoinRoom(mockSession, 'ABC123');

      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/rooms/join`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockSession}`
        },
        body: JSON.stringify({ invite_code: 'ABC123' })
      });
      expect(result).toEqual(mockRoomData);
    });

    test('throws error when joining room fails', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ message: 'Invalid invite code' })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(apiJoinRoom(mockSession, 'WRONG123')).rejects.toThrow('Invalid invite code');
    });
  });

  describe('apiLeaveRoom', () => {
    test('leaves a room successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ success: true })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiLeaveRoom(mockSession);

      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/rooms/leave`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${mockSession}`
        }
      });
      expect(result).toEqual({ success: true });
    });

    test('throws error when leaving room fails', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ message: 'Not in a room' })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(apiLeaveRoom(mockSession)).rejects.toThrow('Not in a room');
    });
  });

  describe('apiGetChores', () => {
    test('gets chores successfully', async () => {
      const mockChores = [
        { id: 1, description: 'Clean kitchen' },
        { id: 2, description: 'Take out trash' }
      ];
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ chores: mockChores })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiGetChores(mockSession);

      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/chores`, {
        headers: {
          'Authorization': `Bearer ${mockSession}`
        }
      });
      expect(result).toEqual(mockChores);
    });

    test('throws error when getting chores fails', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ message: 'Failed to get chores' })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(apiGetChores(mockSession)).rejects.toThrow('Failed to get chores');
    });
  });

  describe('apiCreateChore', () => {
    test('creates a chore successfully', async () => {
      const mockChore = { id: 1, description: 'New chore' };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ chore: mockChore })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiCreateChore(
        mockSession,
        'New chore',
        '2023-01-01',
        '2023-01-31',
        false,
        'weekly',
        1,
        [1, 2, 3]
      );

      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/chores`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockSession}`
        },
        body: JSON.stringify({
          description: 'New chore',
          start_date: '2023-01-01',
          end_date: '2023-01-31',
          is_task: false,
          recurrence: 'weekly',
          assigned_roommate_id: 1,
          rotation_order: [1, 2, 3]
        })
      });
      expect(result).toEqual(mockChore);
    });

    test('throws error when creating chore fails', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ message: 'Failed to create chore' })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(apiCreateChore(
        mockSession,
        'New chore',
        '2023-01-01',
        '2023-01-31',
        false,
        'weekly',
        1,
        [1, 2, 3]
      )).rejects.toThrow('Failed to create chore');
    });
  });

  describe('apiUpdateChore', () => {
    test('updates a chore successfully', async () => {
      const mockChore = { id: 1, description: 'Updated chore' };
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ chore: mockChore })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const updates = {
        description: 'Updated chore',
        completed: true
      };

      const result = await apiUpdateChore(mockSession, 1, updates);

      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/chores/1`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${mockSession}`
        },
        body: JSON.stringify(updates)
      });
      expect(result).toEqual(mockChore);
    });

    test('throws error when updating chore fails', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ message: 'Failed to update chore' })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(apiUpdateChore(
        mockSession,
        1,
        { description: 'Updated chore' }
      )).rejects.toThrow('Failed to update chore');
    });
  });

  describe('apiDeleteChore', () => {
    test('deletes a chore successfully', async () => {
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({})
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await apiDeleteChore(mockSession, 1);

      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/chores/1`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${mockSession}`
        }
      });
    });

    test('throws error when deleting chore fails', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ message: 'Failed to delete chore' })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(apiDeleteChore(mockSession, 1)).rejects.toThrow('Failed to delete chore');
    });
  });

  describe('apiGetRoommates', () => {
    test('gets roommates successfully', async () => {
      const mockRoommates = [
        { id: 1, name: 'John Doe' },
        { id: 2, name: 'Jane Smith' }
      ];
      const mockResponse = {
        ok: true,
        json: jest.fn().mockResolvedValue({ roommates: mockRoommates })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      const result = await apiGetRoommates(mockSession);

      expect(global.fetch).toHaveBeenCalledWith(`${API_URL}/roommates`, {
        headers: {
          'Authorization': `Bearer ${mockSession}`
        }
      });
      expect(result).toEqual(mockRoommates);
    });

    test('throws error when getting roommates fails', async () => {
      const mockResponse = {
        ok: false,
        json: jest.fn().mockResolvedValue({ message: 'Failed to get roommates' })
      };
      (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

      await expect(apiGetRoommates(mockSession)).rejects.toThrow('Failed to get roommates');
    });
  });
}); 