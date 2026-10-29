import { expect } from '@playwright/test';
import { activeEditor, openRequest, selectRequestPaneTab, setAuth, page, sidebar, collectionName } from '../../utils/page/actions';
import { buildCommonLocators } from '../../utils/page/locators';
import { Workspace } from '../../e2e-helper';

export const workspace: Workspace = {
  collections: [
    {
      name: 'auth-tab-indicator-collection',
      format: 'yml',
      folders: [
        { name: 'indicator-folder' },
      ],
      requests: [
        { name: 'indicator-request', url: 'https://testbench-sanity.usebruno.com/headers', type: 'HTTP', method: 'GET', run: false, folder: 'indicator-folder' },
      ],
    },
  ],
};

export const desc = 'Auth tab dot reflects the effective auth for a folder and for a request';

export async function run() {
  await setAuth(collectionName, 'none');
  const locators = () => buildCommonLocators(activeEditor(page));
  const folderAuthTabDot = () => locators().paneTabs.folderSettingsTab('auth').getByTestId('status-dot-auth');
  const requestAuthTabDot = () => locators().tabs.byText('Auth').getByTestId('status-dot-auth');

  // setAuth leaves the folder's auth pane open, so the dot can be read straight after
  await setAuth('indicator-folder', 'basic');
  await expect(folderAuthTabDot()).toBeVisible();

  await setAuth('indicator-folder', 'inherit');
  await expect(folderAuthTabDot()).toBeHidden(); // inherits No Auth from the collection

  await setAuth('indicator-folder', 'none');
  await expect(folderAuthTabDot()).toBeHidden();

  await setAuth('indicator-request', 'inherit');
  await expect(requestAuthTabDot()).toBeHidden(); // inherits No Auth from the folder

  await setAuth('indicator-folder', 'basic');
  await openRequest(page, sidebar, collectionName, 'indicator-request');
  await selectRequestPaneTab(page, 'Auth');
  await expect(requestAuthTabDot()).toBeVisible(); // now inherits Basic Auth from the folder
}
