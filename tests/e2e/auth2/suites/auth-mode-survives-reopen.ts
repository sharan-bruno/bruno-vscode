import { Workspace } from '../../e2e-helper';
import { setAuth, reopenRequestAuth, expectAuthMode } from '../../utils/page/actions';

// `shown` is how the selected mode is spelled afterwards.
const authTypes = [
  { mode: 'digest', shown: 'Digest Auth' },
  { mode: 'ntlm', shown: 'NTLM' },
  { mode: 'wsse', shown: 'WSSE Auth' },
  { mode: 'apikey', shown: 'API Key' },
  { mode: 'awsv4', shown: 'AWS Sig V4' },
] as const;

export const workspace: Workspace = {
  collections: [
    {
      name: 'auth-mode-survives-reopen-collection',
      format: 'yml',
      requests: [
        { name: 'mode-reopen-request', url: 'https://testbench-sanity.usebruno.com/headers', type: 'HTTP', method: 'GET', run: false },
      ],
    },
  ],
};

export const desc = 'Every auth type chosen on a request is still selected after closing and reopening it';

export async function run() {
  for (const { mode, shown } of authTypes) {
    await setAuth('mode-reopen-request', mode);

    await reopenRequestAuth('mode-reopen-request');
    await expectAuthMode(shown);
  }
}
