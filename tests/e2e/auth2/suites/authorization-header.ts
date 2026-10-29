import { Workspace } from '../../e2e-helper';
import { setAuth, sendAndExpect } from '../../utils/page/actions';

// /headers answers 200 whatever is sent, so the timeline is what shows whether auth went out.
export const workspace: Workspace = {
  collections: [
    {
      name: 'authorization-header-collection',
      format: 'yml',
      requests: [
        { name: 'headers-request', url: 'https://testbench-sanity.usebruno.com/headers', type: 'HTTP', method: 'GET', run: false },
      ],
    },
  ],
};

export const desc = 'Authorization header is sent when auth is set and dropped with No Auth';

export async function run() {
  await setAuth('headers-request', 'basic', { username: 'bruno', password: 'della' });
  await sendAndExpect('headers-request', 200, { contains: [/authorization/i] });

  await setAuth('headers-request', 'bearer', { token: 'your_secret_token' });
  await sendAndExpect('headers-request', 200, { contains: [/authorization/i] });

  await setAuth('headers-request', 'none');
  await sendAndExpect('headers-request', 200, { notContains: [/authorization/i] });
}
