import { CodeHighlight } from '@mantine/code-highlight';
import { Accordion, Button, Group, Modal, Stack, Stepper, Text, ThemeIcon } from '@mantine/core';
import { useState } from 'react';
import { ELEMENT_INFO } from '../../lib/elements';
import { elementToYaml } from '../../lib/serialize';
import type { FormElement } from '../../lib/types';
import { ELEMENT_COLORS, ELEMENT_ICONS } from '../elementIcons';
import {
  BasicsStep,
  CheckboxOptionsStep,
  ContentStep,
  DropdownOptionsStep,
  FilesStep,
  MarkdownStep,
  ValidationStep,
} from './steps';
import { stepErrors, stepsFor, type StepKey } from './stepConfig';

interface ElementDialogProps {
  /** The element to edit. For a new element this is a freshly created, empty one. */
  initial: FormElement;
  isNew: boolean;
  /** Ids of all *other* elements, used to prevent duplicates. */
  takenIds: string[];
  onSave: (element: FormElement) => void;
  onClose: () => void;
}

/**
 * Guided configuration of a single element. New elements walk through the steps in order;
 * existing elements can jump to any step and save at any time.
 */
export function ElementDialog({ initial, isNew, takenIds, onSave, onClose }: ElementDialogProps) {
  const [draft, setDraft] = useState<FormElement>(initial);
  const [active, setActive] = useState(0);
  const [idTouched, setIdTouched] = useState(
    !isNew || (initial.type !== 'markdown' && !!initial.id),
  );
  const [showErrors, setShowErrors] = useState(false);

  const steps = stepsFor(draft);
  const errors = stepErrors(draft, takenIds);
  const isLast = active === steps.length - 1;
  const currentKey = steps[active].key;
  const currentErrors = errors[currentKey] ?? {};
  const firstInvalid = steps.findIndex((step) => errors[step.key]);

  const Icon = ELEMENT_ICONS[draft.type];

  const next = () => {
    if (Object.keys(currentErrors).length) {
      setShowErrors(true);
      return;
    }
    setShowErrors(false);
    setActive((a) => Math.min(a + 1, steps.length - 1));
  };

  const save = () => {
    if (firstInvalid !== -1) {
      setActive(firstInvalid);
      setShowErrors(true);
      return;
    }
    onSave(draft);
  };

  const goTo = (index: number) => {
    // New elements may only jump forward if the steps in between are valid.
    const blocked = steps.slice(0, index).findIndex((step) => errors[step.key]);
    if (isNew && blocked !== -1 && blocked < index) {
      setActive(blocked);
      setShowErrors(true);
      return;
    }
    setActive(index);
  };

  const renderStep = (key: StepKey) => {
    const stepProps = { errors: showErrors ? (errors[key] ?? {}) : {} };
    if (draft.type === 'markdown') {
      return <MarkdownStep element={draft} onChange={setDraft} {...stepProps} />;
    }
    switch (key) {
      case 'basics':
        return (
          <BasicsStep
            element={draft}
            onChange={setDraft}
            idTouched={idTouched}
            onIdTouched={() => setIdTouched(true)}
            {...stepProps}
          />
        );
      case 'content':
        return draft.type === 'input' || draft.type === 'textarea' ? (
          <ContentStep element={draft} onChange={setDraft} {...stepProps} />
        ) : null;
      case 'options':
        if (draft.type === 'dropdown') {
          return <DropdownOptionsStep element={draft} onChange={setDraft} {...stepProps} />;
        }
        if (draft.type === 'checkboxes') {
          return <CheckboxOptionsStep element={draft} onChange={setDraft} {...stepProps} />;
        }
        return null;
      case 'files':
        return draft.type === 'upload' ? (
          <FilesStep element={draft} onChange={setDraft} {...stepProps} />
        ) : null;
      case 'validation':
        return <ValidationStep element={draft} onChange={setDraft} {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <Modal
      opened
      onClose={onClose}
      size="xl"
      title={
        <Group gap="xs">
          <ThemeIcon variant="light" color={ELEMENT_COLORS[draft.type]}>
            <Icon size={18} />
          </ThemeIcon>
          <Text fw={600}>
            {isNew ? 'Add' : 'Edit'} {ELEMENT_INFO[draft.type].label.toLowerCase()}
          </Text>
        </Group>
      }
    >
      <Stack gap="lg">
        {steps.length > 1 && (
          <Stepper active={active} onStepClick={goTo} size="sm" allowNextStepsSelect={!isNew}>
            {steps.map((step) => (
              <Stepper.Step
                key={step.key}
                label={step.label}
                description={step.description}
                color={showErrors && errors[step.key] ? 'red' : undefined}
              />
            ))}
          </Stepper>
        )}

        <div style={{ minHeight: 220 }}>{renderStep(currentKey)}</div>

        <Accordion variant="contained" chevronPosition="left">
          <Accordion.Item value="yaml">
            <Accordion.Control>
              <Text size="sm">YAML for this element</Text>
            </Accordion.Control>
            <Accordion.Panel>
              <CodeHighlight code={elementToYaml(draft)} language="yaml" radius="sm" />
            </Accordion.Panel>
          </Accordion.Item>
        </Accordion>

        <Group justify="space-between">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Group gap="xs">
            {active > 0 && (
              <Button variant="default" onClick={() => setActive((a) => a - 1)}>
                Back
              </Button>
            )}
            {!isNew && !isLast && (
              <Button variant="light" onClick={save}>
                Save
              </Button>
            )}
            {isLast ? (
              <Button onClick={save}>{isNew ? 'Add to form' : 'Save'}</Button>
            ) : (
              <Button onClick={next}>Next</Button>
            )}
          </Group>
        </Group>
      </Stack>
    </Modal>
  );
}
