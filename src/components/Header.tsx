import { ActionIcon, Button, Group, Menu, Text, ThemeIcon, Title, Tooltip } from '@mantine/core';
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
import { createEmptyForm } from '../lib/elements';
import { STARTER_TEMPLATES, type StarterTemplate } from '../lib/templates';
import { useFormStore } from '../store/formStore';
import { useIsFormEmpty } from '../store/hooks';
import { ColorSchemeToggle } from './ColorSchemeToggle';
import { ImportModal } from './ImportModal';

/** Asks before throwing away the current form. Runs `action` directly if there is nothing to lose. */
function confirmReplace(isEmpty: boolean, title: string, action: () => void) {
  if (isEmpty) {
    action();
    return;
  }
  modals.openConfirmModal({
    title,
    children: <Text size="sm">This replaces your current form. It cannot be undone.</Text>,
    labels: { confirm: 'Replace', cancel: 'Cancel' },
    confirmProps: { color: 'red' },
    onConfirm: action,
  });
}

export function Header() {
  const loadForm = useFormStore((state) => state.loadForm);
  const isEmpty = useIsFormEmpty();
  const [importOpened, importHandlers] = useDisclosure(false);
  const isSmall = useMediaQuery('(max-width: 48em)');

  const applyTemplate = (template: StarterTemplate) =>
    confirmReplace(isEmpty, `Start from "${template.label}"?`, () => loadForm(template.create()));

  const reset = () => confirmReplace(false, 'Clear the form?', () => loadForm(createEmptyForm()));

  return (
    <Group h="100%" px={{ base: 'xs', sm: 'md' }} justify="space-between" wrap="nowrap" gap="xs">
      <Group gap="xs" wrap="nowrap">
        <ThemeIcon variant="light" size="lg">
          <IconClipboardList size={20} />
        </ThemeIcon>
        <Title order={1} size="h4" visibleFrom="xs">
          Issue Form Generator
        </Title>
      </Group>

      <Group gap="xs" wrap="nowrap">
        <Menu position="bottom-end" width={280}>
          <Menu.Target>
            {isSmall ? (
              <ActionIcon variant="default" size="md" aria-label="Templates">
                <IconTemplate size={16} />
              </ActionIcon>
            ) : (
              <Button
                variant="default"
                size="xs"
                leftSection={<IconTemplate size={16} />}
                rightSection={<IconChevronDown size={14} />}
              >
                Templates
              </Button>
            )}
          </Menu.Target>
          <Menu.Dropdown>
            <Menu.Label>Start from a template</Menu.Label>
            {STARTER_TEMPLATES.map((template) => (
              <Menu.Item key={template.key} onClick={() => applyTemplate(template)}>
                <Text size="sm">{template.label}</Text>
                <Text size="xs" c="dimmed">
                  {template.description}
                </Text>
              </Menu.Item>
            ))}
          </Menu.Dropdown>
        </Menu>

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

        <Tooltip label="Clear form">
          <ActionIcon variant="default" size="md" aria-label="Clear form" onClick={reset}>
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

      <ImportModal
        opened={importOpened}
        onClose={importHandlers.close}
        onImport={(form) => confirmReplace(isEmpty, 'Import this form?', () => loadForm(form))}
      />
    </Group>
  );
}
