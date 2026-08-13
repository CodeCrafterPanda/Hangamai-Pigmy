import { test, expect } from '@jest/globals';
import { render, screen } from '@testing-library/react-native';
import { ThemeProvider } from '@/theme';
import { LanguageProvider } from '@/i18n';
import LanguageSwitcher from './LanguageSwitcher';

describe('<LanguageSwitcher />', () => {
  test('renders the language icon label for the current language', async () => {
    render(
      <ThemeProvider>
        <LanguageProvider initialLanguage="mr">
          <LanguageSwitcher />
        </LanguageProvider>
      </ThemeProvider>,
    );

    const label = await screen.findByText('म');
    expect(label).not.toBeNull();
  });
});
