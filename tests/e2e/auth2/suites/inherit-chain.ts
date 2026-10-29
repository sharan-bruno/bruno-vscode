import { Workspace } from '../../e2e-helper';
import { setAuth, expectInherited, sendAndExpect, collectionName } from '../../utils/page/actions';

export const desc = 'Inherit resolves to the nearest parent and stops at a No Auth folder';

export const workspace: Workspace = {
  collections: [
    {
      name: 'effective-auth-mode-collection',
      format: 'yml',
      folders: [
        { name: 'folder-1' },
        { name: 'folder-2', parent: 'folder-1' },
        { name: 'folder-3', parent: 'folder-2' },
      ],
      requests: [
        {
          name: 'protected-request',
          url: 'https://testbench-sanity.usebruno.com/api/auth/basic/protected',
          type: 'HTTP',
          method: 'POST',
          run: false,
          folder: 'folder-1',
        },
      ],
    },
  ],
};

export async function run() {
  // The collection, folder-1 and folder-2 are Basic Auth; folder-3 inherits from folder-2, not folder-1
  await setAuth(collectionName, 'basic', { username: 'bruno', password: 'della' });
  await setAuth('folder-1', 'basic');
  await setAuth('folder-2', 'basic');
  await setAuth('folder-3', 'inherit');
  await setAuth('protected-request', 'inherit');
  await expectInherited('folder-3', 'folder-2', 'Basic Auth');

  // folder-1 is Basic Auth without credentials, so the request is sent but rejected
  await expectInherited('protected-request', 'folder-1', 'Basic Auth');
  await sendAndExpect('protected-request', 401, true);

  // folder-1 No Auth stops the chain: no Authorization header is sent
  await setAuth('folder-1', 'none');
  await setAuth('protected-request', 'inherit');
  await expectInherited('protected-request', 'folder-1', 'No Auth');
  await sendAndExpect('protected-request', 401, { notContains: [/authorization/i] });

  // folder-1 back to Inherit: the request inherits Basic Auth from the collection
  await setAuth('folder-1', 'inherit');
  await expectInherited('protected-request', 'Collection', 'Basic Auth');
  await sendAndExpect('protected-request', 200);
}
