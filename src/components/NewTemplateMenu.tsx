import { Menu, Text } from '@mantine/core';
import type { ReactNode } from 'react';
import { STARTER_TEMPLATES } from '../lib/templates';
import { useWorkspaceStore } from '../store/workspaceStore';

/** Menu that adds a new template (blank or from a starter) to the workspace. */
export function NewTemplateMenu({ children }: { children: ReactNode }) {
  const addTemplate = useWorkspaceStore((state) => state.addTemplate);

  return (
    <Menu position="bottom-end" width={280}>
      <Menu.Target>{children}</Menu.Target>
      <Menu.Dropdown>
        <Menu.Label>New template</Menu.Label>
        {STARTER_TEMPLATES.map((starter) => (
          <Menu.Item key={starter.key} onClick={() => addTemplate(starter.create())}>
            <Text size="sm">{starter.label}</Text>
            <Text size="xs" c="dimmed">
              {starter.description}
            </Text>
          </Menu.Item>
        ))}
      </Menu.Dropdown>
    </Menu>
  );
}
