import { ActionIcon, Box, Group, Menu, ScrollArea, Tabs, Text, Tooltip } from '@mantine/core';
import { modals } from '@mantine/modals';
import {
  IconCopy,
  IconDots,
  IconFileText,
  IconPlus,
  IconSettings,
  IconTrash,
} from '@tabler/icons-react';
import { useEffect, useMemo, useRef } from 'react';
import { isTemplateEmpty } from '../../lib/workspace';
import { useWorkspaceValidation } from '../../store/hooks';
import { CONFIG_TAB, useWorkspaceStore } from '../../store/workspaceStore';
import { NewTemplateMenu } from '../NewTemplateMenu';

function ErrorDot() {
  return (
    <Box
      component="span"
      w={8}
      h={8}
      bg="red.6"
      style={{ borderRadius: '50%', display: 'inline-block' }}
      aria-label="has errors"
    />
  );
}

/** Switches between the templates of the workspace and config.yml. */
export function TemplateTabs() {
  const templates = useWorkspaceStore((s) => s.templates);
  const activeId = useWorkspaceStore((s) => s.activeId);
  const { setActive, duplicateTemplate, removeTemplate } = useWorkspaceStore.getState();
  const issues = useWorkspaceValidation();

  const scopesWithErrors = useMemo(
    () => new Set(issues.filter((i) => i.level === 'error').map((i) => i.scope)),
    [issues],
  );
  const active = templates.find((t) => t.uid === activeId);
  const viewport = useRef<HTMLDivElement>(null);

  // Keep the open tab visible when tabs overflow (e.g. on phones or after adding a template).
  useEffect(() => {
    viewport.current
      ?.querySelector('[data-active]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [activeId]);

  const remove = () => {
    if (!active) return;
    if (isTemplateEmpty(active)) {
      removeTemplate(active.uid);
      return;
    }
    modals.openConfirmModal({
      title: `Delete "${active.settings.name || 'Untitled'}"?`,
      children: <Text size="sm">The template and all its elements are removed.</Text>,
      labels: { confirm: 'Delete', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: () => removeTemplate(active.uid),
    });
  };

  return (
    <Group
      gap={4}
      wrap="nowrap"
      px="md"
      pt="xs"
      style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
    >
      <ScrollArea
        type="hover"
        scrollbarSize={4}
        style={{ flex: 1, minWidth: 0 }}
        viewportRef={viewport}
      >
        <Tabs
          value={activeId}
          onChange={(value) => value && setActive(value)}
          variant="outline"
          activateTabWithKeyboard
        >
          <Tabs.List style={{ flexWrap: 'nowrap', borderBottom: 0 }}>
            {templates.map((template) => (
              <Tabs.Tab
                key={template.uid}
                value={template.uid}
                leftSection={<IconFileText size={14} />}
                rightSection={scopesWithErrors.has(template.uid) ? <ErrorDot /> : undefined}
                style={{ whiteSpace: 'nowrap' }}
              >
                {template.settings.name.trim() || 'Untitled'}
              </Tabs.Tab>
            ))}
            <Tabs.Tab
              value={CONFIG_TAB}
              leftSection={<IconSettings size={14} />}
              rightSection={scopesWithErrors.has(CONFIG_TAB) ? <ErrorDot /> : undefined}
              ff="monospace"
            >
              config.yml
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>
      </ScrollArea>

      <NewTemplateMenu>
        <Tooltip label="New template">
          <ActionIcon variant="subtle" aria-label="New template">
            <IconPlus size={18} />
          </ActionIcon>
        </Tooltip>
      </NewTemplateMenu>

      <Menu position="bottom-end">
        <Menu.Target>
          <ActionIcon
            variant="subtle"
            color="gray"
            aria-label="Template actions"
            disabled={!active}
          >
            <IconDots size={18} />
          </ActionIcon>
        </Menu.Target>
        <Menu.Dropdown>
          <Menu.Item
            leftSection={<IconCopy size={14} />}
            onClick={() => active && duplicateTemplate(active.uid)}
          >
            Duplicate template
          </Menu.Item>
          <Menu.Item color="red" leftSection={<IconTrash size={14} />} onClick={remove}>
            Delete template
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>
    </Group>
  );
}
