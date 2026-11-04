import { Container, Stack } from '@mantine/core';
import { ElementList } from './ElementList';
import { FormSettingsEditor } from './FormSettingsEditor';

/** Left side of the split view. */
export function Editor() {
  return (
    <Container size="md" py="md" px="md">
      <Stack gap="lg">
        <FormSettingsEditor />
        <ElementList />
      </Stack>
    </Container>
  );
}
