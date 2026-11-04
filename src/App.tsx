import { AppShell, Box, ScrollArea, SegmentedControl, Splitter, Stack } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';
import { useState } from 'react';
import { Editor } from './components/editor/Editor';
import { Header } from './components/Header';
import { OutputPanel } from './components/output/OutputPanel';

const HEADER_HEIGHT = 56;

export function App() {
  // Below the `md` breakpoint there is not enough room for two columns.
  const isWide = useMediaQuery('(min-width: 62em)', true);
  const [mobileView, setMobileView] = useState<'editor' | 'output'>('editor');

  return (
    <AppShell header={{ height: HEADER_HEIGHT }} padding={0}>
      <AppShell.Header>
        <Header />
      </AppShell.Header>

      <AppShell.Main h="100dvh">
        <Box h={`calc(100dvh - ${HEADER_HEIGHT}px)`}>
          {isWide ? (
            <Splitter h="100%">
              <Splitter.Pane defaultSize={55} min={30}>
                <ScrollArea h="100%" type="auto">
                  <Editor />
                </ScrollArea>
              </Splitter.Pane>
              <Splitter.Pane defaultSize={45} min={25}>
                <OutputPanel />
              </Splitter.Pane>
            </Splitter>
          ) : (
            <Stack h="100%" gap={0}>
              <Box p="xs">
                <SegmentedControl
                  fullWidth
                  value={mobileView}
                  onChange={(value) => setMobileView(value as 'editor' | 'output')}
                  data={[
                    { value: 'editor', label: 'Editor' },
                    { value: 'output', label: 'YAML & Preview' },
                  ]}
                />
              </Box>
              <Box style={{ flex: 1, minHeight: 0 }}>
                {mobileView === 'editor' ? (
                  <ScrollArea h="100%" type="auto">
                    <Editor />
                  </ScrollArea>
                ) : (
                  <OutputPanel />
                )}
              </Box>
            </Stack>
          )}
        </Box>
      </AppShell.Main>
    </AppShell>
  );
}
