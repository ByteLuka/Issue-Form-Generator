import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  ActionIcon,
  Badge,
  Card,
  Code,
  Group,
  Stack,
  Text,
  ThemeIcon,
  Tooltip,
} from '@mantine/core';
import {
  IconAlertCircle,
  IconCopy,
  IconGripVertical,
  IconPencil,
  IconRowInsertBottom,
  IconTrash,
} from '@tabler/icons-react';
import { ELEMENT_INFO } from '../../lib/elements';
import type { FormElement } from '../../lib/types';
import type { ValidationIssue } from '../../lib/validate';
import { ELEMENT_COLORS, ELEMENT_ICONS } from '../elementIcons';

interface ElementCardProps {
  element: FormElement;
  issues: ValidationIssue[];
  onEdit: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onInsertBelow: () => void;
}

function summary(element: FormElement): string {
  switch (element.type) {
    case 'markdown':
      return element.value;
    case 'dropdown':
      return element.options.filter(Boolean).join(' · ');
    case 'checkboxes':
      return element.options
        .map((o) => o.label)
        .filter(Boolean)
        .join(' · ');
    case 'upload':
      return element.accept ? `Accepts ${element.accept}` : 'Accepts all supported file types';
    default:
      return element.description;
  }
}

export function ElementCard({
  element,
  issues,
  onEdit,
  onDuplicate,
  onDelete,
  onInsertBelow,
}: ElementCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    setActivatorNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: element.uid });

  const Icon = ELEMENT_ICONS[element.type];
  const errors = issues.filter((i) => i.level === 'error');
  const warnings = issues.filter((i) => i.level === 'warning');
  const title = element.type === 'markdown' ? 'Markdown text' : element.label || 'Untitled field';

  return (
    <Card
      ref={setNodeRef}
      id={`element-${element.uid}`}
      withBorder
      padding="sm"
      shadow={isDragging ? 'md' : undefined}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
        zIndex: isDragging ? 10 : undefined,
        position: 'relative',
        borderColor: errors.length ? 'var(--mantine-color-red-6)' : undefined,
      }}
    >
      <Group wrap="nowrap" align="flex-start" gap="sm">
        <ActionIcon
          ref={setActivatorNodeRef}
          variant="subtle"
          color="gray"
          aria-label="Drag to reorder"
          style={{ cursor: 'grab', touchAction: 'none' }}
          {...attributes}
          {...listeners}
        >
          <IconGripVertical size={16} />
        </ActionIcon>

        <ThemeIcon variant="light" color={ELEMENT_COLORS[element.type]} size="md">
          <Icon size={16} />
        </ThemeIcon>

        <Stack gap={2} style={{ flex: 1, minWidth: 0, cursor: 'pointer' }} onClick={onEdit}>
          <Group gap={6} wrap="wrap">
            <Text fw={600} size="sm" truncate>
              {title}
            </Text>
            <Badge size="xs" variant="light" color={ELEMENT_COLORS[element.type]}>
              {ELEMENT_INFO[element.type].label}
            </Badge>
            {element.type !== 'markdown' && element.required && (
              <Badge size="xs" variant="outline" color="red">
                Required
              </Badge>
            )}
            {element.type === 'dropdown' && element.multiple && (
              <Badge size="xs" variant="outline">
                Multiple
              </Badge>
            )}
            {element.type === 'textarea' && element.render && (
              <Badge size="xs" variant="outline">
                Code: {element.render}
              </Badge>
            )}
          </Group>
          {element.type !== 'markdown' && element.id && (
            <Code fz="xs" w="fit-content">
              id: {element.id}
            </Code>
          )}
          {summary(element) && (
            <Text size="xs" c="dimmed" lineClamp={2}>
              {summary(element)}
            </Text>
          )}
        </Stack>

        <Group gap={2} wrap="nowrap">
          {(errors.length > 0 || warnings.length > 0) && (
            <Tooltip
              multiline
              w={280}
              label={[...errors, ...warnings].map((i) => i.message).join('\n')}
              style={{ whiteSpace: 'pre-line' }}
            >
              <ThemeIcon variant="transparent" color={errors.length ? 'red' : 'yellow'} size="md">
                <IconAlertCircle size={18} />
              </ThemeIcon>
            </Tooltip>
          )}
          <Tooltip label="Edit">
            <ActionIcon variant="subtle" color="gray" aria-label="Edit" onClick={onEdit}>
              <IconPencil size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Add element below">
            <ActionIcon
              variant="subtle"
              color="gray"
              aria-label="Add element below"
              onClick={onInsertBelow}
            >
              <IconRowInsertBottom size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Duplicate">
            <ActionIcon variant="subtle" color="gray" aria-label="Duplicate" onClick={onDuplicate}>
              <IconCopy size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Delete">
            <ActionIcon variant="subtle" color="red" aria-label="Delete" onClick={onDelete}>
              <IconTrash size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Group>
    </Card>
  );
}
