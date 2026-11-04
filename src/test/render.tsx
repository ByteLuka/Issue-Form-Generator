import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement } from 'react';
import { theme } from '../theme';

/** Renders with the app's providers. `env="test"` disables transitions and portals. */
export function renderWithProviders(ui: ReactElement) {
  return {
    user: userEvent.setup(),
    ...render(
      <MantineProvider theme={theme} env="test">
        <ModalsProvider>{ui}</ModalsProvider>
      </MantineProvider>,
    ),
  };
}
