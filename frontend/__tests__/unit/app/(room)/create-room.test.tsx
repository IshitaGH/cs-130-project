import { render, RenderResult, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiCreateRoom } from '@/utils/api/apiClient';
import CreateRoomScreen from '@/app/(room)/create-room';

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
  apiCreateRoom: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

describe('<CreateRoomScreen />', () => {
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
    (apiCreateRoom as jest.Mock).mockResolvedValue(undefined);

    renderResult = render(<CreateRoomScreen />);
  });

  test('renders create room form elements correctly', () => {
    const { getByPlaceholderText, getByText } = renderResult;
    
    expect(getByText('Create a Room')).toBeTruthy();
    expect(getByPlaceholderText('Enter Room Name')).toBeTruthy();
    expect(getByText('Create Room')).toBeTruthy();
    expect(getByText('Back to Room Manager')).toBeTruthy();
  });

  test('handles room name input correctly', () => {
    const { getByPlaceholderText } = renderResult;
    
    const roomNameInput = getByPlaceholderText('Enter Room Name');
    
    fireEvent.changeText(roomNameInput, 'My Awesome Room');
    
    expect(roomNameInput.props.value).toBe('My Awesome Room');
  });

  test('calls apiCreateRoom with correct parameters when create button is pressed', async () => {
    const { getByPlaceholderText, getByText } = renderResult;
    
    const roomNameInput = getByPlaceholderText('Enter Room Name');
    const createButton = getByText('Create Room');
    
    fireEvent.changeText(roomNameInput, 'My Awesome Room');
    fireEvent.press(createButton);
    
    await waitFor(() => {
      expect(apiCreateRoom).toHaveBeenCalledWith(mockSession, 'My Awesome Room');
    });
  });

  test('navigates to home screen after successfully creating a room', async () => {
    const { getByText } = renderResult;
    
    fireEvent.press(getByText('Create Room'));
    
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/home');
    });
  });

  test('shows toast error when creating room fails', async () => {
    const { getByText } = renderResult;
    const error = new Error('Failed to create room');
    (apiCreateRoom as jest.Mock).mockRejectedValueOnce(error);
    
    fireEvent.press(getByText('Create Room'));
    
    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Error Creating Room',
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