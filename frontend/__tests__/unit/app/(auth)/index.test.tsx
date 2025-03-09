import { render, RenderResult, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import IndexScreen from '@/app/(auth)/index';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

describe('<IndexScreen />', () => {
  let renderResult: RenderResult;
  let mockRouter: { push: jest.Mock };

  beforeEach(() => {
    mockRouter = { push: jest.fn() };
    (useRouter as jest.Mock).mockReturnValue(mockRouter);

    renderResult = render(<IndexScreen />);
  });

  test('renders the app title correctly', () => {
    const { getByText } = renderResult;
    expect(getByText('Roomies')).toBeTruthy();
  });

  test('renders the logo image', () => {
    const { getByTestId } = renderResult;
    const logo = getByTestId('app-logo');
    expect(logo.props.source).toBeTruthy();
  });

  test('renders both Sign In and Sign Up buttons', () => {
    const { getByText } = renderResult;
    expect(getByText('Sign In')).toBeTruthy();
    expect(getByText('Sign Up')).toBeTruthy();
  });

  test('navigates to login screen when Sign In is pressed', () => {
    const { getByText } = renderResult;
    const signInButton = getByText('Sign In');
    
    fireEvent.press(signInButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/login');
  });

  test('navigates to register screen when Sign Up is pressed', () => {
    const { getByText } = renderResult;
    const signUpButton = getByText('Sign Up');
    
    fireEvent.press(signUpButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/register');
  });
});
