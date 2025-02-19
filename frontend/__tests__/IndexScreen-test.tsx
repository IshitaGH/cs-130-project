import { render, RenderResult } from '@testing-library/react-native';

import IndexScreen from '@/app/(auth)/index';

describe('<IndexScreen />', () => {
  let getByText: RenderResult['getByText'];

  beforeEach(() => {
    const renderResult: RenderResult = render(<IndexScreen />);
    getByText = renderResult.getByText;
  });

  test('Text renders correctly on IndexScreen', () => {
    getByText('Roomies');
  });

  test('Sign In button is present and has correct text', () => {
    getByText('Sign In');
  });

  test('Sign Up button is present and has correct text', () => {
    getByText('Sign Up');
  });
});
