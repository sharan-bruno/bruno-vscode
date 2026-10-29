import { expect } from '@playwright/test';
import { Workspace } from '../../e2e-helper';
import { activeEditor, setAuth, sendAndExpect, page } from '../../utils/page/actions';
import { buildCommonLocators } from '../../utils/page/locators';
import { TEST_SERVER_LOCAL_URL } from '../../utils/urls';

const accessKeyId = 'AKIAIOSFODNN7EXAMPLE';

// Basic, Bearer and Cookie use the remote test server. AWS Sig v4 and API Key use the local one, which echoes
// what it receives.
export const workspace: Workspace = {
  collections: [
    {
      name: 'auth-types-collection',
      format: 'yml',
      requests: [
        { name: 'basic-request', url: 'https://testbench-sanity.usebruno.com/api/auth/basic/protected', type: 'HTTP', method: 'POST', run: false },
        { name: 'bearer-request', url: 'https://testbench-sanity.usebruno.com/api/auth/bearer/protected', type: 'HTTP', method: 'GET', run: false },
        { name: 'cookie-protected', url: 'https://testbench-sanity.usebruno.com/api/auth/cookie/protected', type: 'HTTP', method: 'GET', run: false },
        { name: 'cookie-login', url: 'https://testbench-sanity.usebruno.com/api/auth/cookie/login', type: 'HTTP', method: 'POST', run: false },
        { name: 'aws-request', url: `${TEST_SERVER_LOCAL_URL}/api/echo/auth`, type: 'HTTP', method: 'GET', run: false },
        { name: 'api-key-header-request', url: `${TEST_SERVER_LOCAL_URL}/headers`, type: 'HTTP', method: 'GET', run: false },
        { name: 'api-key-query-request', url: `${TEST_SERVER_LOCAL_URL}/api/echo/query`, type: 'HTTP', method: 'GET', run: false },
      ],
    },
  ],
};

export const desc = 'Basic, Bearer, Cookie, AWS Sig v4 and API Key each send what the server expects';

export async function run() {
  // Don't rely on a new request's default auth: the cookie requests must send no Authorization header
  await setAuth('cookie-protected', 'none');
  await setAuth('cookie-login', 'none');

  const response = () => buildCommonLocators(activeEditor(page)).response.previewContainer();

  // Basic Auth: a wrong password is rejected, the actual credentials are accepted
  await setAuth('basic-request', 'basic', { username: 'bruno', password: 'wrong' });
  await sendAndExpect('basic-request', 401);
  await setAuth('basic-request', 'basic', { username: 'bruno', password: 'della' });
  await sendAndExpect('basic-request', 200);

  // // Bearer Token: a wrong token is rejected, the actual token is accepted
  await setAuth('bearer-request', 'bearer', { token: 'wrong-token' });
  await sendAndExpect('bearer-request', 401);
  await setAuth('bearer-request', 'bearer', { token: 'your_secret_token' });
  await sendAndExpect('bearer-request', 200);

  // Cookie: rejected before login, accepted after the login cookie is stored
  await sendAndExpect('cookie-protected', 401);
  await sendAndExpect('cookie-login', 200);
  await sendAndExpect('cookie-protected', 200);

  // AWS Sig v4: the request is signed and the server receives the Authorization header
  await setAuth('aws-request', 'awsv4', {
    accessKeyId,
    secretAccessKey: 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY',
    service: 'execute-api',
    region: 'us-east-1',
  });
  await sendAndExpect('aws-request', 200);
  await expect(response()).toContainText(`AWS4-HMAC-SHA256 Credential=${accessKeyId}/`);

  // API Key added to the headers (the default "Add To")
  await setAuth('api-key-header-request', 'apikey', { key: 'x-api-key', value: 'header-secret-123' });
  await sendAndExpect('api-key-header-request', 200);
  await expect(response()).toContainText('x-api-key');
  await expect(response()).toContainText('header-secret-123');

  // API Key added to the query params
  await setAuth('api-key-query-request', 'apikey', { key: 'api_key', value: 'query-secret-456', addTo: 'query' });
  await sendAndExpect('api-key-query-request', 200);
  await expect(response()).toContainText('api_key');
  await expect(response()).toContainText('query-secret-456');
}
