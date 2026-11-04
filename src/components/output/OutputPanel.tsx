import { CodeHighlight } from '@mantine/code-highlight';
import {
  ActionIcon,
  Box,
  Code,
  CopyButton,
  Divider,
  Group,
  Menu,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  Tooltip,
} from '@mantine/core';
import {
  IconCheck,
  IconCode,
  IconCopy,
  IconDownload,
  IconEye,
  IconFileZip,
} from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { notifications } from '@mantine/notifications';
import { configToYaml, formToYaml } from '../../lib/serialize';
import {
  buildZip,
  CONFIG_FILE_NAME,
  isDefaultConfig,
  TEMPLATE_DIR,
  templateFileNames,
  workspaceFiles,
} from '../../lib/workspace';
import { useActiveTemplate, useValidation, useWorkspace } from '../../store/hooks';
import { ChooserPreview } from './ChooserPreview';
import { FormPreview } from './FormPreview';
import { ValidationSummary } from './ValidationSummary';

function download(fileName: string, content: Blob) {
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** Right side of the split view: generated YAML and preview. */
export function OutputPanel() {
  const workspace = useWorkspace();
  const template = useActiveTemplate();
  const issues = useValidation();
  const [tab, setTab] = useState<string | null>('yaml');

  // Either the open template or config.yml.
  const yaml = useMemo(
    () => (template ? formToYaml(template) : configToYaml(workspace.config)),
    [template, workspace.config],
  );
  const fileName = template
    ? templateFileNames(workspace.templates)[workspace.templates.indexOf(template)]
    : CONFIG_FILE_NAME;
  const fileCount = workspaceFiles(workspace).length;

  const downloadZip = async () => {
    try {
      download('issue-templates.zip', await buildZip(workspace));
    } catch (error) {
      notifications.show({ color: 'red', title: 'Download failed', message: String(error) });
    }
  };

  return (
    <Stack h="100%" gap={0}>
      <Tabs value={tab} onChange={setTab}>
        <Group
          justify="space-between"
          px="sm"
          wrap="nowrap"
          style={{ borderBottom: '1px solid var(--mantine-color-default-border)' }}
        >
          <Tabs.List style={{ border: 0 }}>
            <Tabs.Tab value="yaml" leftSection={<IconCode size={16} />}>
              YAML
            </Tabs.Tab>
            <Tabs.Tab value="preview" leftSection={<IconEye size={16} />}>
              Preview
            </Tabs.Tab>
          </Tabs.List>
          <Group gap={4} wrap="nowrap">
            <CopyButton value={yaml}>
              {({ copied, copy }) => (
                <Tooltip label={copied ? 'Copied' : 'Copy YAML'}>
                  <ActionIcon
                    variant="subtle"
                    color={copied ? 'teal' : 'gray'}
                    onClick={copy}
                    aria-label="Copy YAML"
                  >
                    {copied ? <IconCheck size={16} /> : <IconCopy size={16} />}
                  </ActionIcon>
                </Tooltip>
              )}
            </CopyButton>
            <Menu position="bottom-end">
              <Menu.Target>
                <Tooltip label="Download">
                  <ActionIcon variant="subtle" color="gray" aria-label="Download">
                    <IconDownload size={16} />
                  </ActionIcon>
                </Tooltip>
              </Menu.Target>
              <Menu.Dropdown>
                <Menu.Item
                  leftSection={<IconDownload size={14} />}
                  onClick={() => download(fileName, new Blob([yaml], { type: 'text/yaml' }))}
                >
                  {fileName}
                </Menu.Item>
                <Menu.Item leftSection={<IconFileZip size={14} />} onClick={downloadZip}>
                  All files as .zip ({fileCount})
                </Menu.Item>
              </Menu.Dropdown>
            </Menu>
          </Group>
        </Group>
      </Tabs>

      <ValidationSummary issues={issues} />
      <Divider />

      <Box style={{ flex: 1, minHeight: 0 }}>
        <ScrollArea h="100%" type="auto">
          {tab === 'yaml' ? (
            <Stack gap={0}>
              <Text size="xs" c="dimmed" px="md" pt="sm">
                Save as{' '}
                <Code fz="xs">
                  {TEMPLATE_DIR}/{fileName}
                </Code>
                {!template && isDefaultConfig(workspace.config) && (
                  <> (optional: these are GitHub's defaults)</>
                )}
              </Text>
              <CodeHighlight
                code={yaml}
                language="yaml"
                withCopyButton={false}
                withLineNumbers
                background="transparent"
                withFirstLineIndentation
              />
            </Stack>
          ) : template ? (
            <FormPreview />
          ) : (
            <ChooserPreview />
          )}
        </ScrollArea>
      </Box>
    </Stack>
  );
}
