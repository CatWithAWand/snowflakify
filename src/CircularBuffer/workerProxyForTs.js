/* eslint-disable import/no-dynamic-require */
/* eslint-disable import/no-extraneous-dependencies */

// This file is needed to make worker_threads work with TypeScript
// in a development environment.

import path from 'path';

import('ts-node').register();

import(path.resolve(path.dirname('worker.ts')));
