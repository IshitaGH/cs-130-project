import { render, RenderResult, fireEvent, waitFor } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuthContext } from '@/contexts/AuthContext';
import { apiGetRoom } from '@/utils/api/apiClient';
import LoginScreen from '@/app/(auth)/login';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    back: jest.fn(),
  })),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

jest.mock('@/utils/api/apiClient', () => ({
  apiGetRoom: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

describe('<LoginScreen />', () => {
  let renderResult: RenderResult;
  let mockRouter: { push: jest.Mock; back: jest.Mock };
  let mockSignIn: jest.Mock;
  
  beforeEach(() => {
    mockRouter = {
      push: jest.fn(),
      back: jest.fn(),
    };
    mockSignIn = jest.fn();
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuthContext as jest.Mock).mockReturnValue({
      signIn: mockSignIn,
      session: null,
      sessionLoading: false,
    });

    renderResult = render(<LoginScreen />);
  });

  test('renders login form elements correctly', () => {
    const { getByPlaceholderText, getByText } = renderResult;
    
    expect(getByPlaceholderText('Username')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('Back to Welcome')).toBeTruthy();
  });

  test('handles user input correctly', () => {
    const { getByPlaceholderText } = renderResult;
    
    const usernameInput = getByPlaceholderText('Username');
    const passwordInput = getByPlaceholderText('Password');
    
    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');
    
    expect(usernameInput.props.value).toBe('testuser');
    expect(passwordInput.props.value).toBe('password123');
  });

  test('calls signIn with correct credentials when login button is pressed', async () => {
    const { getByPlaceholderText, getByText } = renderResult;
    
    const usernameInput = getByPlaceholderText('Username');
    const passwordInput = getByPlaceholderText('Password');
    const signInButton = getByText('Sign In');
    
    fireEvent.changeText(usernameInput, 'testuser');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(signInButton);
    
    expect(mockSignIn).toHaveBeenCalledWith('testuser', 'password123');
  });

  test('shows error toast when login fails', async () => {
    const { getByText } = renderResult;
    const error = new Error('Invalid credentials');
    mockSignIn.mockRejectedValueOnce(error);
    
    fireEvent.press(getByText('Sign In'));
    
    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Error',
        text2: error.message,
      });
    });
  });

  test('navigates back when back button is pressed', () => {
    const { getByText } = renderResult;
    const backButton = getByText('Back to Welcome');
    
    fireEvent.press(backButton);
    
    expect(mockRouter.back).toHaveBeenCalled();
  });

  test('redirects to room-landing when logged in without room', async () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      session: 'fake-token',
      sessionLoading: false,
    });
    (apiGetRoom as jest.Mock).mockResolvedValueOnce({ room_id: null });

    render(<LoginScreen />);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/room-landing');
    });
  });

  test('redirects to home when logged in with room', async () => {
    (useAuthContext as jest.Mock).mockReturnValue({
      session: 'fake-token',
      sessionLoading: false,
    });
    (apiGetRoom as jest.Mock).mockResolvedValueOnce({ room_id: 1 });

    render(<LoginScreen />);

    await waitFor(() => {
      expect(mockRouter.push).toHaveBeenCalledWith('/home');
    });
  });
});
