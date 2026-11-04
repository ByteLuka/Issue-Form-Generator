import {
  Alert,
  Button,
  FileButton,
  Group,
  List,
  Modal,
  Stack,
  Text,
  Textarea,
} from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconAlertTriangle, IconUpload } from '@tabler/icons-react';
import { useState } from 'react';
import { ImportError, yamlToForm } from '../lib/parse';
import type { IssueForm } from '../lib/types';

interface ImportModalProps {
  opened: boolean;
  onClose: () => void;
  onImport: (form: IssueForm) => void;
}

/** Paste or upload an existing issue form YAML to continue editing it. */
export function ImportModal({ opened, onClose, onImport }: ImportModalProps) {
  const [source, setSource] = useState('');
  const [error, setError] = useState<string | null>(null);

  const close = () => {
    setSource('');
    setError(null);
    onClose();
  };

  const loadFile = async (file: File | null) => {
    if (!file) return;
    setSource(await file.text());
    setError(null);
  };

  const submit = () => {
    try {
      const { form, warnings } = yamlToForm(source);
      onImport(form);
      close();
      notifications.show({
        title: 'Form imported',
        color: warnings.length ? 'yellow' : 'green',
        autoClose: warnings.length ? 10000 : 4000,
        message: warnings.length ? (
          <List size="xs">
            {warnings.map((warning) => (
              <List.Item key={warning}>{warning}</List.Item>
            ))}
          </List>
        ) : (
          `${form.elements.length} element(s) loaded.`
        ),
      });
    } catch (e) {
      setError(e instanceof ImportError ? e.message : String(e));
    }
  };

  return (
    <Modal opened={opened} onClose={close} title="Import issue form" size="lg">
      <Stack>
        <Text size="sm" c="dimmed">
          Paste the content of a file from <code>.github/ISSUE_TEMPLATE/</code> or upload it.
        </Text>
        <Textarea
          aria-label="Issue form YAML"
          placeholder={'name: Bug report\ndescription: ...\nbody:\n  - type: input\n    ...'}
          value={source}
          onChange={(event) => {
            setSource(event.currentTarget.value);
            setError(null);
          }}
          autosize
          minRows={10}
          maxRows={20}
          ff="monospace"
          data-autofocus
        />
        {error && (
          <Alert color="red" icon={<IconAlertTriangle size={18} />} title="Could not import">
            {error}
          </Alert>
        )}
        <Group justify="space-between">
          <FileButton onChange={loadFile} accept=".yml,.yaml,text/yaml">
            {(props) => (
              <Button {...props} variant="default" leftSection={<IconUpload size={16} />}>
                Upload file
              </Button>
            )}
          </FileButton>
          <Group gap="xs">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button onClick={submit} disabled={!source.trim()}>
              Import
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
