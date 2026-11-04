import { useMemo } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { validateForm } from '../lib/validate';
import { selectForm, useFormStore } from './formStore';

/** The current form data (settings + elements). */
export function useIssueForm() {
  return useFormStore(useShallow(selectForm));
}

/** Validation issues for the current form, recomputed only when the form changes. */
export function useValidation() {
  const form = useIssueForm();
  return useMemo(() => validateForm(form), [form]);
}

export function useIsFormEmpty() {
  return useFormStore(
    (state) =>
      state.elements.length === 0 &&
      !state.settings.name.trim() &&
      !state.settings.description.trim(),
  );
}
