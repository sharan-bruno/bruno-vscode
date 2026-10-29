import { expect } from '@playwright/test';
import { dragItemIntoFolder, expandFolder, setAuth, expectInherited, page, sidebar } from '../../utils/page/actions';
import { Workspace } from '../../e2e-helper';

export const desc = 'Moving a request to another folder changes where it inherits auth from';

export const workspace: Workspace = {
  collections: [
    {
      name: 'move-request-between-folders-collection',
      format: 'yml',
      folders: [
        { name: 'move-folder-a' },
        { name: 'move-folder-b' },
      ],
      requests: [
        { name: 'move-request', url: 'https://testbench-sanity.usebruno.com/headers', type: 'HTTP', method: 'GET', run: false, folder: 'move-folder-a' },
      ],
    },
  ],
};

export async function run() {
  await setAuth('move-folder-a', 'basic');
  await setAuth('move-folder-b', 'bearer', { token: 'your_secret_token' });
  await setAuth('move-request', 'inherit');
  await expectInherited('move-request', 'move-folder-a', 'Basic Auth');

  // The request is still open in its editor while it is dragged, as it would be for a user
  await dragItemIntoFolder(sidebar, 'move-request', 'move-folder-b');
  // The sidebar updates a moment after the drop. Until then the old row is still there, and opening it would
  // open the old path. The old folder showing "Add request" means it is empty, so the move has gone through.
  await expect(sidebar.getByText('Add request')).toBeVisible();
  await expandFolder(sidebar, 'move-folder-b');

  await expectInherited('move-request', 'move-folder-b', 'Bearer Token');
}
