import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { createEmptyForm, duplicateElement } from '../lib/elements';
import type { FormElement, FormSettings, IssueForm } from '../lib/types';

interface FormState extends IssueForm {
  updateSettings: (patch: Partial<FormSettings>) => void;
  addElement: (element: FormElement, index?: number) => void;
  updateElement: (element: FormElement) => void;
  removeElement: (uid: string) => void;
  duplicateElement: (uid: string) => void;
  moveElement: (fromIndex: number, toIndex: number) => void;
  /** Replaces the whole form, e.g. after an import or when a template is chosen. */
  loadForm: (form: IssueForm) => void;
}

const STORAGE_KEY = 'issue-form-generator:form';

export const useFormStore = create<FormState>()(
  persist(
    (set) => ({
      ...createEmptyForm(),

      updateSettings: (patch) => set((state) => ({ settings: { ...state.settings, ...patch } })),

      addElement: (element, index) =>
        set((state) => {
          const elements = [...state.elements];
          elements.splice(index ?? elements.length, 0, element);
          return { elements };
        }),

      updateElement: (element) =>
        set((state) => ({
          elements: state.elements.map((e) => (e.uid === element.uid ? element : e)),
        })),

      removeElement: (uid) =>
        set((state) => ({ elements: state.elements.filter((e) => e.uid !== uid) })),

      duplicateElement: (uid) =>
        set((state) => {
          const index = state.elements.findIndex((e) => e.uid === uid);
          if (index === -1) return {};
          const ids = state.elements.flatMap((e) => (e.type === 'markdown' ? [] : [e.id]));
          const elements = [...state.elements];
          elements.splice(index + 1, 0, duplicateElement(state.elements[index], ids));
          return { elements };
        }),

      moveElement: (fromIndex, toIndex) =>
        set((state) => {
          const elements = [...state.elements];
          const [moved] = elements.splice(fromIndex, 1);
          elements.splice(toIndex, 0, moved);
          return { elements };
        }),

      loadForm: (form) => set({ settings: form.settings, elements: form.elements }),
    }),
    {
      name: STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ settings: state.settings, elements: state.elements }),
    },
  ),
);

/** Selects only the data part of the store (no actions). */
export function selectForm(state: FormState): IssueForm {
  return { settings: state.settings, elements: state.elements };
}
