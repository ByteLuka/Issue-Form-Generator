import {
  ActionIcon,
  Alert,
  Button,
  Card,
  Group,
  SimpleGrid,
  Stack,
  Switch,
  Text,
  TextInput,
  Tooltip,
} from '@mantine/core';
import {
  IconArrowDown,
  IconArrowUp,
  IconInfoCircle,
  IconLink,
  IconPlus,
  IconSettings,
  IconTrash,
} from '@tabler/icons-react';
import type { ContactLink } from '../../lib/types';
import { createContactLink, isDefaultConfig } from '../../lib/workspace';
import { useValidation } from '../../store/hooks';
import { useWorkspaceStore } from '../../store/workspaceStore';

/** Editor for `.github/ISSUE_TEMPLATE/config.yml` (the template chooser). */
export function ConfigEditor() {
  const config = useWorkspaceStore((s) => s.config);
  const updateConfig = useWorkspaceStore((s) => s.updateConfig);
  const issues = useValidation();

  const links = config.contactLinks;
  const setLinks = (contactLinks: ContactLink[]) => updateConfig({ contactLinks });
  const updateLink = (uid: string, patch: Partial<ContactLink>) =>
    setLinks(links.map((link) => (link.uid === uid ? { ...link, ...patch } : link)));
  const move = (from: number, to: number) => {
    const next = [...links];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    setLinks(next);
  };
  const linkHasError = (uid: string) => issues.some((i) => i.elementUid === uid);

  return (
    <Stack gap="lg">
      <Card withBorder padding="lg">
        <Stack gap="sm">
          <Group gap="xs">
            <IconSettings size={18} />
            <Text fw={600}>Template chooser</Text>
          </Group>
          <Text size="sm" c="dimmed">
            <code>config.yml</code> controls the page where people pick a template when they open a
            new issue.
          </Text>
          <Switch
            label="Allow blank issues"
            description="When off, only people with write access can still open a blank issue (labelled 'Maintainers only')."
            checked={config.blankIssuesEnabled}
            onChange={(e) => updateConfig({ blankIssuesEnabled: e.currentTarget.checked })}
          />
          {isDefaultConfig(config) && (
            <Alert variant="light" color="blue" icon={<IconInfoCircle size={18} />} p="xs">
              <Text size="xs">
                These are GitHub's defaults, so no <code>config.yml</code> is needed. It is left out
                of the zip download.
              </Text>
            </Alert>
          )}
        </Stack>
      </Card>

      <Stack gap="sm">
        <Group gap="xs">
          <IconLink size={18} />
          <Text fw={600}>Contact links</Text>
          <Text size="sm" c="dimmed">
            ({links.length})
          </Text>
        </Group>
        <Text size="sm" c="dimmed">
          Point people to places outside the issue tracker, e.g. discussions, a forum or security
          reporting.
        </Text>

        {links.map((link, index) => (
          <Card
            key={link.uid}
            id={`element-${link.uid}`}
            withBorder
            padding="sm"
            style={{
              borderColor: linkHasError(link.uid) ? 'var(--mantine-color-red-6)' : undefined,
            }}
          >
            <Group wrap="nowrap" align="flex-start" gap="sm">
              <Stack gap="xs" style={{ flex: 1, minWidth: 0 }}>
                <SimpleGrid cols={{ base: 1, sm: 2 }}>
                  <TextInput
                    label="Name"
                    placeholder="Community support"
                    required
                    value={link.name}
                    onChange={(e) => updateLink(link.uid, { name: e.currentTarget.value })}
                  />
                  <TextInput
                    label="URL"
                    placeholder="https://github.com/orgs/octo-org/discussions"
                    required
                    type="url"
                    value={link.url}
                    onChange={(e) => updateLink(link.uid, { url: e.currentTarget.value })}
                  />
                </SimpleGrid>
                <TextInput
                  label="About"
                  placeholder="Please ask and answer questions here."
                  required
                  value={link.about}
                  onChange={(e) => updateLink(link.uid, { about: e.currentTarget.value })}
                />
              </Stack>
              <Stack gap={2} pt={24}>
                <Tooltip label="Move up">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label="Move up"
                    disabled={index === 0}
                    onClick={() => move(index, index - 1)}
                  >
                    <IconArrowUp size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Move down">
                  <ActionIcon
                    variant="subtle"
                    color="gray"
                    aria-label="Move down"
                    disabled={index === links.length - 1}
                    onClick={() => move(index, index + 1)}
                  >
                    <IconArrowDown size={16} />
                  </ActionIcon>
                </Tooltip>
                <Tooltip label="Remove">
                  <ActionIcon
                    variant="subtle"
                    color="red"
                    aria-label="Remove contact link"
                    onClick={() => setLinks(links.filter((l) => l.uid !== link.uid))}
                  >
                    <IconTrash size={16} />
                  </ActionIcon>
                </Tooltip>
              </Stack>
            </Group>
          </Card>
        ))}

        <Button
          variant="light"
          leftSection={<IconPlus size={18} />}
          onClick={() => setLinks([...links, createContactLink()])}
          fullWidth
          style={{
            borderStyle: 'dashed',
            borderWidth: 1,
            borderColor: 'var(--mantine-primary-color-light-color)',
          }}
        >
          Add contact link
        </Button>
      </Stack>
    </Stack>
  );
}
