import { CodeHighlight } from '@mantine/code-highlight';
import {
  ActionIcon,
  Box,
  Code,
  CopyButton,
  Divider,
  Group,
  ScrollArea,
  Stack,
  Tabs,
  Text,
  Tooltip,
} from '@mantine/core';
import { IconCheck, IconCode, IconCopy, IconDownload, IconEye } from '@tabler/icons-react';
import { useMemo, useState } from 'react';
import { suggestFileName } from '../../lib/elements';
import { formToYaml } from '../../lib/serialize';
import { useIssueForm, useValidation } from '../../store/hooks';
import { FormPreview } from './FormPreview';
import { ValidationSummary } from './ValidationSummary';

function download(fileName: string, content: string) {
  const url = URL.createObjectURL(new Blob([content], { type: 'text/yaml' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

/** Right side of the split view: generated YAML and preview. */
export function OutputPanel() {
  const form = useIssueForm();
  const issues = useValidation();
  const yaml = useMemo(() => formToYaml(form), [form]);
  const fileName = suggestFileName(form.settings.name);
  const [tab, setTab] = useState<string | null>('yaml');

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
            <Tooltip label={`Download ${fileName}`}>
              <ActionIcon
                variant="subtle"
                color="gray"
                onClick={() => download(fileName, yaml)}
                aria-label="Download YAML"
              >
                <IconDownload size={16} />
              </ActionIcon>
            </Tooltip>
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
                Save as <Code fz="xs">.github/ISSUE_TEMPLATE/{fileName}</Code>
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
          ) : (
            <FormPreview />
          )}
        </ScrollArea>
      </Box>
    </Stack>
  );
}
