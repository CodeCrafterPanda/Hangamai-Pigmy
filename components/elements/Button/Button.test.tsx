import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import Button from './Button';

describe('<Button />', () => {
  test('renders correctly with a title', async () => {
    render(
      <ThemeProvider>
        <Button title="Click Me" />
      </ThemeProvider>
    );
    const button = screen.getByText(/Click Me/i);
    expect(button).not.toBeNull();
  });
});
