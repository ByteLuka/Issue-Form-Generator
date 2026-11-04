import { ActionIcon, Badge, Button, Group, Text, ThemeIcon, Title, Tooltip } from '@mantine/core';
import { useDisclosure, useMediaQuery } from '@mantine/hooks';
import { modals } from '@mantine/modals';
import {
  IconBrandGithub,
  IconChevronDown,
  IconClipboardList,
  IconFileImport,
  IconTemplate,
  IconTrash,
} from '@tabler/icons-react';
import { useIsWorkspaceEmpty } from '../store/hooks';
import { useWorkspaceStore } from '../store/workspaceStore';
import { ColorSchemeToggle } from './ColorSchemeToggle';
import { ImportModal } from './ImportModal';
import { NewTemplateMenu } from './NewTemplateMenu';

export function Header() {
  const resetWorkspace = useWorkspaceStore((state) => state.resetWorkspace);
  const isEmpty = useIsWorkspaceEmpty();
  const [importOpened, importHandlers] = useDisclosure(false);
  const isSmall = useMediaQuery('(max-width: 48em)');

  const reset = () => {
    if (isEmpty) return;
    modals.openConfirmModal({
      title: 'Clear the workspace?',
      children: (
        <Text size="sm">
          All templates and the config.yml settings are removed. This cannot be undone.
        </Text>
      ),
      labels: { confirm: 'Clear', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: resetWorkspace,
    });
  };

  return (
    <Group h="100%" px={{ base: 'xs', sm: 'md' }} justify="space-between" wrap="nowrap" gap="xs">
      <Group gap="xs" wrap="nowrap">
        <ThemeIcon variant="light" size="lg">
          <IconClipboardList size={20} />
        </ThemeIcon>
        <Title order={1} size="h4" visibleFrom="xs">
          Issue Form Generator
        </Title>
        <Tooltip label={__REPO_URL__ ? 'Release notes' : 'Version'}>
          <Badge
            variant="light"
            color="gray"
            size="sm"
            visibleFrom="sm"
            tt="none"
            {...(__REPO_URL__
              ? {
                  component: 'a' as const,
                  href: `${__REPO_URL__}/releases/tag/v${__APP_VERSION__}`,
                  target: '_blank',
                  rel: 'noreferrer',
                  style: { cursor: 'pointer' },
                }
              : {})}
          >
            v{__APP_VERSION__}
          </Badge>
        </Tooltip>
      </Group>

      <Group gap="xs" wrap="nowrap">
        <NewTemplateMenu>
          {isSmall ? (
            <ActionIcon variant="default" size="md" aria-label="New template">
              <IconTemplate size={16} />
            </ActionIcon>
          ) : (
            <Button
              variant="default"
              size="xs"
              leftSection={<IconTemplate size={16} />}
              rightSection={<IconChevronDown size={14} />}
            >
              New template
            </Button>
          )}
        </NewTemplateMenu>

        {isSmall ? (
          <Tooltip label="Import YAML">
            <ActionIcon
              variant="default"
              size="md"
              aria-label="Import YAML"
              onClick={importHandlers.open}
            >
              <IconFileImport size={16} />
            </ActionIcon>
          </Tooltip>
        ) : (
          <Button
            variant="default"
            size="xs"
            leftSection={<IconFileImport size={16} />}
            onClick={importHandlers.open}
          >
            Import
          </Button>
        )}

        <Tooltip label="Clear workspace">
          <ActionIcon
            variant="default"
            size="md"
            aria-label="Clear workspace"
            onClick={reset}
            disabled={isEmpty}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Tooltip>

        <ColorSchemeToggle />

        {__REPO_URL__ && (
          <Tooltip label="Source code on GitHub">
            <ActionIcon
              component="a"
              href={__REPO_URL__}
              target="_blank"
              rel="noreferrer"
              variant="default"
              size="md"
              aria-label="Source code on GitHub"
            >
              <IconBrandGithub size={16} />
            </ActionIcon>
          </Tooltip>
        )}
      </Group>

      <ImportModal opened={importOpened} onClose={importHandlers.close} />
    </Group>
  );
}
