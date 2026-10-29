import { Workspace } from '../../e2e-helper';
import { setAuth, expectInherited, collectionName, authModeLabels } from '../../utils/page/actions';

export const desc = 'A request inherits each auth type from a folder and from the collection';

const authTypes = ['basic', 'bearer', 'digest', 'wsse', 'apikey'] as const;

export const workspace: Workspace = {
  collections: [
    {
      name: 'inherit-all-types-collection',
      format: 'yml',
      folders: [
        { name: 'all-types-folder' },
      ],
      requests: [
        { name: 'all-types-request', url: 'https://testbench-sanity.usebruno.com/headers', type: 'HTTP', method: 'GET', run: false, folder: 'all-types-folder' },
      ],
    },
  ],
};

export async function run() {
  await setAuth(collectionName, 'none');
  await setAuth('all-types-request', 'inherit');
  for (const mode of authTypes) {
    await setAuth('all-types-folder', mode);
    await expectInherited('all-types-request', 'all-types-folder', authModeLabels[mode]);
  }

  // With the folder passing it up, the collection's auth type is what the request shows
  await setAuth('all-types-folder', 'inherit');
  for (const mode of authTypes) {
    await setAuth(collectionName, mode);
    await expectInherited('all-types-request', 'Collection', authModeLabels[mode]);
  }
}
