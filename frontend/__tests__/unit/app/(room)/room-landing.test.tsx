import { render, RenderResult, fireEvent } from '@testing-library/react-native';
import { useRouter } from 'expo-router';
import { useAuthContext } from '@/contexts/AuthContext';
import RoomLandingScreen from '@/app/(room)/room-landing';

jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
  })),
}));

jest.mock('@/contexts/AuthContext', () => ({
  useAuthContext: jest.fn(),
}));

describe('<RoomLandingScreen />', () => {
  let renderResult: RenderResult;
  let mockRouter: { push: jest.Mock };
  let mockSignOut: jest.Mock;

  beforeEach(() => {
    mockRouter = { push: jest.fn() };
    mockSignOut = jest.fn();
    
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuthContext as jest.Mock).mockReturnValue({
      signOut: mockSignOut,
    });

    renderResult = render(<RoomLandingScreen />);
  });

  test('renders the app logo', () => {
    const { getByTestId } = renderResult;
    const logo = getByTestId('app-logo');
    expect(logo.props.source).toBeTruthy();
  });

  test('renders both Join Room and Create Room buttons', () => {
    const { getByText } = renderResult;
    expect(getByText('Join Room')).toBeTruthy();
    expect(getByText('Create Room')).toBeTruthy();
  });

  test('renders Sign Out button', () => {
    const { getByText } = renderResult;
    expect(getByText('Sign Out')).toBeTruthy();
  });

  test('navigates to join-room screen when Join Room is pressed', () => {
    const { getByText } = renderResult;
    const joinRoomButton = getByText('Join Room');
    
    fireEvent.press(joinRoomButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/join-room');
  });

  test('navigates to create-room screen when Create Room is pressed', () => {
    const { getByText } = renderResult;
    const createRoomButton = getByText('Create Room');
    
    fireEvent.press(createRoomButton);
    
    expect(mockRouter.push).toHaveBeenCalledWith('/create-room');
  });

  test('calls signOut when Sign Out button is pressed', () => {
    const { getByText } = renderResult;
    const signOutButton = getByText('Sign Out');
    
    fireEvent.press(signOutButton);
    
    expect(mockSignOut).toHaveBeenCalled();
  });
}); 