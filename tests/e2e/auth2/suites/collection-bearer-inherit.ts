import { Workspace } from '../../e2e-helper';
import { setAuth, expectInherited, sendAndExpect, collectionName } from '../../utils/page/actions';

export const workspace: Workspace = {
  collections: [
    {
      name: 'collection-bearer-inherit-collection',
      format: 'yml',
      requests: [
        { name: 'inherit-bearer-request', url: 'https://testbench-sanity.usebruno.com/api/auth/bearer/protected', type: 'HTTP', method: 'GET', run: false },
      ],
    },
  ],
};

export const desc = 'Collection-level Bearer Token is inherited by a request, and removed with No Auth';

export async function run() {
  await setAuth('inherit-bearer-request', 'inherit');

  await setAuth(collectionName, 'bearer', { token: 'wrong-token' });
  await expectInherited('inherit-bearer-request', 'Collection', 'Bearer Token');
  await sendAndExpect('inherit-bearer-request', 401);

  await setAuth(collectionName, 'bearer', { token: 'your_secret_token' });
  await expectInherited('inherit-bearer-request', 'Collection', 'Bearer Token');
  await sendAndExpect('inherit-bearer-request', 200);

  // No Auth on the collection: the request inherits nothing and sends no Authorization header
  await setAuth(collectionName, 'none');
  await expectInherited('inherit-bearer-request', 'Collection', 'No Auth');
  await sendAndExpect('inherit-bearer-request', 401, { notContains: [/authorization/i] });
}
