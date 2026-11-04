/**
 * In-memory model of a GitHub issue form.
 * See https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-githubs-form-schema
 *
 * Every element carries a `uid` that is only used inside the app (React keys, selection).
 * It is never written to the YAML output.
 */

export const ELEMENT_TYPES = [
  'markdown',
  'input',
  'textarea',
  'dropdown',
  'checkboxes',
  'upload',
] as const;

export type ElementType = (typeof ELEMENT_TYPES)[number];

interface ElementBase {
  uid: string;
}

/** Shared by every element that collects input (everything except markdown). */
interface FieldBase extends ElementBase {
  id: string;
  label: string;
  description: string;
  required: boolean;
}

export interface MarkdownElement extends ElementBase {
  type: 'markdown';
  value: string;
}

export interface InputElement extends FieldBase {
  type: 'input';
  placeholder: string;
  value: string;
  minLength: number | null;
}

export interface TextareaElement extends FieldBase {
  type: 'textarea';
  placeholder: string;
  value: string;
  render: string;
  minLength: number | null;
}

export interface DropdownElement extends FieldBase {
  type: 'dropdown';
  multiple: boolean;
  options: string[];
  /** Index into `options` of the preselected option. */
  default: number | null;
}

export interface CheckboxOption {
  label: string;
  required: boolean;
}

export interface CheckboxesElement extends FieldBase {
  type: 'checkboxes';
  options: CheckboxOption[];
}

export interface UploadElement extends FieldBase {
  type: 'upload';
  /** Comma-separated list of file extensions, e.g. `.png,.jpg`. */
  accept: string;
}

export type FormElement =
  | MarkdownElement
  | InputElement
  | TextareaElement
  | DropdownElement
  | CheckboxesElement
  | UploadElement;

export type FieldElement = Exclude<FormElement, MarkdownElement>;

export interface FormSettings {
  name: string;
  description: string;
  title: string;
  labels: string[];
  assignees: string[];
  projects: string[];
  type: string;
}

export interface IssueForm {
  settings: FormSettings;
  elements: FormElement[];
}

export function isField(element: FormElement): element is FieldElement {
  return element.type !== 'markdown';
}
