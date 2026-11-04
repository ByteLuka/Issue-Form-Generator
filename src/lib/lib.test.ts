import { parse } from 'yaml';
import { describe, expect, it } from 'vitest';
import { createElement, duplicateElement, slugifyId, suggestFileName } from './elements';
import { ImportError, yamlToForm } from './parse';
import { formToPlain, formToYaml } from './serialize';
import { STARTER_TEMPLATES } from './templates';
import type { DropdownElement, IssueForm } from './types';
import { validateForm } from './validate';

const stripUids = (form: IssueForm) => ({
  ...form,
  elements: form.elements.map((element) => ({ ...element, uid: '' })),
});

describe('formToYaml', () => {
  it('omits empty optional keys', () => {
    const form: IssueForm = {
      settings: {
        name: 'Test',
        description: 'Desc',
        title: '',
        labels: [],
        assignees: [],
        projects: [],
        type: '',
      },
      elements: [{ ...createElement('input'), id: 'a', label: 'A' } as IssueForm['elements'][0]],
    };
    expect(formToPlain(form)).toEqual({
      name: 'Test',
      description: 'Desc',
      body: [{ type: 'input', id: 'a', attributes: { label: 'A' } }],
    });
  });

  it('writes validations, dropdown defaults and multi-line strings', () => {
    const yaml = formToYaml(STARTER_TEMPLATES.find((t) => t.key === 'bug')!.create());
    expect(yaml).toContain('labels: [bug, triage]');
    expect(yaml).toContain('required: true');
    expect(yaml).toContain('render: shell');
    expect(yaml).toContain('placeholder: |-\n');
  });

  it('keeps a dropdown default of 0', () => {
    const dropdown: DropdownElement = {
      ...(createElement('dropdown') as DropdownElement),
      label: 'D',
      options: ['a', 'b'],
      default: 0,
    };
    const plain = formToPlain({
      settings: STARTER_TEMPLATES[0].create().settings,
      elements: [dropdown],
    });
    expect((plain.body as { attributes: { default: number } }[])[0].attributes.default).toBe(0);
  });

  it('quotes markdown headings so "#" is not a comment', () => {
    const md = { ...createElement('markdown'), value: '# Heading' } as IssueForm['elements'][0];
    const yaml = formToYaml({ settings: STARTER_TEMPLATES[0].create().settings, elements: [md] });
    expect(parse(yaml).body[0].attributes.value).toBe('# Heading');
  });
});

describe('yamlToForm', () => {
  it('round-trips every starter template', () => {
    for (const template of STARTER_TEMPLATES) {
      const form = template.create();
      const { form: parsed, warnings } = yamlToForm(formToYaml(form));
      expect(warnings).toEqual([]);
      expect(stripUids(parsed)).toEqual(stripUids(form));
    }
  });

  it('accepts comma-delimited lists and warns about unknown keys', () => {
    const { form, warnings } = yamlToForm(
      'name: X\ndescription: Y\nlabels: "bug, ui"\nfoo: 1\nbody:\n  - type: nope\n',
    );
    expect(form.settings.labels).toEqual(['bug', 'ui']);
    expect(warnings).toHaveLength(2);
  });

  it('throws on invalid input', () => {
    expect(() => yamlToForm('name: [')).toThrow(ImportError);
    expect(() => yamlToForm('- a')).toThrow(ImportError);
    expect(() => yamlToForm('name: a\nbody: 3')).toThrow(ImportError);
  });
});

describe('validateForm', () => {
  it('accepts all non-blank starter templates without errors', () => {
    for (const template of STARTER_TEMPLATES.slice(1)) {
      const errors = validateForm(template.create()).filter((i) => i.level === 'error');
      expect(errors).toEqual([]);
    }
  });

  it('reports the main schema violations', () => {
    const a = { ...createElement('input'), id: 'dup', label: 'Same' } as IssueForm['elements'][0];
    const b = { ...createElement('input'), id: 'dup', label: 'Same' } as IssueForm['elements'][0];
    const dropdown: DropdownElement = {
      ...(createElement('dropdown') as DropdownElement),
      id: 'bad id',
      label: 'D',
      options: ['None', 'None'],
      default: 5,
    };
    const messages = validateForm({
      settings: { ...STARTER_TEMPLATES[0].create().settings, projects: ['nope'] },
      elements: [a, b, dropdown],
    }).map((i) => i.message);

    expect(messages.some((m) => m.includes('needs a name'))).toBe(true);
    expect(messages.some((m) => m.includes('OWNER/PROJECT-NUMBER'))).toBe(true);
    expect(messages.some((m) => m.includes('used more than once'))).toBe(true);
    expect(messages.some((m) => m.includes('may only contain'))).toBe(true);
    expect(messages.some((m) => m.includes('must be unique'))).toBe(true);
    expect(messages.some((m) => m.includes('does not exist'))).toBe(true);
    expect(messages.some((m) => m.includes('"None"'))).toBe(true);
  });

  it('requires at least one non-markdown element', () => {
    const md = { ...createElement('markdown'), value: 'hi' } as IssueForm['elements'][0];
    const issues = validateForm({
      settings: STARTER_TEMPLATES[1].create().settings,
      elements: [md],
    });
    expect(issues.some((i) => i.message.includes('at least one element'))).toBe(true);
  });
});

describe('helpers', () => {
  it('slugifies labels into valid ids', () => {
    expect(slugifyId('What happened?')).toBe('what-happened');
    expect(slugifyId('  Ünïcode & Stuff  ')).toBe('unicode-stuff');
  });

  it('suggests file names', () => {
    expect(suggestFileName('Bug report')).toBe('bug_report.yml');
    expect(suggestFileName('')).toBe('issue_form.yml');
  });

  it('duplicates elements with a unique id', () => {
    const el = { ...createElement('input'), id: 'x' } as IssueForm['elements'][0];
    const copy = duplicateElement(el, ['x', 'x-copy']);
    expect(copy.uid).not.toBe(el.uid);
    expect(copy.type !== 'markdown' && copy.id).toBe('x-copy-2');
  });
});
