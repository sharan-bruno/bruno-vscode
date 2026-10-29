import { Frame, Page, expect } from "@playwright/test";
import { test } from "./utils/fixtures";
import { closeEditorTabIfOpen, createCollectionV2, createFolder, createRequestV2, deleteRequestV2, dragItemIntoFolder, exportCollectionV2, expandFolder, fillRequestDetails, openBrunoSidebar, removeCollection, runCommand, saveRequestV2, sendRequest, takeScreenshot, useCollection } from "./utils/page/actions";

type KeyValue<T = string | number | boolean> = {
  [k: string]: T,
}

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
type RequestType = 'HTTP' | 'GraphQL' | 'gRPC' | `WebSocket`;
type FileFormat = 'yml' | 'bru';

// Text checks on the expanded latest timeline entry; `true` just opens it.
export type TimelineCheck = true | {
  contains?: (string | RegExp)[],
  notContains?: (string | RegExp)[],
}

type RequestConfig<EnvName extends string = string> = {
  name: string;
  url: string;
  params?: KeyValue[],
  headers?: KeyValue[],
  payload?: string;
  type: RequestType,
  method: RequestMethod
  run: boolean,
  env?: NoInfer<EnvName>
  delete?: boolean;
  /** Folder the request is moved into once saved. */
  folder?: string;
}

type FolderConfig = {
  name: string,
  parent?: string,
}

export type AuthMode = 'inherit' | 'none' | 'basic' | 'bearer' | 'digest' | 'ntlm' | 'wsse' | 'apikey' | 'awsv4';
export type AuthFields = {
  username?: string, password?: string, token?: string,
  accessKeyId?: string, secretAccessKey?: string, service?: string, region?: string,
  key?: string, value?: string, addTo?: 'header' | 'query',
};

type EnvConfig<EnvName extends string = string> = {
  name: EnvName,
  vars: { [k: string]: string }[]
}

type CollectionConfig<EnvName extends string = string> = {
  format: FileFormat,
  name: string,
  vars?: KeyValue[],
  folders?: FolderConfig[],
  requests: RequestConfig<EnvName>[]
  export?: boolean
} | string /* fixture path */

type Config<EnvName extends string = string> = {
  collections: CollectionConfig<EnvName>[];
  envs?: EnvConfig<EnvName>[]
}


// What the auth actions need to find their targets; `requests` tells a request apart from a folder.
export type LifecycleCtx = { page: Page, sidebar: Frame, collection: string, requests: string[] }

export async function performE2E<const EnvName extends string = never>(config: Config<EnvName>, page: Page) {
  const collections = config.collections;
  const sidebar = await openBrunoSidebar(page);

  for (const [index, collection] of collections.entries()) {
    if (typeof collection === 'string') {
      // import collection
    } else {
      const ctx = await createCollectionV2(page, sidebar, collection.name, index !== 0, collection.format)

      for (const folder of collection.folders ?? []) {
        await createFolder(sidebar, folder.parent ?? collection.name, folder.name, !folder.parent)
      }

      for (const request of collection.requests) {
        const requestWebview = await createRequestV2(page, sidebar, ctx, collection.name, request.type, request.method)
        await fillRequestDetails(requestWebview, ctx, request.url, request.payload, request.params, request.headers)

        if (request.run) {
          await sendRequest(requestWebview, 200)
        }

        await saveRequestV2(page, requestWebview, ctx, request.name, true)

        if (request.folder) {
          // saveRequestV2 always saves at the collection root, so move the request into its folder.
          await closeEditorTabIfOpen(page, request.name)
          await dragItemIntoFolder(sidebar, request.name, request.folder)
          await expandFolder(sidebar, request.folder)
        }
      }

      // Delete only after every request is saved, so deletes don't shift the "Untitled N" titles.
      const requestsToDelete = collection.requests.filter((request) => request.delete);
      for (const request of requestsToDelete) {
        await deleteRequestV2(page, sidebar, ctx, request.name, collection.format)
      }

      if (collection.export) {
        const exported = await exportCollectionV2(page, sidebar, ctx)

        // verify the export reflects the deletes
        const exportedNames = (exported.items ?? []).map((item: { name: string }) => item.name);
        const remainingNames = collection.requests.filter((request) => !request.delete).map((request) => request.name);
        expect(exportedNames.sort()).toEqual(remainingNames.sort());
      }
    }
  }
}

export type Workspace = Parameters<typeof performE2E>[0];

type LifecycleSuite = {
  desc: string;
  workspace: Workspace;
  run: () => Promise<void>;
};

/** Registers one test that runs each suite as a step on its own fresh collection, in a single VS Code launch. */
export function runLifecycle(title: string, suites: LifecycleSuite[], { timeoutMs = 15 * 60_000 } = {}) {
  test.use({ vscodeSettings: { 'files.simpleDialog.enable': true, 'window.dialogStyle': 'custom' } });

  test(title, async ({ page }) => {
    test.setTimeout(timeoutMs);

    for (const { desc, workspace, run } of suites) {
      await test.step(desc, async () => {
        await performE2E(workspace, page);

        const sidebar = await openBrunoSidebar(page);
        const [collection] = workspace.collections.filter((entry) => typeof entry !== 'string');

        useCollection({ page, sidebar, collection: collection.name, requests: collection.requests.map((request) => request.name) });
        await run();

        await runCommand(page, 'View: Close All Editors');
        await removeCollection(page, sidebar, collection.name);
      });
    }

    await test.step('Screenshot', async () => {
      await takeScreenshot(page, test);
    });
  });
}
