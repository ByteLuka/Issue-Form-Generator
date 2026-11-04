import {
  Card,
  Collapse,
  Group,
  SimpleGrid,
  Stack,
  TagsInput,
  Text,
  TextInput,
  UnstyledButton,
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { IconChevronDown, IconSettings } from '@tabler/icons-react';
import { useFormStore } from '../../store/formStore';

const SPLIT_CHARS = [',', ' '];

/** Top-level keys of the issue form: name, description, title, labels, ... */
export function FormSettingsEditor() {
  const settings = useFormStore((state) => state.settings);
  const update = useFormStore((state) => state.updateSettings);
  const [advancedOpened, advanced] = useDisclosure(
    settings.assignees.length > 0 || settings.projects.length > 0 || !!settings.type,
  );

  return (
    <Card withBorder padding="lg">
      <Stack gap="sm">
        <Group gap="xs">
          <IconSettings size={18} />
          <Text fw={600}>Form settings</Text>
        </Group>

        <SimpleGrid cols={{ base: 1, sm: 2 }}>
          <TextInput
            label="Name"
            description="Shown in the template chooser. Must be unique."
            placeholder="Bug report"
            required
            value={settings.name}
            onChange={(e) => update({ name: e.currentTarget.value })}
          />
          <TextInput
            label="Issue title"
            description="Pre-filled title of new issues."
            placeholder="[Bug]: "
            value={settings.title}
            onChange={(e) => update({ title: e.currentTarget.value })}
          />
        </SimpleGrid>

        <TextInput
          label="Description"
          description="Shown below the name in the template chooser."
          placeholder="File a bug report"
          required
          value={settings.description}
          onChange={(e) => update({ description: e.currentTarget.value })}
        />

        <TagsInput
          label="Labels"
          description="Added automatically. Labels that do not exist in the repository are ignored."
          placeholder="Type a label and press Enter"
          splitChars={SPLIT_CHARS}
          acceptValueOnBlur
          clearable
          value={settings.labels}
          onChange={(labels) => update({ labels })}
        />

        <UnstyledButton onClick={advanced.toggle} aria-expanded={advancedOpened}>
          <Group gap={4}>
            <Text size="sm" c="dimmed">
              Assignees, projects & issue type
            </Text>
            <IconChevronDown
              size={14}
              style={{
                transform: advancedOpened ? 'rotate(180deg)' : undefined,
                transition: 'transform 150ms',
              }}
            />
          </Group>
        </UnstyledButton>

        <Collapse expanded={advancedOpened}>
          <Stack gap="sm">
            <TagsInput
              label="Assignees"
              description="GitHub usernames to assign automatically."
              placeholder="octocat"
              splitChars={SPLIT_CHARS}
              acceptValueOnBlur
              clearable
              value={settings.assignees}
              onChange={(assignees) =>
                update({ assignees: assignees.map((a) => a.replace(/^@/, '')) })
              }
            />
            <TagsInput
              label="Projects"
              description="Format OWNER/PROJECT-NUMBER. The reporter needs write access to the project."
              placeholder="octo-org/1"
              splitChars={SPLIT_CHARS}
              acceptValueOnBlur
              clearable
              value={settings.projects}
              onChange={(projects) => update({ projects })}
            />
            <TextInput
              label="Issue type"
              description="An issue type defined in your organization, e.g. Bug or Feature."
              placeholder="Bug"
              value={settings.type}
              onChange={(e) => update({ type: e.currentTarget.value })}
            />
          </Stack>
        </Collapse>
      </Stack>
    </Card>
  );
}
