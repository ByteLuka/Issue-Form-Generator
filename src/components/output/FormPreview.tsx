import {
  Badge,
  Box,
  Checkbox,
  Container,
  Divider,
  Group,
  MultiSelect,
  Paper,
  Select,
  Stack,
  Text,
  Textarea,
  TextInput,
  Title,
} from '@mantine/core';
import { IconPaperclip } from '@tabler/icons-react';
import type { ReactNode } from 'react';
import type { FieldElement, FormElement } from '../../lib/types';
import { useIssueForm } from '../../store/hooks';
import { Markdown } from '../Markdown';

function FieldLabel({ element }: { element: FieldElement }) {
  return (
    <Stack gap={2} mb={6}>
      <Text fw={600} size="sm">
        {element.label || <i>Untitled field</i>}
        {element.required && (
          <Text span c="red" ml={4}>
            *
          </Text>
        )}
      </Text>
      {element.description && (
        <Box c="dimmed">
          <Markdown size="xs">{element.description}</Markdown>
        </Box>
      )}
    </Stack>
  );
}

function PreviewElement({ element }: { element: FormElement }): ReactNode {
  // The key resets uncontrolled inputs when the default value changes in the editor.
  switch (element.type) {
    case 'markdown':
      return <Markdown size="sm">{element.value}</Markdown>;

    case 'input':
      return (
        <div>
          <FieldLabel element={element} />
          <TextInput
            key={element.value}
            aria-label={element.label}
            placeholder={element.placeholder}
            defaultValue={element.value}
          />
        </div>
      );

    case 'textarea':
      return (
        <div>
          <FieldLabel element={element} />
          <Textarea
            key={element.value}
            aria-label={element.label}
            placeholder={element.placeholder}
            defaultValue={element.value}
            autosize
            minRows={4}
            ff={element.render ? 'monospace' : undefined}
          />
          {!element.render && (
            <Group gap={4} mt={4} c="dimmed">
              <IconPaperclip size={14} />
              <Text size="xs">Paste, drop, or click to add files</Text>
            </Group>
          )}
        </div>
      );

    case 'dropdown': {
      const data = [...new Set(element.options.filter((o) => o.trim()))];
      const defaultOption = element.default !== null ? element.options[element.default] : undefined;
      const common = {
        'aria-label': element.label,
        data,
        placeholder: 'Selections:',
        comboboxProps: { withinPortal: true },
      };
      return (
        <div>
          <FieldLabel element={element} />
          {element.multiple ? (
            <MultiSelect
              key={`${defaultOption}-${data.join()}`}
              {...common}
              defaultValue={defaultOption ? [defaultOption] : []}
            />
          ) : (
            <Select
              key={`${defaultOption}-${data.join()}`}
              {...common}
              defaultValue={defaultOption ?? null}
            />
          )}
        </div>
      );
    }

    case 'checkboxes':
      return (
        <div>
          <FieldLabel element={element} />
          <Stack gap={6}>
            {element.options.map((option, index) => (
              <Checkbox
                key={index}
                size="sm"
                label={
                  <Group gap={4} wrap="nowrap" component="span">
                    <Markdown size="sm">{option.label || '…'}</Markdown>
                    {option.required && (
                      <Text span c="red">
                        *
                      </Text>
                    )}
                  </Group>
                }
              />
            ))}
          </Stack>
        </div>
      );

    case 'upload':
      return (
        <div>
          <FieldLabel element={element} />
          <Paper
            withBorder
            p="lg"
            style={{ borderStyle: 'dashed', textAlign: 'center' }}
            c="dimmed"
          >
            <Text size="sm">Drag & drop files here or click to browse</Text>
            <Text size="xs">
              {element.accept
                ? `Accepted: ${element.accept.split(',').join(', ')}`
                : 'All supported file types'}
            </Text>
          </Paper>
        </div>
      );
  }
}

/** Approximation of how GitHub renders the issue form. Inputs are interactive but not saved. */
export function FormPreview() {
  const { settings, elements } = useIssueForm();

  return (
    <Container size="sm" py="md" px="md">
      <Stack gap="md">
        <Paper withBorder p="md">
          <Text size="xs" c="dimmed" tt="uppercase" fw={600} mb={4}>
            Template chooser
          </Text>
          <Text fw={600}>{settings.name || <i>Unnamed form</i>}</Text>
          <Text size="sm" c="dimmed">
            {settings.description || <i>No description</i>}
          </Text>
        </Paper>

        <Paper withBorder p="md">
          <Stack gap="md">
            <Title order={2} size="h4">
              Create new issue
            </Title>
            {(settings.labels.length > 0 || settings.assignees.length > 0 || settings.type) && (
              <Group gap={6}>
                {settings.type && (
                  <Badge variant="filled" color="gray">
                    Type: {settings.type}
                  </Badge>
                )}
                {settings.labels.map((label) => (
                  <Badge key={label} variant="light">
                    {label}
                  </Badge>
                ))}
                {settings.assignees.map((assignee) => (
                  <Badge key={assignee} variant="outline" color="gray">
                    @{assignee}
                  </Badge>
                ))}
              </Group>
            )}
            <TextInput
              key={settings.title}
              label="Add a title"
              withAsterisk
              placeholder="Title"
              defaultValue={settings.title}
            />
            <Divider />
            {elements.length === 0 ? (
              <Text c="dimmed" size="sm">
                Add elements in the editor to see them here.
              </Text>
            ) : (
              elements.map((element) => <PreviewElement key={element.uid} element={element} />)
            )}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
