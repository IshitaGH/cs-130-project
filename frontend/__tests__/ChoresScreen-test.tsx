// Icon component tries to load native font assets that aren't available in test environment
jest.mock('@expo/vector-icons', () => {
  const React = require('react');
  const { Text } = require('react-native');
  const Icon = (props: any) => React.createElement(Text, props, props.name || 'Icon');
  return {
    MaterialIcons: Icon,
  };
});

import { render } from '@testing-library/react-native';
import { act, fireEvent } from '@testing-library/react-native';
import ChoresScreen from '@/app/(app)/chores';

describe('<ChoresScreen />', () => {
  test('Text renders correctly on ChoresScreen', () => {
    const { getByText } = render(<ChoresScreen />);
    getByText('Your Chores');
    getByText("Roommates' Chores");
  });

  test('Buttons for assigning chores are present', () => {
    const { getByText } = render(<ChoresScreen />);
    getByText('Assign');
  });

  test('Chore input fields are present', async () => {
    // Use timers to ensure that the component has finished updating state by the time it exits act block
    jest.useFakeTimers();

    const { getByText, getByPlaceholderText } = render(<ChoresScreen />);
    const assignButton = getByText('Assign');

    await act(async () => {
      fireEvent.press(assignButton);
      jest.runAllTimers();
    });

    // Now the modal should be visible; query after the state update.
    getByPlaceholderText('Chore Name');
    getByPlaceholderText('Roommate Responsible');

    jest.useRealTimers();
  });
});
