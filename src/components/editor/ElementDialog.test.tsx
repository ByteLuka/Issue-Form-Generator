import { screen, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { DropdownElement, InputElement } from '../../lib/types';
import { useWorkspaceStore } from '../../store/workspaceStore';
import { renderWithProviders } from '../../test/render';
import { ElementList } from './ElementList';

const store = () => useWorkspaceStore.getState();
const elements = () => store().templates.find((t) => t.uid === store().activeId)!.elements;

beforeEach(() => store().resetWorkspace());

/** Opens the type picker and chooses a type. Returns the element dialog. */
async function startAdding(user: ReturnType<typeof renderWithProviders>['user'], type: string) {
  await user.click(screen.getByRole('button', { name: 'Add element' }));
  await user.click(screen.getByRole('button', { name: type }));
  return screen.getByRole('dialog');
}

describe('element dialog', () => {
  it('adds a dropdown through all steps', async () => {
    const { user } = renderWithProviders(<ElementList />);
    const dialog = await startAdding(user, 'Dropdown');

    // Step 1: basics. The id follows the label.
    await user.type(within(dialog).getByRole('textbox', { name: 'Label' }), 'Operating system');
    expect(within(dialog).getByRole('textbox', { name: 'Id' })).toHaveValue('operating-system');
    await user.click(within(dialog).getByRole('button', { name: 'Next' }));

    // Step 2: options. Enter moves to a new option.
    await user.type(within(dialog).getByRole('textbox', { name: 'Option 1' }), 'Linux{Enter}macOS');
    await user.type(within(dialog).getByRole('textbox', { name: 'Option 2' }), '{Enter}Windows');
    await user.click(within(dialog).getByRole('switch', { name: 'Allow multiple selections' }));
    await user.click(within(dialog).getByRole('button', { name: 'Next' }));

    // Step 3: validation.
    await user.click(within(dialog).getByRole('switch', { name: /Required/ }));
    await user.click(within(dialog).getByRole('button', { name: 'Add to form' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(elements()).toHaveLength(1);
    const dropdown = elements()[0] as DropdownElement;
    expect(dropdown).toMatchObject({
      type: 'dropdown',
      id: 'operating-system',
      label: 'Operating system',
      options: ['Linux', 'macOS', 'Windows'],
      multiple: true,
      required: true,
    });
    expect(screen.getByText('Operating system')).toBeInTheDocument();
  });

  it('does not continue without a label', async () => {
    const { user } = renderWithProviders(<ElementList />);
    const dialog = await startAdding(user, 'Input');

    await user.click(within(dialog).getByRole('button', { name: 'Next' }));

    expect(within(dialog).getByText('A label is required.')).toBeInTheDocument();
    expect(within(dialog).getByRole('textbox', { name: 'Label' })).toBeInTheDocument();
  });

  it('discards changes on cancel', async () => {
    const { user } = renderWithProviders(<ElementList />);
    const dialog = await startAdding(user, 'Input');

    await user.type(within(dialog).getByRole('textbox', { name: 'Label' }), 'Version');
    await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

    expect(elements()).toEqual([]);
  });

  it('rejects an id that is already used', async () => {
    store().addElement({
      uid: 'existing',
      type: 'input',
      id: 'version',
      label: 'Version',
      description: '',
      required: false,
      placeholder: '',
      value: '',
      minLength: null,
    });
    const { user } = renderWithProviders(<ElementList />);
    const dialog = await startAdding(user, 'Input');

    await user.type(within(dialog).getByRole('textbox', { name: 'Label' }), 'Version');
    await user.click(within(dialog).getByRole('button', { name: 'Next' }));

    expect(within(dialog).getByText('Another element already uses this id.')).toBeInTheDocument();
  });

  it('edits an existing element and jumps directly to a step', async () => {
    store().addElement({
      uid: 'existing',
      type: 'input',
      id: 'version',
      label: 'Version',
      description: '',
      required: false,
      placeholder: '',
      value: '',
      minLength: null,
    });
    const { user } = renderWithProviders(<ElementList />);

    await user.click(screen.getByRole('button', { name: 'Edit' }));
    const dialog = screen.getByRole('dialog');
    await user.click(within(dialog).getByRole('button', { name: /Validation/ }));
    await user.type(within(dialog).getByRole('textbox', { name: 'Minimum length' }), '5');
    await user.click(within(dialog).getByRole('button', { name: 'Save' }));

    expect((elements()[0] as InputElement).minLength).toBe(5);
    // Editing keeps the id even though it no longer follows the label.
    expect((elements()[0] as InputElement).id).toBe('version');
  });

  it('adds markdown in a single step', async () => {
    const { user } = renderWithProviders(<ElementList />);
    const dialog = await startAdding(user, 'Markdown');

    expect(within(dialog).queryByRole('button', { name: 'Next' })).not.toBeInTheDocument();
    await user.type(within(dialog).getByRole('textbox', { name: 'Markdown' }), 'Thanks!');
    await user.click(within(dialog).getByRole('button', { name: 'Add to form' }));

    expect(elements()).toMatchObject([{ type: 'markdown', value: 'Thanks!' }]);
  });
});
