import {
  IconCheckbox,
  IconCursorText,
  IconFileUpload,
  IconMarkdown,
  IconSelector,
  IconTextSize,
  type Icon,
} from '@tabler/icons-react';
import type { ElementType } from '../lib/types';

export const ELEMENT_ICONS: Record<ElementType, Icon> = {
  markdown: IconMarkdown,
  input: IconCursorText,
  textarea: IconTextSize,
  dropdown: IconSelector,
  checkboxes: IconCheckbox,
  upload: IconFileUpload,
};

export const ELEMENT_COLORS: Record<ElementType, string> = {
  markdown: 'gray',
  input: 'blue',
  textarea: 'cyan',
  dropdown: 'violet',
  checkboxes: 'teal',
  upload: 'orange',
};
