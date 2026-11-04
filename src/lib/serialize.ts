import { Document, isMap, isSeq, YAMLSeq } from 'yaml';
import type { FormElement, IssueForm } from './types';

type Plain = Record<string, unknown>;

/** Adds `key: value` only when the value is meaningful (non-empty string, non-empty array, etc.). */
function put(target: Plain, key: string, value: unknown) {
  if (value === undefined || value === null || value === '' || value === false) return;
  if (Array.isArray(value) && value.length === 0) return;
  if (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0) {
    return;
  }
  target[key] = value;
}

function elementToPlain(element: FormElement): Plain {
  const out: Plain = { type: element.type };

  if (element.type === 'markdown') {
    out.attributes = { value: element.value };
    return out;
  }

  put(out, 'id', element.id.trim());

  const attributes: Plain = { label: element.label };
  put(attributes, 'description', element.description);
  const validations: Plain = {};
  put(validations, 'required', element.required);

  switch (element.type) {
    case 'input':
    case 'textarea':
      put(attributes, 'placeholder', element.placeholder);
      put(attributes, 'value', element.value);
      if (element.type === 'textarea') put(attributes, 'render', element.render.trim());
      if (element.minLength !== null && element.minLength >= 0) {
        validations.min_length = element.minLength;
      }
      break;
    case 'dropdown':
      put(attributes, 'multiple', element.multiple);
      attributes.options = element.options;
      if (element.default !== null) attributes.default = element.default;
      break;
    case 'checkboxes':
      attributes.options = element.options.map((option) => {
        const plain: Plain = { label: option.label };
        put(plain, 'required', option.required);
        return plain;
      });
      break;
    case 'upload':
      put(validations, 'accept', element.accept.replace(/\s+/g, ''));
      break;
  }

  out.attributes = attributes;
  put(out, 'validations', validations);
  return out;
}

/** Converts the form to the plain object that GitHub expects (without empty optional keys). */
export function formToPlain(form: IssueForm): Plain {
  const { settings } = form;
  const out: Plain = {
    name: settings.name,
    description: settings.description,
  };
  put(out, 'title', settings.title);
  put(out, 'labels', settings.labels);
  put(out, 'projects', settings.projects);
  put(out, 'assignees', settings.assignees);
  put(out, 'type', settings.type.trim());
  out.body = form.elements.map(elementToPlain);
  return out;
}

/** Generates the issue form YAML. */
export function formToYaml(form: IssueForm): string {
  const doc = new Document(formToPlain(form));

  for (const key of ['labels', 'projects', 'assignees']) {
    const node = doc.get(key, true);
    if (isSeq(node)) node.flow = true;
  }

  // An empty line between body elements makes long forms much easier to read.
  const body = doc.get('body', true);
  if (body instanceof YAMLSeq) {
    body.items.forEach((item, index) => {
      if (index > 0 && isMap(item)) item.spaceBefore = true;
    });
  }

  return doc.toString({ lineWidth: 0, blockQuote: 'literal', flowCollectionPadding: false });
}
