import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Button, Card, Group, Stack, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconLayoutList, IconPlus } from '@tabler/icons-react';
import { useState } from 'react';
import { createElement } from '../../lib/elements';
import type { ElementType, FormElement } from '../../lib/types';
import { useIssueForm, useValidation } from '../../store/hooks';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { ElementCard } from './ElementCard';
import { ElementDialog } from './ElementDialog';
import { TypePickerModal } from './TypePickerModal';

type DialogState =
  | { mode: 'pick'; index: number }
  | { mode: 'add'; element: FormElement; index: number }
  | { mode: 'edit'; element: FormElement }
  | null;

export function ElementList() {
  const { uid: templateUid, elements } = useIssueForm();
  const { addElement, updateElement, removeElement, duplicateElement, moveElement, setActive } =
    useWorkspaceStore.getState();
  const issues = useValidation();
  const [dialog, setDialog] = useState<DialogState>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const onDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const from = elements.findIndex((e) => e.uid === active.id);
    const to = elements.findIndex((e) => e.uid === over.id);
    if (from !== -1 && to !== -1) moveElement(from, to);
  };

  const remove = (element: FormElement, index: number) => {
    removeElement(element.uid);
    const id = `deleted-${element.uid}`;
    notifications.show({
      id,
      message: (
        <Group justify="space-between" wrap="nowrap">
          <Text size="sm">Element deleted.</Text>
          <Button
            size="compact-xs"
            variant="light"
            onClick={() => {
              // The user may have switched to another template in the meantime.
              setActive(templateUid);
              addElement(element, index);
              notifications.hide(id);
            }}
          >
            Undo
          </Button>
        </Group>
      ),
      autoClose: 6000,
    });
  };

  const pickType = (type: ElementType) => {
    if (dialog?.mode !== 'pick') return;
    setDialog({ mode: 'add', element: createElement(type), index: dialog.index });
  };

  const takenIds = (exceptUid: string) =>
    elements.flatMap((e) => (e.type !== 'markdown' && e.uid !== exceptUid && e.id ? [e.id] : []));

  return (
    <Stack gap="sm">
      <Group justify="space-between">
        <Group gap="xs">
          <IconLayoutList size={18} />
          <Text fw={600}>Form elements</Text>
          <Text size="sm" c="dimmed">
            ({elements.length})
          </Text>
        </Group>
      </Group>

      {elements.length === 0 && (
        <Card withBorder padding="xl" style={{ borderStyle: 'dashed' }}>
          <Stack align="center" gap={4}>
            <Text fw={500}>No elements yet</Text>
            <Text size="sm" c="dimmed" ta="center">
              Add inputs, dropdowns, checkboxes and more with the button below, or start from a
              template in the header.
            </Text>
          </Stack>
        </Card>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        modifiers={[restrictToVerticalAxis]}
        onDragEnd={onDragEnd}
      >
        <SortableContext items={elements.map((e) => e.uid)} strategy={verticalListSortingStrategy}>
          <Stack gap="xs">
            {elements.map((element, index) => (
              <ElementCard
                key={element.uid}
                element={element}
                issues={issues.filter((i) => i.elementUid === element.uid)}
                onEdit={() => setDialog({ mode: 'edit', element })}
                onDuplicate={() => duplicateElement(element.uid)}
                onDelete={() => remove(element, index)}
                onInsertBelow={() => setDialog({ mode: 'pick', index: index + 1 })}
              />
            ))}
          </Stack>
        </SortableContext>
      </DndContext>

      <Button
        variant="light"
        size="md"
        leftSection={<IconPlus size={18} />}
        onClick={() => setDialog({ mode: 'pick', index: elements.length })}
        fullWidth
        style={{
          borderStyle: 'dashed',
          borderWidth: 1,
          borderColor: 'var(--mantine-primary-color-light-color)',
        }}
      >
        Add element
      </Button>

      <TypePickerModal
        opened={dialog?.mode === 'pick'}
        onClose={() => setDialog(null)}
        onPick={pickType}
      />

      {(dialog?.mode === 'add' || dialog?.mode === 'edit') && (
        <ElementDialog
          key={dialog.element.uid}
          initial={dialog.element}
          isNew={dialog.mode === 'add'}
          takenIds={takenIds(dialog.element.uid)}
          onClose={() => setDialog(null)}
          onSave={(element) => {
            if (dialog.mode === 'add') addElement(element, dialog.index);
            else updateElement(element);
            setDialog(null);
          }}
        />
      )}
    </Stack>
  );
}
