import { render, RenderResult, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiJoinRoom } from '@/utils/api/apiClient';
import JoinRoomScreen from '@/app/(room)/join-room';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
    back: jest.fn(),
  })),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

jest.mock('@/utils/api/apiClient', () => ({
  apiJoinRoom: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

describe('<JoinRoomScreen />', () => {
  let renderResult: RenderResult;
  let mockRouter: { replace: jest.Mock; back: jest.Mock };
  let mockSession: string;
  
  beforeEach(() => {
    mockRouter = {
      replace: jest.fn(),
      back: jest.fn(),
    };
    mockSession = 'fake-session-token';
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuthContext as jest.Mock).mockReturnValue({
      session: mockSession,
    });
    (apiJoinRoom as jest.Mock).mockResolvedValue(undefined);

    renderResult = render(<JoinRoomScreen />);
  });

  test('renders join room form elements correctly', () => {
    const { getByPlaceholderText, getByText } = renderResult;
    
    expect(getByText('Join a Room')).toBeTruthy();
    expect(getByPlaceholderText('Enter Invite Code')).toBeTruthy();
    expect(getByText('Join Room')).toBeTruthy();
    expect(getByText('Back to Room Manager')).toBeTruthy();
  });

  test('handles invite code input correctly', () => {
    const { getByPlaceholderText } = renderResult;
    
    const inviteCodeInput = getByPlaceholderText('Enter Invite Code');
    
    fireEvent.changeText(inviteCodeInput, 'ABC123');
    
    expect(inviteCodeInput.props.value).toBe('ABC123');
  });

  test('calls apiJoinRoom with correct parameters when join button is pressed', async () => {
    const { getByPlaceholderText, getByText } = renderResult;
    
    const inviteCodeInput = getByPlaceholderText('Enter Invite Code');
    const joinButton = getByText('Join Room');
    
    fireEvent.changeText(inviteCodeInput, 'ABC123');
    fireEvent.press(joinButton);
    
    await waitFor(() => {
      expect(apiJoinRoom).toHaveBeenCalledWith(mockSession, 'ABC123');
    });
  });

  test('navigates to home screen after successfully joining a room', async () => {
    const { getByText } = renderResult;
    
    fireEvent.press(getByText('Join Room'));
    
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/home');
    });
  });

  test('shows toast error when joining room fails', async () => {
    const { getByText } = renderResult;
    const error = new Error('Invalid invite code');
    (apiJoinRoom as jest.Mock).mockRejectedValueOnce(error);
    
    fireEvent.press(getByText('Join Room'));
    
    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Error Joining Room',
        text2: error.message,
      });
    });
    expect(mockRouter.replace).not.toHaveBeenCalled();
  });

  test('navigates back when back button is pressed', () => {
    const { getByText } = renderResult;
    const backButton = getByText('Back to Room Manager');
    
    fireEvent.press(backButton);
    
    expect(mockRouter.back).toHaveBeenCalled();
  });
}); 