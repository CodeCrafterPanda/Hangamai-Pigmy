import React from 'react';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import GradientButton from './GradientButton';

describe('<GradientButton />', () => {
  it('renders correctly with a title and gradation colors', async () => {
    render(
      <ThemeProvider>
        <GradientButton
          title="Click Me"
          gradientBackgroundProps={{
            colors: ['blue', 'red'],
            start: { x: 0, y: 1 },
            end: { x: 0.8, y: 0 },
          }}
        />
      </ThemeProvider>,
    );
    const button = screen.getByText(/Click Me/i);
    expect(button).not.toBeNull();
  });
});
