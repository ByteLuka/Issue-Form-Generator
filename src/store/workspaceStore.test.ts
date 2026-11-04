import { beforeEach, describe, expect, it } from 'vitest';
import { createElement } from '../lib/elements';
import { STARTER_TEMPLATES } from '../lib/templates';
import { CONFIG_TAB, migrate, useWorkspaceStore } from './workspaceStore';

const store = () => useWorkspaceStore.getState();
const bug = () => STARTER_TEMPLATES.find((t) => t.key === 'bug')!.create();
const active = () => store().templates.find((t) => t.uid === store().activeId);

beforeEach(() => store().resetWorkspace());

describe('migrate', () => {
  it('turns the single form of version 1 into a workspace', () => {
    const form = bug();
    const data = migrate({ settings: form.settings, elements: form.elements }, 1);
    expect(data.templates).toHaveLength(1);
    expect(data.templates[0].settings.name).toBe('Bug report');
    expect(data.templates[0].elements).toEqual(form.elements);
    expect(data.templates[0].fileName).toBe('');
    expect(data.activeId).toBe(data.templates[0].uid);
    expect(data.config).toEqual({ blankIssuesEnabled: true, contactLinks: [] });
  });

  it('falls back to a fresh workspace for unusable data', () => {
    expect(migrate(undefined, 1).templates).toHaveLength(1);
  });
});

describe('templates', () => {
  it('starts with one blank template', () => {
    expect(store().templates).toHaveLength(1);
    expect(active()?.settings.name).toBe('');
  });

  it('replaces the untouched blank template', () => {
    store().addTemplate(bug());
    expect(store().templates).toHaveLength(1);
    expect(active()?.settings.name).toBe('Bug report');
  });

  it('adds templates after the active one and opens them', () => {
    store().updateSettings({ name: 'First' });
    const first = store().activeId;
    store().addTemplate(bug());
    const second = store().activeId;
    store().setActive(first);
    store().addTemplate();
    expect(store().templates.map((t) => t.uid)).toEqual([first, store().activeId, second]);
  });

  it('duplicates a template with new uids', () => {
    store().addTemplate(bug());
    const original = active()!;
    store().duplicateTemplate(original.uid);
    const copy = active()!;
    expect(copy.uid).not.toBe(original.uid);
    expect(copy.settings.name).toBe('Bug report (copy)');
    expect(copy.elements.map((e) => e.uid)).not.toEqual(original.elements.map((e) => e.uid));
    expect(copy.elements.map((e) => ('id' in e ? e.id : ''))).toEqual(
      original.elements.map((e) => ('id' in e ? e.id : '')),
    );
  });

  it('opens a neighbour when the active template is removed', () => {
    store().updateSettings({ name: 'First' });
    const first = store().activeId;
    store().addTemplate(bug());
    store().removeTemplate(store().activeId);
    expect(store().activeId).toBe(first);
  });

  it('always keeps one template', () => {
    store().removeTemplate(store().activeId);
    expect(store().templates).toHaveLength(1);
    expect(active()).toBeDefined();
  });
});

describe('editing', () => {
  it('only changes the active template', () => {
    store().updateSettings({ name: 'First' });
    const first = store().activeId;
    store().addTemplate(bug());
    store().updateSettings({ title: 'changed' });
    store().addElement(createElement('input'));
    const untouched = store().templates.find((t) => t.uid === first)!;
    expect(untouched.settings.title).toBe('');
    expect(untouched.elements).toEqual([]);
    expect(active()!.settings.title).toBe('changed');
  });

  it('ignores element actions while config.yml is open', () => {
    const before = store().templates;
    store().setActive(CONFIG_TAB);
    store().addElement(createElement('input'));
    store().updateSettings({ name: 'x' });
    expect(store().templates).toBe(before);
  });

  it('updates config.yml', () => {
    store().updateConfig({ blankIssuesEnabled: false });
    expect(store().config.blankIssuesEnabled).toBe(false);
  });
});
