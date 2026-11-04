import {
  ActionIcon,
  Alert,
  Autocomplete,
  Button,
  Checkbox,
  Group,
  NumberInput,
  Select,
  Stack,
  Switch,
  Tabs,
  TagsInput,
  Text,
  Textarea,
  TextInput,
  Tooltip,
} from '@mantine/core';
import { IconArrowDown, IconArrowUp, IconInfoCircle, IconPlus, IconX } from '@tabler/icons-react';
import { useLayoutEffect, useRef, type ReactNode } from 'react';
import { slugifyId } from '../../lib/elements';
import type {
  CheckboxesElement,
  DropdownElement,
  FieldElement,
  FormElement,
  InputElement,
  MarkdownElement,
  TextareaElement,
  UploadElement,
} from '../../lib/types';
import { UPLOAD_EXTENSIONS } from '../../lib/validate';
import { Markdown } from '../Markdown';
import { MONO_INPUT } from '../inputStyles';

export interface StepProps<T extends FormElement> {
  element: T;
  onChange: (element: T) => void;
  errors: Record<string, string>;
}

function Hint({ children }: { children: ReactNode }) {
  return (
    <Alert variant="light" color="blue" icon={<IconInfoCircle size={18} />} p="xs">
      <Text size="xs">{children}</Text>
    </Alert>
  );
}

// ---------------------------------------------------------------------------------------------

export function MarkdownStep({ element, onChange, errors }: StepProps<MarkdownElement>) {
  return (
    <Tabs defaultValue="write" keepMounted={false}>
      <Tabs.List>
        <Tabs.Tab value="write">Write</Tabs.Tab>
        <Tabs.Tab value="preview">Preview</Tabs.Tab>
      </Tabs.List>
      <Tabs.Panel value="write" pt="sm">
        <Textarea
          aria-label="Markdown"
          description="Shown in the form, e.g. instructions or links. Not part of the submitted issue."
          placeholder={
            'Thanks for taking the time to fill out this form!\n\n**Please** search existing issues first.'
          }
          autosize
          minRows={6}
          maxRows={16}
          classNames={MONO_INPUT}
          value={element.value}
          error={errors.value}
          onChange={(e) => onChange({ ...element, value: e.currentTarget.value })}
          data-autofocus
        />
      </Tabs.Panel>
      <Tabs.Panel value="preview" pt="sm" mih={150}>
        {element.value.trim() ? (
          <Markdown>{element.value}</Markdown>
        ) : (
          <Text c="dimmed" size="sm">
            Nothing to preview yet.
          </Text>
        )}
      </Tabs.Panel>
    </Tabs>
  );
}

interface BasicsStepProps extends StepProps<FieldElement> {
  /** False until the user edits the id manually; until then the id follows the label. */
  idTouched: boolean;
  onIdTouched: () => void;
}

export function BasicsStep({ element, onChange, errors, idTouched, onIdTouched }: BasicsStepProps) {
  return (
    <Stack gap="sm">
      <TextInput
        label="Label"
        description="The question or title shown above the field."
        placeholder="What happened?"
        required
        value={element.label}
        error={errors.label}
        onChange={(e) => {
          const label = e.currentTarget.value;
          onChange({ ...element, label, id: idTouched ? element.id : slugifyId(label) });
        }}
        data-autofocus
      />
      <TextInput
        label="Id"
        description="Optional but recommended. Letters, numbers, - and _. Lets you prefill the field via URL (?id=value)."
        placeholder="what-happened"
        classNames={MONO_INPUT}
        value={element.id}
        error={errors.id}
        onChange={(e) => {
          onIdTouched();
          onChange({ ...element, id: e.currentTarget.value });
        }}
      />
      <Textarea
        label="Description"
        description="Extra help text shown below the label. Markdown is supported."
        placeholder="Also tell us what you expected to happen."
        autosize
        minRows={2}
        maxRows={6}
        value={element.description}
        onChange={(e) => onChange({ ...element, description: e.currentTarget.value })}
      />
    </Stack>
  );
}

/** Common Linguist language names for the textarea `render` attribute. */
const RENDER_LANGUAGES = [
  'shell', 'bash', 'console', 'powershell', 'text', 'log', 'json', 'yaml', 'xml', 'markdown',
  'javascript', 'typescript', 'python', 'java', 'kotlin', 'csharp', 'cpp', 'c', 'go', 'rust',
  'ruby', 'php', 'swift', 'sql', 'html', 'css', 'dockerfile', 'toml', 'ini', 'diff',
]; // prettier-ignore

export function ContentStep({ element, onChange }: StepProps<InputElement | TextareaElement>) {
  const isTextarea = element.type === 'textarea';
  const Field = isTextarea ? Textarea : TextInput;
  const multiline = isTextarea ? { autosize: true, minRows: 2, maxRows: 8 } : {};

  return (
    <Stack gap="sm">
      <Field
        label="Placeholder"
        description="Grey hint text shown while the field is empty. Not submitted."
        placeholder="e.g. 1.2.3"
        {...multiline}
        value={element.placeholder}
        onChange={(e) => onChange({ ...element, placeholder: e.currentTarget.value })}
      />
      <Field
        label="Default value"
        description="Text the field is pre-filled with. Users can edit it."
        {...multiline}
        value={element.value}
        onChange={(e) => onChange({ ...element, value: e.currentTarget.value })}
      />
      {element.type === 'textarea' && (
        <>
          <Autocomplete
            label="Render as code"
            description="Language name from GitHub Linguist. The answer is then shown as a code block."
            placeholder="e.g. shell"
            data={RENDER_LANGUAGES}
            value={element.render}
            onChange={(render) => onChange({ ...element, render })}
            clearable
          />
          {element.render && (
            <Hint>
              With "render as code", users can no longer attach files or use Markdown in this field.
            </Hint>
          )}
        </>
      )}
    </Stack>
  );
}

/**
 * Editable list of text rows with move up / move down / remove buttons.
 * Enter jumps to the next row, or adds a new row at the end.
 */
function OptionRows<T>({
  items,
  onChange,
  createItem,
  getText,
  setText,
  rowLabel,
  placeholder,
  renderExtra,
  addLabel,
}: {
  items: T[];
  onChange: (items: T[]) => void;
  createItem: () => T;
  getText: (item: T) => string;
  setText: (item: T, text: string) => T;
  rowLabel: (index: number) => string;
  placeholder: (index: number) => string;
  /** Extra controls rendered next to the text input, e.g. a "Required" checkbox. */
  renderExtra?: (item: T, update: (item: T) => void) => ReactNode;
  addLabel: string;
}) {
  const container = useRef<HTMLDivElement>(null);
  // Row that should get focus once it has been rendered.
  const pendingFocus = useRef<number | null>(null);

  const rowInputs = () => [
    ...(container.current?.querySelectorAll<HTMLInputElement>('[data-row-input]') ?? []),
  ];

  // Runs synchronously after the new row is in the DOM, before the next keystroke is handled.
  useLayoutEffect(() => {
    if (pendingFocus.current === null) return;
    rowInputs()[pendingFocus.current]?.focus();
    pendingFocus.current = null;
  }, [items.length]);

  const move = (from: number, to: number) => {
    const next = [...items];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const add = () => {
    pendingFocus.current = items.length;
    onChange([...items, createItem()]);
  };

  const onRowKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter' || event.nativeEvent.isComposing) return;
    event.preventDefault();
    const inputs = rowInputs();
    const index = inputs.indexOf(event.currentTarget);
    if (index === inputs.length - 1) add();
    else inputs[index + 1]?.focus();
  };
  const update = (index: number, updated: T) =>
    onChange(items.map((existing, i) => (i === index ? updated : existing)));

  return (
    <Stack gap={6} ref={container}>
      {items.map((item, index) => (
        <Group key={index} gap={4} wrap="nowrap" align="center">
          <TextInput
            data-row-input
            style={{ flex: 1, minWidth: 0 }}
            aria-label={rowLabel(index)}
            placeholder={placeholder(index)}
            value={getText(item)}
            onChange={(e) => update(index, setText(item, e.currentTarget.value))}
            onKeyDown={onRowKeyDown}
          />
          {renderExtra?.(item, (updated) => update(index, updated))}
          <Tooltip label="Move up">
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Move up"
              disabled={index === 0}
              onClick={() => move(index, index - 1)}
            >
              <IconArrowUp size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Move down">
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Move down"
              disabled={index === items.length - 1}
              onClick={() => move(index, index + 1)}
            >
              <IconArrowDown size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Remove">
            <ActionIcon
              variant="subtle"
              color="red"
              aria-label="Remove"
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              <IconX size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      ))}
      <Button
        variant="light"
        size="xs"
        leftSection={<IconPlus size={14} />}
        onClick={add}
        w="fit-content"
      >
        {addLabel}
      </Button>
    </Stack>
  );
}

export function DropdownOptionsStep({ element, onChange, errors }: StepProps<DropdownElement>) {
  const setOptions = (options: string[]) => {
    // Keep the default pointing to the same option text if possible.
    const previous = element.default !== null ? element.options[element.default] : undefined;
    const index = previous !== undefined ? options.indexOf(previous) : -1;
    onChange({ ...element, options, default: index >= 0 ? index : null });
  };
  const choices = element.options
    .map((option, index) => ({ value: String(index), label: option }))
    .filter((choice) => choice.label.trim());
  const hasNone = element.options.some((o) => ['none', 'n/a'].includes(o.trim().toLowerCase()));

  return (
    <Stack gap="sm">
      <div>
        <Text size="sm" fw={500} mb={4}>
          Options
        </Text>
        <OptionRows
          items={element.options}
          onChange={setOptions}
          createItem={() => ''}
          addLabel="Add option"
          getText={(option) => option}
          setText={(_, text) => text}
          rowLabel={(index) => `Option ${index + 1}`}
          placeholder={(index) => `Option ${index + 1}`}
        />
        {errors.options && (
          <Text size="xs" c="red" mt={4}>
            {errors.options}
          </Text>
        )}
      </div>
      <Switch
        label="Allow multiple selections"
        checked={element.multiple}
        onChange={(e) => onChange({ ...element, multiple: e.currentTarget.checked })}
      />
      <Select
        label="Default option"
        description="Preselected option. Leave empty for no default."
        placeholder="No default"
        data={choices}
        value={element.default !== null ? String(element.default) : null}
        onChange={(value) =>
          onChange({ ...element, default: value === null ? null : Number(value) })
        }
        clearable
        error={
          element.default !== null && hasNone
            ? 'With a default, options must not include "None" or "n/a".'
            : undefined
        }
      />
    </Stack>
  );
}

export function CheckboxOptionsStep({ element, onChange, errors }: StepProps<CheckboxesElement>) {
  const setOptions = (options: CheckboxesElement['options']) => onChange({ ...element, options });
  return (
    <Stack gap="sm">
      <Text size="sm" fw={500}>
        Checkboxes
      </Text>
      <OptionRows
        items={element.options}
        onChange={setOptions}
        createItem={() => ({ label: '', required: false })}
        addLabel="Add checkbox"
        getText={(option) => option.label}
        setText={(option, label) => ({ ...option, label })}
        rowLabel={(index) => `Checkbox ${index + 1}`}
        placeholder={() => 'I have searched the existing issues'}
        renderExtra={(option, update) => (
          <Checkbox
            label="Required"
            size="xs"
            mx={4}
            checked={option.required}
            onChange={(e) => update({ ...option, required: e.currentTarget.checked })}
          />
        )}
      />
      {errors.options && (
        <Text size="xs" c="red">
          {errors.options}
        </Text>
      )}
      <Hint>
        Labels support bold, italic and links in Markdown. "Required" means the box must be ticked
        to submit the issue (public repositories only).
      </Hint>
    </Stack>
  );
}

export function FilesStep({ element, onChange }: StepProps<UploadElement>) {
  const value = element.accept
    .split(',')
    .map((ext) => ext.trim())
    .filter(Boolean);
  return (
    <Stack gap="sm">
      <TagsInput
        label="Accepted file types"
        description="Leave empty to accept every file type GitHub supports."
        placeholder="Pick or type extensions, e.g. .png"
        data={UPLOAD_EXTENSIONS}
        value={value}
        onChange={(extensions) =>
          onChange({
            ...element,
            accept: extensions
              .map((ext) => ext.trim().toLowerCase())
              .map((ext) => (ext.startsWith('.') ? ext : `.${ext}`))
              .join(','),
          })
        }
        splitChars={[',', ' ']}
        acceptValueOnBlur
        clearable
      />
      <Hint>Size limits: images 10 MB, videos 100 MB, everything else 25 MB.</Hint>
    </Stack>
  );
}

export function ValidationStep({ element, onChange }: StepProps<FieldElement>) {
  return (
    <Stack gap="md">
      <Switch
        label="Required"
        description={
          element.type === 'checkboxes'
            ? 'At least one checkbox must be ticked. Use "Required" on single checkboxes in the previous step to require specific ones.'
            : 'The issue cannot be submitted until this field is filled in.'
        }
        checked={element.required}
        onChange={(e) => onChange({ ...element, required: e.currentTarget.checked })}
      />
      {(element.type === 'input' || element.type === 'textarea') && (
        <NumberInput
          label="Minimum length"
          description="Minimum number of characters. Leave empty for no limit."
          placeholder="No minimum"
          min={0}
          allowDecimal={false}
          allowNegative={false}
          value={element.minLength ?? ''}
          onChange={(value) =>
            onChange({ ...element, minLength: typeof value === 'number' ? value : null })
          }
          w={220}
        />
      )}
      <Hint>Validations are only enforced in public repositories.</Hint>
    </Stack>
  );
}
