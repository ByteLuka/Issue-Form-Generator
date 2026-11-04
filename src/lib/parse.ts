import { parse } from 'yaml';
import { createEmptySettings, createUid } from './elements';
import { ELEMENT_TYPES, type ElementType, type FormElement, type IssueForm } from './types';

export interface ParseResult {
  form: IssueForm;
  /** Things that were ignored or adjusted during the import. */
  warnings: string[];
}

export class ImportError extends Error {}

type Plain = Record<string, unknown>;

function isPlain(value: unknown): value is Plain {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function str(value: unknown): string {
  if (value === undefined || value === null) return '';
  return String(value);
}

/** Accepts both YAML arrays and comma-delimited strings, as GitHub does. */
function list(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(str).filter(Boolean);
  if (typeof value === 'string') {
    return value
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  return [];
}

function nonNegativeInt(value: unknown): number | null {
  const n = typeof value === 'string' ? Number(value) : value;
  return typeof n === 'number' && Number.isInteger(n) && n >= 0 ? n : null;
}

function warnUnknownKeys(obj: Plain, known: string[], where: string, warnings: string[]) {
  for (const key of Object.keys(obj)) {
    if (!known.includes(key)) warnings.push(`${where}: unknown key "${key}" was ignored.`);
  }
}

function parseElement(raw: unknown, index: number, warnings: string[]): FormElement | null {
  const where = `body[${index}]`;
  if (!isPlain(raw)) {
    warnings.push(`${where}: not a map, skipped.`);
    return null;
  }
  const type = str(raw.type) as ElementType;
  if (!ELEMENT_TYPES.includes(type)) {
    warnings.push(`${where}: unsupported type "${str(raw.type)}", skipped.`);
    return null;
  }
  warnUnknownKeys(raw, ['type', 'id', 'attributes', 'validations'], where, warnings);

  const attributes = isPlain(raw.attributes) ? raw.attributes : {};
  const validations = isPlain(raw.validations) ? raw.validations : {};
  const uid = createUid();

  if (type === 'markdown') {
    return { uid, type, value: str(attributes.value) };
  }

  const field = {
    uid,
    id: str(raw.id),
    label: str(attributes.label),
    description: str(attributes.description),
    required: validations.required === true,
  };

  switch (type) {
    case 'input':
      return {
        ...field,
        type,
        placeholder: str(attributes.placeholder),
        value: str(attributes.value),
        minLength: nonNegativeInt(validations.min_length),
      };
    case 'textarea':
      return {
        ...field,
        type,
        placeholder: str(attributes.placeholder),
        value: str(attributes.value),
        render: str(attributes.render),
        minLength: nonNegativeInt(validations.min_length),
      };
    case 'dropdown': {
      const options = Array.isArray(attributes.options) ? attributes.options.map(str) : [];
      return {
        ...field,
        type,
        multiple: attributes.multiple === true,
        options,
        default: nonNegativeInt(attributes.default),
      };
    }
    case 'checkboxes': {
      const options = Array.isArray(attributes.options)
        ? attributes.options.map((option) =>
            isPlain(option)
              ? { label: str(option.label), required: option.required === true }
              : { label: str(option), required: false },
          )
        : [];
      return { ...field, type, options };
    }
    case 'upload':
      return { ...field, type, accept: str(validations.accept) };
  }
}

/** Parses issue form YAML into the editor model. Throws `ImportError` when it is unusable. */
export function yamlToForm(source: string): ParseResult {
  let data: unknown;
  try {
    data = parse(source);
  } catch (error) {
    throw new ImportError(`Invalid YAML: ${(error as Error).message}`);
  }
  if (!isPlain(data)) {
    throw new ImportError('The YAML must be a map with at least "name", "description" and "body".');
  }

  const warnings: string[] = [];
  warnUnknownKeys(
    data,
    ['name', 'description', 'title', 'labels', 'assignees', 'projects', 'type', 'body'],
    'Top level',
    warnings,
  );

  const settings = createEmptySettings();
  settings.name = str(data.name);
  settings.description = str(data.description);
  settings.title = str(data.title);
  settings.type = str(data.type);
  settings.labels = list(data.labels);
  settings.assignees = list(data.assignees);
  settings.projects = list(data.projects);

  if (data.body !== undefined && !Array.isArray(data.body)) {
    throw new ImportError('"body" must be a list of form elements.');
  }
  const body = Array.isArray(data.body) ? data.body : [];
  const elements = body
    .map((raw, index) => parseElement(raw, index, warnings))
    .filter((element): element is FormElement => element !== null);

  return { form: { settings, elements }, warnings };
}
