import { Workspace } from '../../e2e-helper';
import { setAuth, sendAndExpect, reopenRequestAuth, expectAuthMode } from '../../utils/page/actions';

export const desc = 'Saved request auth is still there after closing and reopening the request';

export const workspace: Workspace = {
  collections: [
    {
      name: 'reopen-keeps-auth-collection',
      format: 'yml',
      requests: [
        { name: 'reopen-request', url: 'https://testbench-sanity.usebruno.com/api/auth/bearer/protected', type: 'HTTP', method: 'GET', run: false },
      ],
    },
  ],
};

export async function run() {
  await setAuth('reopen-request', 'bearer', { token: 'your_secret_token' });

  await reopenRequestAuth('reopen-request');

  await expectAuthMode('Bearer Token');
  // The token field is masked, so prove the saved token by sending: the endpoint only accepts the real one
  await sendAndExpect('reopen-request', 200);
}
