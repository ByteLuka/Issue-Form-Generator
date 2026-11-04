import type { FormElement } from '../../lib/types';

export type StepKey = 'markdown' | 'basics' | 'content' | 'options' | 'files' | 'validation';

export interface StepDefinition {
  key: StepKey;
  label: string;
  description: string;
}

export function stepsFor(element: FormElement): StepDefinition[] {
  const basics: StepDefinition = { key: 'basics', label: 'Basics', description: 'Label & id' };
  const validation: StepDefinition = {
    key: 'validation',
    label: 'Validation',
    description: 'Required & limits',
  };
  switch (element.type) {
    case 'markdown':
      return [{ key: 'markdown', label: 'Content', description: 'Markdown text' }];
    case 'input':
    case 'textarea':
      return [
        basics,
        { key: 'content', label: 'Defaults', description: 'Placeholder & value' },
        validation,
      ];
    case 'dropdown':
    case 'checkboxes':
      return [basics, { key: 'options', label: 'Options', description: 'Choices' }, validation];
    case 'upload':
      return [
        basics,
        { key: 'files', label: 'File types', description: 'Accepted files' },
        validation,
      ];
  }
}

const ID_PATTERN = /^[A-Za-z0-9_-]*$/;

/** Problems that block leaving a step. Keys are step keys, values are field → message. */
export function stepErrors(
  element: FormElement,
  takenIds: string[],
): Partial<Record<StepKey, Record<string, string>>> {
  const errors: Partial<Record<StepKey, Record<string, string>>> = {};
  const add = (step: StepKey, field: string, message: string) => {
    errors[step] = { ...errors[step], [field]: message };
  };

  if (element.type === 'markdown') {
    if (!element.value.trim()) add('markdown', 'value', 'Enter some text.');
    return errors;
  }

  if (!element.label.trim()) add('basics', 'label', 'A label is required.');
  const id = element.id.trim();
  if (!ID_PATTERN.test(id)) add('basics', 'id', 'Only letters, numbers, "-" and "_" are allowed.');
  else if (id && takenIds.includes(id))
    add('basics', 'id', 'Another element already uses this id.');

  if (element.type === 'dropdown') {
    const options = element.options.map((o) => o.trim());
    if (options.filter(Boolean).length === 0) add('options', 'options', 'Add at least one option.');
    else if (options.some((o) => !o)) add('options', 'options', 'Remove or fill in empty options.');
    else if (new Set(options).size !== options.length) {
      add('options', 'options', 'Options must be unique.');
    }
  }
  if (element.type === 'checkboxes') {
    if (element.options.length === 0) add('options', 'options', 'Add at least one checkbox.');
    else if (element.options.some((o) => !o.label.trim())) {
      add('options', 'options', 'Remove or fill in empty checkboxes.');
    }
  }
  return errors;
}
