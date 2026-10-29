import { runLifecycle } from '../e2e-helper';

import * as inheritChain from './suites/inherit-chain';
import * as collectionBearerInherit from './suites/collection-bearer-inherit';
import * as authorizationHeader from './suites/authorization-header';
import * as authTabIndicator from './suites/auth-tab-indicator';
import * as authTypes from './suites/auth-types';
import * as reopenKeepsAuth from './suites/reopen-keeps-auth';
import * as inheritAllAuthTypes from './suites/inherit-all-auth-types';
import * as siblingFolderIsolation from './suites/sibling-folder-isolation';
import * as authModeSurvivesReopen from './suites/auth-mode-survives-reopen';

// These suites run in order in one VS Code launch. To add a case, create a suite in ./suites and list it here.
runLifecycle('auth lifecycle', [
  // Inheritance
  inheritChain,
  collectionBearerInherit,
  inheritAllAuthTypes,
  siblingFolderIsolation,

  // Auth types
  authTypes,

  // What is sent
  authorizationHeader,

  // UI and persistence
  authTabIndicator,
  reopenKeepsAuth,
  authModeSurvivesReopen,
]);
