import '@mantine/core/styles.css';
import '@mantine/code-highlight/styles.css';
import '@mantine/notifications/styles.css';
import './styles.css';

import { CodeHighlightAdapterProvider, createHighlightJsAdapter } from '@mantine/code-highlight';
import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import { Notifications } from '@mantine/notifications';
import hljs from 'highlight.js/lib/core';
import yaml from 'highlight.js/lib/languages/yaml';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { theme } from './theme';

// Only YAML is highlighted, so only that grammar is bundled.
hljs.registerLanguage('yaml', yaml);
const highlightAdapter = createHighlightJsAdapter(hljs);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <MantineProvider theme={theme} defaultColorScheme="auto">
      <CodeHighlightAdapterProvider adapter={highlightAdapter}>
        <ModalsProvider>
          <Notifications position="bottom-right" />
          <App />
        </ModalsProvider>
      </CodeHighlightAdapterProvider>
    </MantineProvider>
  </StrictMode>,
);
