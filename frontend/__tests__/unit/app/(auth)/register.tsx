import { render, RenderResult, fireEvent, waitFor, within } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import Toast from 'react-native-toast-message';
import { useAuthContext } from '@/contexts/AuthContext';
import RegisterScreen from '@/app/(auth)/register';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    replace: jest.fn(),
    back: jest.fn(),
  })),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

jest.mock('react-native-toast-message', () => ({
  show: jest.fn(),
}));

describe('<RegisterScreen />', () => {
  let renderResult: RenderResult;
  let mockRouter: { replace: jest.Mock; back: jest.Mock };
  let mockCreateAccount: jest.Mock;
  
  beforeEach(() => {
    mockRouter = {
      replace: jest.fn(),
      back: jest.fn(),
    };
    mockCreateAccount = jest.fn();
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuthContext as jest.Mock).mockReturnValue({
      createAccount: mockCreateAccount,
    });

    renderResult = render(<RegisterScreen />);
  });

  test('renders registration form elements correctly', () => {
    const { getByPlaceholderText, getByTestId, getByText } = renderResult;
    
    expect(getByPlaceholderText('First Name')).toBeTruthy();
    expect(getByPlaceholderText('Last Name')).toBeTruthy();
    expect(getByPlaceholderText('Username')).toBeTruthy();
    expect(getByPlaceholderText('Password')).toBeTruthy();
    expect(getByTestId('register-button')).toBeTruthy();
    expect(getByText('Back to Welcome')).toBeTruthy();
  });

  test('handles user input correctly', () => {
    const { getByPlaceholderText } = renderResult;
    
    const firstNameInput = getByPlaceholderText('First Name');
    const lastNameInput = getByPlaceholderText('Last Name');
    const usernameInput = getByPlaceholderText('Username');
    const passwordInput = getByPlaceholderText('Password');
    
    fireEvent.changeText(firstNameInput, 'John');
    fireEvent.changeText(lastNameInput, 'Doe');
    fireEvent.changeText(usernameInput, 'johndoe');
    fireEvent.changeText(passwordInput, 'password123');
    
    expect(firstNameInput.props.value).toBe('John');
    expect(lastNameInput.props.value).toBe('Doe');
    expect(usernameInput.props.value).toBe('johndoe');
    expect(passwordInput.props.value).toBe('password123');
  });

  test('calls createAccount with correct credentials when register button is pressed', async () => {
    const { getByPlaceholderText, getByTestId } = renderResult;
    
    const firstNameInput = getByPlaceholderText('First Name');
    const lastNameInput = getByPlaceholderText('Last Name');
    const usernameInput = getByPlaceholderText('Username');
    const passwordInput = getByPlaceholderText('Password');
    const registerButton = getByTestId('register-button');
    
    fireEvent.changeText(firstNameInput, 'John');
    fireEvent.changeText(lastNameInput, 'Doe');
    fireEvent.changeText(usernameInput, 'johndoe');
    fireEvent.changeText(passwordInput, 'password123');
    fireEvent.press(registerButton);
    
    await waitFor(() => {
      expect(mockCreateAccount).toHaveBeenCalledWith('John', 'Doe', 'johndoe', 'password123');
    });
  });

  test('shows toast error when registration fails', async () => {
    const { getByTestId } = renderResult;
    const error = new Error('Username already exists');
    mockCreateAccount.mockRejectedValueOnce(error);
    
    fireEvent.press(getByTestId('register-button'));
    
    await waitFor(() => {
      expect(Toast.show).toHaveBeenCalledWith({
        type: 'error',
        text1: 'Error',
        text2: error.message,
      });
    });
  });

  test('navigates to login screen after successful registration', async () => {
    const { getByTestId } = renderResult;
    mockCreateAccount.mockResolvedValueOnce(undefined);
    
    fireEvent.press(getByTestId('register-button'));
    
    await waitFor(() => {
      expect(mockRouter.replace).toHaveBeenCalledWith('/login');
    });
  });

  test('navigates back when back button is pressed', () => {
    const { getByText } = renderResult;
    const backButton = getByText('Back to Welcome');
    
    fireEvent.press(backButton);
    
    expect(mockRouter.back).toHaveBeenCalled();
  });
});
