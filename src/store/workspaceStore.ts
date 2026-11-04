import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createUid, duplicateElement } from '../lib/elements';
import type {
  ChooserConfig,
  FormElement,
  FormSettings,
  IssueForm,
  Template,
  Workspace,
} from '../lib/types';
import {
  createDefaultConfig,
  createTemplate,
  createWorkspace,
  isTemplateEmpty,
} from '../lib/workspace';

/** `activeId` value when config.yml is open in the editor. */
export const CONFIG_TAB = 'config';

export interface WorkspaceData extends Workspace {
  /** uid of the template being edited, or `CONFIG_TAB`. */
  activeId: string;
}

export interface WorkspaceState extends WorkspaceData {
  // Template management
  setActive: (id: string) => void;
  /** Adds a template after the active one and opens it. An untouched empty active template is replaced. */
  addTemplate: (form?: IssueForm) => void;
  duplicateTemplate: (uid: string) => void;
  removeTemplate: (uid: string) => void;

  // Editing the active template (no-ops while config.yml is open)
  updateSettings: (patch: Partial<FormSettings>) => void;
  setFileName: (fileName: string) => void;
  addElement: (element: FormElement, index?: number) => void;
  updateElement: (element: FormElement) => void;
  removeElement: (uid: string) => void;
  duplicateElement: (uid: string) => void;
  moveElement: (fromIndex: number, toIndex: number) => void;

  // config.yml
  updateConfig: (patch: Partial<ChooserConfig>) => void;

  /** Replaces everything with a fresh workspace (one blank template, default config). */
  resetWorkspace: () => void;
}

const STORAGE_KEY = 'issue-form-generator:form';
const STORAGE_VERSION = 2;

function initialData(): WorkspaceData {
  const workspace = createWorkspace();
  return { ...workspace, activeId: workspace.templates[0].uid };
}

/** Applies `update` to the active template. */
function updateActive(
  state: WorkspaceState,
  update: (template: Template) => Partial<Template>,
): Partial<WorkspaceState> {
  if (!state.templates.some((t) => t.uid === state.activeId)) return {};
  return {
    templates: state.templates.map((t) => (t.uid === state.activeId ? { ...t, ...update(t) } : t)),
  };
}

/** Converts data saved by older versions. Exported for tests. */
export function migrate(persisted: unknown, version: number): WorkspaceData {
  if (version < 2) {
    // v1 stored a single form: { settings, elements }.
    const old = persisted as Partial<IssueForm> | undefined;
    if (!old?.settings || !old.elements) return initialData();
    const template = createTemplate({ settings: old.settings, elements: old.elements });
    return { templates: [template], config: createDefaultConfig(), activeId: template.uid };
  }
  return persisted as WorkspaceData;
}

export const useWorkspaceStore = create<WorkspaceState>()(
  persist(
    (set) => ({
      ...initialData(),

      setActive: (id) => set({ activeId: id }),

      addTemplate: (form) =>
        set((state) => {
          const template = createTemplate(form);
          const index = state.templates.findIndex((t) => t.uid === state.activeId);
          const replace = index !== -1 && isTemplateEmpty(state.templates[index]);
          const templates = [...state.templates];
          if (replace) templates[index] = template;
          else templates.splice(index === -1 ? templates.length : index + 1, 0, template);
          return { templates, activeId: template.uid };
        }),

      duplicateTemplate: (uid) =>
        set((state) => {
          const index = state.templates.findIndex((t) => t.uid === uid);
          if (index === -1) return {};
          const source = structuredClone(state.templates[index]);
          // Element ids only need to be unique within one template, so only the internal uids change.
          const copy = createTemplate({
            settings: { ...source.settings, name: `${source.settings.name} (copy)`.trim() },
            elements: source.elements.map((e) => ({ ...e, uid: createUid() })),
          });
          const templates = [...state.templates];
          templates.splice(index + 1, 0, copy);
          return { templates, activeId: copy.uid };
        }),

      removeTemplate: (uid) =>
        set((state) => {
          const index = state.templates.findIndex((t) => t.uid === uid);
          if (index === -1) return {};
          let templates = state.templates.filter((t) => t.uid !== uid);
          // There is always at least one template to edit.
          if (templates.length === 0) templates = [createTemplate()];
          const activeId =
            state.activeId === uid
              ? templates[Math.min(index, templates.length - 1)].uid
              : state.activeId;
          return { templates, activeId };
        }),

      updateSettings: (patch) =>
        set((state) => updateActive(state, (t) => ({ settings: { ...t.settings, ...patch } }))),

      setFileName: (fileName) => set((state) => updateActive(state, () => ({ fileName }))),

      addElement: (element, index) =>
        set((state) =>
          updateActive(state, (t) => {
            const elements = [...t.elements];
            elements.splice(index ?? elements.length, 0, element);
            return { elements };
          }),
        ),

      updateElement: (element) =>
        set((state) =>
          updateActive(state, (t) => ({
            elements: t.elements.map((e) => (e.uid === element.uid ? element : e)),
          })),
        ),

      removeElement: (uid) =>
        set((state) =>
          updateActive(state, (t) => ({ elements: t.elements.filter((e) => e.uid !== uid) })),
        ),

      duplicateElement: (uid) =>
        set((state) =>
          updateActive(state, (t) => {
            const index = t.elements.findIndex((e) => e.uid === uid);
            if (index === -1) return {};
            const ids = t.elements.flatMap((e) => (e.type === 'markdown' ? [] : [e.id]));
            const elements = [...t.elements];
            elements.splice(index + 1, 0, duplicateElement(t.elements[index], ids));
            return { elements };
          }),
        ),

      moveElement: (fromIndex, toIndex) =>
        set((state) =>
          updateActive(state, (t) => {
            const elements = [...t.elements];
            const [moved] = elements.splice(fromIndex, 1);
            elements.splice(toIndex, 0, moved);
            return { elements };
          }),
        ),

      updateConfig: (patch) => set((state) => ({ config: { ...state.config, ...patch } })),

      resetWorkspace: () => set(initialData()),
    }),
    {
      name: STORAGE_KEY,
      version: STORAGE_VERSION,
      storage: createJSONStorage(() => localStorage),
      partialize: (state): WorkspaceData => ({
        templates: state.templates,
        config: state.config,
        activeId: state.activeId,
      }),
      migrate,
    },
  ),
);
