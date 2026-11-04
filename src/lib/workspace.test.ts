import JSZip from 'jszip';
import { describe, expect, it } from 'vitest';
import { createEmptyForm } from './elements';
import { ImportError, parseImport, yamlToConfig } from './parse';
import { configToYaml } from './serialize';
import { STARTER_TEMPLATES } from './templates';
import type { ChooserConfig, Template, Workspace } from './types';
import { CONFIG_SCOPE, validateConfig, validateForm, validateWorkspace } from './validate';
import {
  buildZip,
  createContactLink,
  createDefaultConfig,
  createTemplate,
  normalizeFileName,
  templateFileNames,
  workspaceFiles,
} from './workspace';

const starter = (key: string) => STARTER_TEMPLATES.find((t) => t.key === key)!.create();

function named(name: string, fileName = ''): Template {
  const form = createEmptyForm();
  form.settings.name = name;
  return createTemplate(form, fileName);
}

const config = (patch: Partial<ChooserConfig> = {}): ChooserConfig => ({
  ...createDefaultConfig(),
  ...patch,
});

describe('file names', () => {
  it('normalizes custom file names', () => {
    expect(normalizeFileName('  1-bug ')).toBe('1-bug.yml');
    expect(normalizeFileName('docs.yaml')).toBe('docs.yaml');
    expect(normalizeFileName('../evil/bug.yml')).toBe('bug.yml');
    expect(normalizeFileName('')).toBe('');
  });

  it('derives unique names and keeps custom ones', () => {
    const names = templateFileNames([
      named('Bug report'),
      named('Bug report'),
      named('Anything', 'bug_report_2.yml'),
      named('Config'),
    ]);
    expect(names).toEqual([
      'bug_report.yml',
      'bug_report_3.yml',
      'bug_report_2.yml',
      'config_2.yml',
    ]);
  });
});

describe('workspaceFiles', () => {
  it('leaves out config.yml when it matches GitHub defaults', () => {
    const files = workspaceFiles({ templates: [createTemplate(starter('bug'))], config: config() });
    expect(files.map((f) => f.path)).toEqual(['.github/ISSUE_TEMPLATE/bug_report.yml']);
    expect(files[0].content).toContain('name: Bug report');
  });

  it('includes config.yml when it differs from the defaults', () => {
    const files = workspaceFiles({
      templates: [createTemplate(starter('bug'))],
      config: config({ blankIssuesEnabled: false }),
    });
    expect(files.map((f) => f.path)).toContain('.github/ISSUE_TEMPLATE/config.yml');
  });

  it('builds a zip with all files', async () => {
    const workspace: Workspace = {
      templates: [createTemplate(starter('bug')), createTemplate(starter('feature'))],
      config: config({ blankIssuesEnabled: false }),
    };
    const zip = await JSZip.loadAsync(await (await buildZip(workspace)).arrayBuffer());
    const paths = Object.keys(zip.files).filter((path) => !zip.files[path].dir);
    expect(paths.sort()).toEqual([
      '.github/ISSUE_TEMPLATE/bug_report.yml',
      '.github/ISSUE_TEMPLATE/config.yml',
      '.github/ISSUE_TEMPLATE/feature_request.yml',
    ]);
  });
});

describe('config.yml', () => {
  const link = {
    ...createContactLink(),
    name: 'Forum',
    url: 'https://example.com',
    about: 'Ask here',
  };

  it('generates config.yml', () => {
    expect(configToYaml(config({ blankIssuesEnabled: false, contactLinks: [link] }))).toBe(
      'blank_issues_enabled: false\ncontact_links:\n  - name: Forum\n    url: https://example.com\n    about: Ask here\n',
    );
    expect(configToYaml(config())).toBe('blank_issues_enabled: true\n');
  });

  it('round-trips config.yml', () => {
    const original = config({ blankIssuesEnabled: false, contactLinks: [link] });
    const { config: parsed, warnings } = yamlToConfig(configToYaml(original));
    expect(warnings).toEqual([]);
    expect({
      ...parsed,
      contactLinks: parsed.contactLinks.map((l) => ({ ...l, uid: '' })),
    }).toEqual({
      ...original,
      contactLinks: [{ ...link, uid: '' }],
    });
  });

  it('treats a missing blank_issues_enabled as enabled', () => {
    expect(yamlToConfig('contact_links: []').config.blankIssuesEnabled).toBe(true);
  });

  it('validates contact links', () => {
    const issues = validateConfig(
      config({ contactLinks: [{ ...createContactLink(), name: 'X', url: 'ftp://x' }] }),
    );
    expect(issues.map((i) => i.message)).toEqual([
      'Contact link "X" needs a description ("about").',
      'Contact link "X": the URL must start with https:// or http://.',
    ]);
    expect(issues.every((i) => i.scope === CONFIG_SCOPE)).toBe(true);
  });
});

describe('parseImport', () => {
  it('detects issue forms and config files', () => {
    expect(parseImport('name: Bug\ndescription: x\nbody: []').kind).toBe('form');
    expect(parseImport('blank_issues_enabled: false').kind).toBe('config');
    expect(parseImport('contact_links:\n  - name: a').kind).toBe('config');
  });

  it('rejects contact_links that are not a list', () => {
    expect(() => parseImport('contact_links: 3')).toThrow(ImportError);
  });
});

describe('validateWorkspace', () => {
  it('requires names longer than 3 characters', () => {
    const form = starter('bug');
    form.settings.name = 'Bug';
    expect(validateForm(form).some((i) => i.message.includes('longer than 3'))).toBe(true);
  });

  it('reports duplicate names across templates', () => {
    const a = createTemplate(starter('bug'));
    const b = createTemplate(starter('bug'));
    const issues = validateWorkspace({ templates: [a, b], config: config() });
    const message = 'The name "Bug report" is used by 2 templates. Names must be unique.';
    expect(issues.filter((i) => i.message === message).map((i) => i.scope)).toEqual([a.uid, b.uid]);
  });

  it('reports custom file names used twice', () => {
    const a = createTemplate(starter('bug'), '1-issue.yml');
    const b = createTemplate(starter('feature'), '1-issue');
    const issues = validateWorkspace({ templates: [a, b], config: config() });
    const message = 'The file name "1-issue.yml" is used by 2 templates.';
    expect(issues.filter((i) => i.message === message).map((i) => i.scope)).toEqual([a.uid, b.uid]);
  });

  it('reserves config.yml', () => {
    const template = createTemplate(starter('bug'), 'config');
    const issues = validateWorkspace({ templates: [template], config: config() });
    expect(issues.some((i) => i.message.includes('reserved'))).toBe(true);
  });

  it('accepts the starter templates together', () => {
    const templates = STARTER_TEMPLATES.slice(1).map((t) => createTemplate(t.create()));
    const errors = validateWorkspace({ templates, config: config() }).filter(
      (i) => i.level === 'error',
    );
    expect(errors).toEqual([]);
  });
});
