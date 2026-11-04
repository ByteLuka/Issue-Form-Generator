import { Container, ScrollArea, Stack } from '@mantine/core';
import { useActiveTemplate } from '../../store/hooks';
import { ConfigEditor } from './ConfigEditor';
import { ElementList } from './ElementList';
import { FormSettingsEditor } from './FormSettingsEditor';
import { TemplateTabs } from './TemplateTabs';

/** Left side of the split view: template tabs plus the editor of the open template or config.yml. */
export function Editor() {
  const template = useActiveTemplate();

  return (
    <Stack h="100%" gap={0}>
      <TemplateTabs />
      <ScrollArea style={{ flex: 1, minHeight: 0 }} type="auto">
        <Container size="md" py="md" px="md">
          {template ? (
            // The key resets dialogs and scroll-dependent state when switching templates.
            <Stack gap="lg" key={template.uid}>
              <FormSettingsEditor />
              <ElementList />
            </Stack>
          ) : (
            <ConfigEditor />
          )}
        </Container>
      </ScrollArea>
    </Stack>
  );
}
