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
import { ImportError, parseImport, type ImportResult } from '../lib/parse';
import { CONFIG_TAB, useWorkspaceStore } from '../store/workspaceStore';
import { MONO_INPUT } from './inputStyles';

interface ImportModalProps {
  opened: boolean;
  onClose: () => void;
}

interface Source {
  /** File name, or `undefined` for pasted text. */
  name?: string;
  text: string;
}

/**
 * Imports issue forms and `config.yml`, pasted or uploaded (several files at once).
 * Forms are added as new templates; a config.yml replaces the current template chooser settings.
 */
export function ImportModal({ opened, onClose }: ImportModalProps) {
  const [pasted, setPasted] = useState('');
  const [errors, setErrors] = useState<string[]>([]);

  const close = () => {
    setPasted('');
    setErrors([]);
    onClose();
  };

  const importSources = (sources: Source[]) => {
    const { addTemplate, updateConfig, setActive } = useWorkspaceStore.getState();
    const results: { source: Source; result: ImportResult }[] = [];
    const failed: string[] = [];

    for (const source of sources) {
      try {
        results.push({ source, result: parseImport(source.text) });
      } catch (e) {
        const message = e instanceof ImportError ? e.message : String(e);
        failed.push(source.name ? `${source.name}: ${message}` : message);
      }
    }

    const warnings: string[] = [];
    let forms = 0;
    let configs = 0;
    for (const { source, result } of results) {
      const prefix = source.name ? `${source.name}: ` : '';
      warnings.push(...result.warnings.map((w) => prefix + w));
      if (result.kind === 'form') {
        addTemplate(result.form);
        forms++;
      } else {
        updateConfig(result.config);
        configs++;
      }
    }
    // Show config.yml if that was the only thing imported.
    if (forms === 0 && configs > 0) setActive(CONFIG_TAB);

    if (failed.length > 0) {
      setErrors(failed);
      if (results.length === 0) return;
    } else {
      close();
    }

    const parts = [
      forms > 0 && `${forms} template${forms === 1 ? '' : 's'}`,
      configs > 0 && 'config.yml',
    ].filter(Boolean);
    notifications.show({
      title: `Imported ${parts.join(' and ')}`,
      color: warnings.length ? 'yellow' : 'green',
      autoClose: warnings.length ? 10000 : 4000,
      message: warnings.length ? (
        <List size="xs">
          {warnings.map((warning) => (
            <List.Item key={warning}>{warning}</List.Item>
          ))}
        </List>
      ) : (
        'You can find imported templates in the tabs above the editor.'
      ),
    });
  };

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    setErrors([]);
    importSources(
      await Promise.all(files.map(async (file) => ({ name: file.name, text: await file.text() }))),
    );
  };

  return (
    <Modal opened={opened} onClose={close} title="Import" size="lg">
      <Stack>
        <Text size="sm" c="dimmed">
          Paste an issue form or <code>config.yml</code>, or upload one or more files from{' '}
          <code>.github/ISSUE_TEMPLATE/</code>. Issue forms are added as new templates.
        </Text>
        <Textarea
          aria-label="YAML to import"
          placeholder={'name: Bug report\ndescription: ...\nbody:\n  - type: input\n    ...'}
          value={pasted}
          onChange={(event) => {
            setPasted(event.currentTarget.value);
            setErrors([]);
          }}
          autosize
          minRows={10}
          maxRows={20}
          classNames={MONO_INPUT}
          data-autofocus
        />
        {errors.length > 0 && (
          <Alert color="red" icon={<IconAlertTriangle size={18} />} title="Could not import">
            <List size="sm">
              {errors.map((error) => (
                <List.Item key={error}>{error}</List.Item>
              ))}
            </List>
          </Alert>
        )}
        <Group justify="space-between">
          <FileButton onChange={uploadFiles} accept=".yml,.yaml,text/yaml" multiple>
            {(props) => (
              <Button {...props} variant="default" leftSection={<IconUpload size={16} />}>
                Upload files
              </Button>
            )}
          </FileButton>
          <Group gap="xs">
            <Button variant="default" onClick={close}>
              Cancel
            </Button>
            <Button onClick={() => importSources([{ text: pasted }])} disabled={!pasted.trim()}>
              Import
            </Button>
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
