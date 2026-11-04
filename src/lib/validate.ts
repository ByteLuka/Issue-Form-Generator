import { isField, type ChooserConfig, type IssueForm, type Workspace } from './types';
import { normalizeFileName, templateFileNames } from './workspace';

export type IssueLevel = 'error' | 'warning';

export interface ValidationIssue {
  level: IssueLevel;
  message: string;
  /** uid of the element the issue belongs to; undefined for form settings. */
  elementUid?: string;
  /** Template uid, or `CONFIG_SCOPE` for config.yml. Set by `validateWorkspace`. */
  scope?: string;
}

/** Scope of issues that belong to `config.yml`. */
export const CONFIG_SCOPE = 'config';

const ID_PATTERN = /^[A-Za-z0-9_-]+$/;
const PROJECT_PATTERN = /^[^/\s]+\/\d+$/;
const EXTENSION_PATTERN = /^\.[A-Za-z0-9.]+$/;
const NONE_OPTIONS = ['none', 'n/a'];

/** File types GitHub accepts for the `upload` element. */
export const UPLOAD_EXTENSIONS = [
  '.zip', '.gz', '.tar.gz',
  '.pdf', '.docx', '.xlsx', '.pptx',
  '.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp',
  '.mp4', '.mov', '.webm',
  '.json', '.py', '.js', '.ts', '.log', '.txt', '.csv',
]; // prettier-ignore

/**
 * Checks the form against the rules from GitHub's form schema.
 * Errors make GitHub reject the template; warnings are likely mistakes.
 */
export function validateForm(form: IssueForm): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { settings, elements } = form;
  const error = (message: string, elementUid?: string) =>
    issues.push({ level: 'error', message, elementUid });
  const warning = (message: string, elementUid?: string) =>
    issues.push({ level: 'warning', message, elementUid });

  if (!settings.name.trim()) error('The form needs a name.');
  else if (settings.name.trim().length <= 3) {
    error('The name must be longer than 3 characters, otherwise GitHub hides the template.');
  }
  if (!settings.description.trim()) error('The form needs a description.');
  for (const project of settings.projects) {
    if (!PROJECT_PATTERN.test(project)) {
      error(`Project "${project}" must have the format OWNER/PROJECT-NUMBER, e.g. octo-org/1.`);
    }
  }

  if (!elements.some(isField)) {
    error('The form needs at least one element that is not markdown.');
  }

  const ids = new Map<string, number>();
  const labels = new Map<string, number>();
  for (const element of elements) {
    if (!isField(element)) continue;
    const id = element.id.trim();
    if (id) ids.set(id, (ids.get(id) ?? 0) + 1);
    const label = element.label.trim();
    if (label) labels.set(label, (labels.get(label) ?? 0) + 1);
  }

  elements.forEach((element, index) => {
    const position = `Element ${index + 1}`;
    const uid = element.uid;

    if (!isField(element)) {
      if (!element.value.trim()) error(`${position} (markdown) has no content.`, uid);
      return;
    }

    const name = element.label.trim() ? `"${element.label.trim()}"` : position;
    const id = element.id.trim();

    if (!element.label.trim()) error(`${position} (${element.type}) needs a label.`, uid);
    else if ((labels.get(element.label.trim()) ?? 0) > 1) {
      error(`Label ${name} is used more than once. Labels must be unique.`, uid);
    }

    if (id && !ID_PATTERN.test(id)) {
      error(`${name}: the id may only contain letters, numbers, "-" and "_".`, uid);
    } else if (id && (ids.get(id) ?? 0) > 1) {
      error(`${name}: the id "${id}" is used more than once.`, uid);
    }

    switch (element.type) {
      case 'input':
      case 'textarea':
        if (element.minLength !== null && element.minLength < 0) {
          error(`${name}: minimum length must not be negative.`, uid);
        }
        break;

      case 'dropdown': {
        const options = element.options.map((option) => option.trim());
        if (options.length === 0) error(`${name}: the dropdown needs at least one option.`, uid);
        if (options.some((option) => !option)) error(`${name}: options must not be empty.`, uid);
        if (new Set(options).size !== options.length) {
          error(`${name}: options must be unique.`, uid);
        }
        if (element.default !== null) {
          if (element.default >= options.length) {
            error(`${name}: the default option does not exist.`, uid);
          }
          if (options.some((option) => NONE_OPTIONS.includes(option.toLowerCase()))) {
            error(`${name}: when a default is set, options must not include "None" or "n/a".`, uid);
          }
        }
        break;
      }

      case 'checkboxes':
        if (element.options.length === 0) {
          error(`${name}: add at least one checkbox option.`, uid);
        }
        if (element.options.some((option) => !option.label.trim())) {
          error(`${name}: checkbox labels must not be empty.`, uid);
        }
        break;

      case 'upload': {
        const extensions = element.accept
          .split(',')
          .map((ext) => ext.trim())
          .filter(Boolean);
        for (const ext of extensions) {
          if (!EXTENSION_PATTERN.test(ext)) {
            error(`${name}: "${ext}" is not a file extension (expected e.g. ".png").`, uid);
          } else if (!UPLOAD_EXTENSIONS.includes(ext.toLowerCase())) {
            warning(`${name}: GitHub does not support uploading "${ext}" files.`, uid);
          }
        }
        break;
      }
    }

    if (!id) {
      warning(
        `${name} has no id. An id lets you prefill the field via URL and keeps answers stable when the label changes.`,
        uid,
      );
    }
  });

  return issues;
}

/** Checks `config.yml`. All three keys of a contact link are required by GitHub. */
export function validateConfig(config: ChooserConfig): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  config.contactLinks.forEach((link, index) => {
    const name = link.name.trim()
      ? `Contact link "${link.name.trim()}"`
      : `Contact link ${index + 1}`;
    const add = (message: string) =>
      issues.push({ level: 'error', message, elementUid: link.uid, scope: CONFIG_SCOPE });
    if (!link.name.trim()) add(`${name} needs a name.`);
    if (!link.about.trim()) add(`${name} needs a description ("about").`);
    if (!link.url.trim()) add(`${name} needs a URL.`);
    else if (!isWebUrl(link.url.trim()))
      add(`${name}: the URL must start with https:// or http://.`);
  });
  return issues;
}

function isWebUrl(value: string): boolean {
  try {
    return ['https:', 'http:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

/** Validates every template, the config and rules that span several templates. */
export function validateWorkspace(workspace: Workspace): ValidationIssue[] {
  const issues: ValidationIssue[] = [];
  const { templates } = workspace;

  for (const template of templates) {
    for (const issue of validateForm(template)) issues.push({ ...issue, scope: template.uid });
  }
  issues.push(...validateConfig(workspace.config));

  // Names must be unique across all templates.
  const byName = groupBy(templates, (t) => t.settings.name.trim().toLowerCase());
  for (const [name, group] of byName) {
    if (!name || group.length < 2) continue;
    for (const template of group) {
      issues.push({
        level: 'error',
        message: `The name "${template.settings.name.trim()}" is used by ${group.length} templates. Names must be unique.`,
        scope: template.uid,
      });
    }
  }

  // Two templates must not be written to the same file.
  const fileNames = templateFileNames(templates);
  const byFile = groupBy(
    templates.map((template, index) => ({ template, file: fileNames[index].toLowerCase() })),
    (entry) => entry.file,
  );
  for (const [file, group] of byFile) {
    if (group.length < 2) continue;
    for (const { template } of group) {
      issues.push({
        level: 'error',
        message: `The file name "${file}" is used by ${group.length} templates.`,
        scope: template.uid,
      });
    }
  }
  for (const template of templates) {
    if (normalizeFileName(template.fileName).toLowerCase() === 'config.yml') {
      issues.push({
        level: 'error',
        message: '"config.yml" is reserved for the template chooser.',
        scope: template.uid,
      });
    }
  }

  return issues;
}

function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    map.set(k, [...(map.get(k) ?? []), item]);
  }
  return map;
}
