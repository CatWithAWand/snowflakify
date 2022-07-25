/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/no-extraneous-dependencies */

// This file is needed to make worker_threads work with TypeScript
// in a development environment.

const path = require('path');

require('ts-node').register();

require(path.resolve(__dirname, 'worker.ts'));
