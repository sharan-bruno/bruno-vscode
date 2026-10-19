import { test, expect } from '../../utils/fixtures';
import {
  activeEditor,
  openBrunoSidebar,
  createCollection,
  openNewRequestPanel,
  createRequest,
  openRequest,
  saveRequest,
  selectAuthMode,
  selectRequestPaneTab,
  selectResponsePaneTab,
  sendRequest,
  setCodeMirrorValue
} from '../../utils/page/actions';
import { buildCommonLocators } from '../../utils/page/locators';

test.describe('AWS Signature V4 auth', () => {
  test('Signs the request and shows the authentication in the timeline', async ({ page, tmpDir }) => {
    const collectionName = 'aws-sigv4-collection';
    const requestName = 'signed-request';
    const sidebar = await openBrunoSidebar(page);
    const locators = buildCommonLocators(activeEditor(page));

    await test.step('Create a collection and a request', async () => {
      await createCollection(page, sidebar, collectionName, tmpDir);
      const panel = await openNewRequestPanel(page, sidebar, collectionName);
      await createRequest(page, panel, sidebar, collectionName, requestName, 'http://127.0.0.1:8081/ping');
    });

    await test.step('Set auth type as AWS Sig V4 and fill in the credentials', async () => {
      await openRequest(page, sidebar, collectionName, requestName);
      await selectRequestPaneTab(page, 'Auth');
      await selectAuthMode(page, 'AWS Sig V4');
      await setCodeMirrorValue(page, locators.auth.awsAccessKeyIdEditor(), 'AKIAIOSFODNN7EXAMPLE');
      await setCodeMirrorValue(page, locators.auth.awsSecretAccessKeyEditor(), 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY');
      await setCodeMirrorValue(page, locators.auth.awsServiceEditor(), 'execute-api');
      await setCodeMirrorValue(page, locators.auth.awsRegionEditor(), 'us-east-1');
      await saveRequest(page);
    });

    await test.step('Send the request and verify the response status code is 200', async () => {
      const editor = await openRequest(page, sidebar, collectionName, requestName);
      await sendRequest(editor, 200);
    });

    await test.step('Open the latest timeline entry and verify the signature headers were sent', async () => {
      await selectResponsePaneTab(page, 'Timeline');
      const timelineItem = locators.timeline.lastItem();
      await locators.timeline.itemHeader(timelineItem).click();
      const requestPanel = locators.timeline.requestPanel(timelineItem);
      await expect(requestPanel).toContainText('Authorization');
      await expect(requestPanel).toContainText('AWS4-HMAC-SHA256');
      await expect(requestPanel).toContainText('X-Amz-Date');
    });
  });
});
