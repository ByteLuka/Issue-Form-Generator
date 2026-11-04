import { Anchor, Badge, Button, Container, Group, Paper, Stack, Text, Title } from '@mantine/core';
import { IconExternalLink } from '@tabler/icons-react';
import { useMemo } from 'react';
import { templateFileNames } from '../../lib/workspace';
import { useWorkspace } from '../../store/hooks';

/** Approximation of GitHub's "new issue" page that lists all templates and contact links. */
export function ChooserPreview() {
  const { templates, config } = useWorkspace();

  // GitHub lists templates alphanumerically by file name.
  const sorted = useMemo(() => {
    const names = templateFileNames(templates);
    return templates
      .map((template, index) => ({ template, fileName: names[index] }))
      .sort((a, b) => (a.fileName < b.fileName ? -1 : a.fileName > b.fileName ? 1 : 0));
  }, [templates]);

  return (
    <Container size="sm" py="md" px="md">
      <Stack gap="md">
        <Title order={2} size="h4">
          Create new issue
        </Title>

        <Paper withBorder>
          {sorted.map(({ template, fileName }, index) => (
            <Group
              key={template.uid}
              justify="space-between"
              wrap="nowrap"
              p="md"
              style={{
                borderTop: index > 0 ? '1px solid var(--mantine-color-default-border)' : undefined,
              }}
            >
              <Stack gap={2} style={{ minWidth: 0 }}>
                <Text fw={600} size="sm">
                  {template.settings.name || <i>Unnamed form</i>}
                </Text>
                <Text size="sm" c="dimmed">
                  {template.settings.description || <i>No description</i>}
                </Text>
                <Text size="xs" c="dimmed" ff="monospace">
                  {fileName}
                </Text>
              </Stack>
              <Button size="xs" variant="filled" color="green" tabIndex={-1}>
                Get started
              </Button>
            </Group>
          ))}

          {config.contactLinks.map((link) => (
            <Group
              key={link.uid}
              justify="space-between"
              wrap="nowrap"
              p="md"
              style={{ borderTop: '1px solid var(--mantine-color-default-border)' }}
            >
              <Stack gap={2} style={{ minWidth: 0 }}>
                <Text fw={600} size="sm">
                  {link.name || <i>Unnamed link</i>}
                </Text>
                <Text size="sm" c="dimmed">
                  {link.about || <i>No description</i>}
                </Text>
              </Stack>
              <Button
                size="xs"
                variant="default"
                rightSection={<IconExternalLink size={14} />}
                component="a"
                href={link.url || undefined}
                target="_blank"
                rel="noreferrer"
              >
                Open
              </Button>
            </Group>
          ))}
        </Paper>

        {config.blankIssuesEnabled ? (
          <Text size="sm" c="dimmed">
            Don't see your issue here? <Anchor component="span">Open a blank issue.</Anchor>
          </Text>
        ) : (
          <Group gap="xs">
            <Text size="sm" c="dimmed">
              Blank issues are disabled.
            </Text>
            <Badge size="sm" variant="outline" color="gray">
              Maintainers only
            </Badge>
          </Group>
        )}
      </Stack>
    </Container>
  );
}
