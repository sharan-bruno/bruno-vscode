import { Workspace } from '../../e2e-helper';
import { setAuth, expectInherited, collectionName } from '../../utils/page/actions';

export const desc = 'Auth set on one folder does not leak into its sibling folder';

export const workspace: Workspace = {
  collections: [
    {
      name: 'sibling-folder-isolation-collection',
      format: 'yml',
      folders: [
        { name: 'sibling-a' },
        { name: 'sibling-b' },
      ],
      requests: [
        { name: 'sibling-a-request', url: 'https://testbench-sanity.usebruno.com/headers', type: 'HTTP', method: 'GET', run: false, folder: 'sibling-a' },
        { name: 'sibling-b-request', url: 'https://testbench-sanity.usebruno.com/headers', type: 'HTTP', method: 'GET', run: false, folder: 'sibling-b' },
      ],
    },
  ],
};

export async function run() {
  await setAuth(collectionName, 'none');
  await setAuth('sibling-a', 'basic');
  await setAuth('sibling-a-request', 'inherit');
  await setAuth('sibling-b', 'inherit');
  await setAuth('sibling-b-request', 'inherit');
  await expectInherited('sibling-a-request', 'sibling-a', 'Basic Auth');
  await expectInherited('sibling-b-request', 'Collection', 'No Auth');

  // Changing the sibling must not touch the first folder's request
  await setAuth('sibling-b', 'bearer');
  await expectInherited('sibling-b-request', 'sibling-b', 'Bearer Token');
  await expectInherited('sibling-a-request', 'sibling-a', 'Basic Auth');
}
