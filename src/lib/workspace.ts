import { createEmptyForm, createUid, suggestFileName } from './elements';
import { configToYaml, formToYaml } from './serialize';
import type { ChooserConfig, ContactLink, IssueForm, Template, Workspace } from './types';

export const TEMPLATE_DIR = '.github/ISSUE_TEMPLATE';
export const CONFIG_FILE_NAME = 'config.yml';

export function createTemplate(form: IssueForm = createEmptyForm(), fileName = ''): Template {
  return { uid: createUid(), fileName, settings: form.settings, elements: form.elements };
}

/** True for a template the user has not touched yet (nothing would be lost by replacing it). */
export function isTemplateEmpty(template: Template): boolean {
  const { settings } = template;
  return (
    template.elements.length === 0 &&
    !template.fileName.trim() &&
    Object.values(settings).every((value) =>
      Array.isArray(value) ? value.length === 0 : !value.trim(),
    )
  );
}

export function createDefaultConfig(): ChooserConfig {
  return { blankIssuesEnabled: true, contactLinks: [] };
}

export function createContactLink(): ContactLink {
  return { uid: createUid(), name: '', url: '', about: '' };
}

export function createWorkspace(): Workspace {
  return { templates: [createTemplate()], config: createDefaultConfig() };
}

/** GitHub's behavior without a config.yml: blank issues allowed, no contact links. */
export function isDefaultConfig(config: ChooserConfig): boolean {
  return config.blankIssuesEnabled && config.contactLinks.length === 0;
}

/** Cleans a user-entered file name: no folders, always a `.yml` / `.yaml` extension. */
export function normalizeFileName(input: string): string {
  const name = input.trim().split(/[\\/]/).pop() ?? '';
  if (!name) return '';
  return /\.ya?ml$/i.test(name) ? name : `${name}.yml`;
}

/**
 * File names for all templates, in the same order. Derived names get a numeric suffix when they collide;
 * custom names are kept as entered (collisions are reported by validation).
 */
export function templateFileNames(templates: Template[]): string[] {
  const custom = templates.map((t) => normalizeFileName(t.fileName));
  const taken = new Set(custom.filter(Boolean).map((n) => n.toLowerCase()));
  taken.add(CONFIG_FILE_NAME);

  return templates.map((template, index) => {
    if (custom[index]) return custom[index];
    const base = suggestFileName(template.settings.name).replace(/\.yml$/, '');
    let candidate = `${base}.yml`;
    for (let i = 2; taken.has(candidate.toLowerCase()); i++) candidate = `${base}_${i}.yml`;
    taken.add(candidate.toLowerCase());
    return candidate;
  });
}

export interface WorkspaceFile {
  path: string;
  content: string;
}

/** All files to put into the repository. `config.yml` is only included when it changes GitHub's default. */
export function workspaceFiles(workspace: Workspace): WorkspaceFile[] {
  const names = templateFileNames(workspace.templates);
  const files = workspace.templates.map((template, index) => ({
    path: `${TEMPLATE_DIR}/${names[index]}`,
    content: formToYaml(template),
  }));
  if (!isDefaultConfig(workspace.config)) {
    files.push({
      path: `${TEMPLATE_DIR}/${CONFIG_FILE_NAME}`,
      content: configToYaml(workspace.config),
    });
  }
  return files;
}

/** Builds a zip with the `.github/ISSUE_TEMPLATE/` folder. JSZip is loaded only when needed. */
export async function buildZip(workspace: Workspace): Promise<Blob> {
  const { default: JSZip } = await import('jszip');
  const zip = new JSZip();
  for (const file of workspaceFiles(workspace)) zip.file(file.path, file.content);
  return zip.generateAsync({ type: 'blob' });
}
