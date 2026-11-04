import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import type { Template } from '../lib/types';
import { isTemplateEmpty } from '../lib/workspace';
import { validateWorkspace, type ValidationIssue } from '../lib/validate';
import { CONFIG_TAB, useWorkspaceStore } from './workspaceStore';

/** The template open in the editor, or `null` while config.yml is open. */
export function useActiveTemplate(): Template | null {
  return useWorkspaceStore((s) => s.templates.find((t) => t.uid === s.activeId) ?? null);
}

/** Like `useActiveTemplate`, for components that are only rendered while a template is open. */
export function useIssueForm(): Template {
  const template = useActiveTemplate();
  if (!template) throw new Error('useIssueForm() used while no template is active');
  return template;
}

export function useIsConfigActive(): boolean {
  return useWorkspaceStore((s) => s.activeId === CONFIG_TAB);
}

/** Templates and config without actions; changes only when the data changes. */
export function useWorkspace() {
  return useWorkspaceStore(useShallow((s) => ({ templates: s.templates, config: s.config })));
}

/** Validation issues of the whole workspace, recomputed only when it changes. */
export function useWorkspaceValidation(): ValidationIssue[] {
  const workspace = useWorkspace();
  return useMemo(() => validateWorkspace(workspace), [workspace]);
}

/** Issues of the template or config.yml that is open in the editor. */
export function useValidation(): ValidationIssue[] {
  const issues = useWorkspaceValidation();
  const activeId = useWorkspaceStore((s) => s.activeId);
  return useMemo(() => issues.filter((i) => i.scope === activeId), [issues, activeId]);
}

/** True when nothing would be lost by resetting the workspace. */
export function useIsWorkspaceEmpty(): boolean {
  return useWorkspaceStore(
    (s) => s.config.contactLinks.length === 0 && s.templates.every(isTemplateEmpty),
  );
}
