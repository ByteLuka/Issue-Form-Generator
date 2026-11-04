import type { ElementType, FormElement, FormSettings, IssueForm } from './types';

export function createUid(): string {
  return crypto.randomUUID();
}

/** Creates a new element of the given type with sensible empty defaults. */
export function createElement(type: ElementType): FormElement {
  const uid = createUid();
  const field = { uid, id: '', label: '', description: '', required: false };
  switch (type) {
    case 'markdown':
      return { uid, type, value: '' };
    case 'input':
      return { ...field, type, placeholder: '', value: '', minLength: null };
    case 'textarea':
      return { ...field, type, placeholder: '', value: '', render: '', minLength: null };
    case 'dropdown':
      return { ...field, type, multiple: false, options: [''], default: null };
    case 'checkboxes':
      return { ...field, type, options: [{ label: '', required: false }] };
    case 'upload':
      return { ...field, type, accept: '' };
  }
}

/** Deep copy with a fresh uid. The id gets a suffix so it stays unique. */
export function duplicateElement(element: FormElement, takenIds: Iterable<string>): FormElement {
  const copy = structuredClone(element);
  copy.uid = createUid();
  if (copy.type !== 'markdown' && copy.id) {
    copy.id = uniqueId(`${copy.id}-copy`, takenIds);
  }
  return copy;
}

export function uniqueId(base: string, takenIds: Iterable<string>): string {
  const taken = new Set(takenIds);
  if (!taken.has(base)) return base;
  let i = 2;
  while (taken.has(`${base}-${i}`)) i++;
  return `${base}-${i}`;
}

/** Turns a label into a valid element id, e.g. "What happened?" → "what-happened". */
export function slugifyId(label: string): string {
  return label
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/-{2,}/g, '-')
    .replace(/^-|-$/g, '');
}

/** Suggested file name for `.github/ISSUE_TEMPLATE/`, e.g. "Bug report" → "bug_report.yml". */
export function suggestFileName(name: string): string {
  const slug = slugifyId(name).replace(/-/g, '_');
  return `${slug || 'issue_form'}.yml`;
}

export function createEmptySettings(): FormSettings {
  return {
    name: '',
    description: '',
    title: '',
    labels: [],
    assignees: [],
    projects: [],
    type: '',
  };
}

export function createEmptyForm(): IssueForm {
  return { settings: createEmptySettings(), elements: [] };
}

export const ELEMENT_INFO: Record<ElementType, { label: string; description: string }> = {
  markdown: {
    label: 'Markdown',
    description: 'Static text shown to the user, e.g. instructions. Not submitted with the issue.',
  },
  input: {
    label: 'Input',
    description: 'Single-line text field, e.g. a version number or a short summary.',
  },
  textarea: {
    label: 'Textarea',
    description: 'Multi-line text field. Can render its content as a code block, e.g. for logs.',
  },
  dropdown: {
    label: 'Dropdown',
    description: 'Select one or several options from a list.',
  },
  checkboxes: {
    label: 'Checkboxes',
    description: 'A list of checkboxes, e.g. confirmations like "I searched existing issues".',
  },
  upload: {
    label: 'Upload',
    description: 'File upload field, optionally limited to certain file types.',
  },
};
