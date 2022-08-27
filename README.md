<a href="https://github.com/CatWithAWand/snowflakify">
  <p align="center">
    <img width=500 src="https://raw.githubusercontent.com/CatWithAWand/snowflakify/main/logo.svg"/>
  </p>
</a>

<p align="center">
	<a href="https://www.npmjs.com/package/snowflakify"><img src="https://img.shields.io/npm/v/snowflakify?style=flat" alt="snowflakify - npm" /></a>
  <a href="https://catwithawand.github.io/snowflakify/"><img src="https://img.shields.io/github/deployments/CatWithAWand/snowflakify/github-pages?label=github-pages&style=flat" alt="GitHub-pages deployment" /></a>
  <a href="http://commitizen.github.io/cz-cli/"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen?style=flat" alt="Commitizen friendly" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <br>
  <strong>A complete Snowflake ID generator in TypeScript. <br>
  Generation, destructuring, custom snowflake structure, and more...</strong>
</p>

---

<br>

## About

Snowflakify is a complete [Node.js](https://nodejs.org) module for distributed systems to generate [snowflake IDs](https://en.wikipedia.org/wiki/Snowflake_ID), written in [TypeScript](https://www.typescriptlang.org/).

- IDs based on worker threads/cluster, <br> machine IPv4/MAC addresses
- Circular/Ring Buffer for increased output
- Snowflake destructuring
- BigInt based
- Custom epoch
- Custom snowflake fragments <br>
  with customizable bit length:
  - Timestamp
  - Random
  - Worker ID
  - Process ID
  - IPv4 Address
  - MAC Address
  - Sequence

<br>

### Circular/Ring Buffer performance

| useBuffer | workerCount | Time Period (s) | Generated/Main | Generated/Workers | IDs/ms |
| :-------: | :---------: | :-------------: | :------------: | :---------------: | :----: |
|   false   |      0      |       10        |    3453950     |         0         | 345.4  |
|   true    |      1      |       10        |    1190497     |      5700275      | 689.1  |
|   true    |      2      |       10        |       0        |      8677260      | 867.7  |
|   true    |      3      |       10        |       0        |      9726306      | 972.6  |

<br><br>

## Installation

### Requires Node.js 14.5.0 or newer.

**npm:**

```bash
$ npm install snowflakify
```

**yarn:**

```bash
$ yarn add snowflakify
```

**pnpm:**

```bash
$ pnpm add snowflakify
```

<br><br>

## Usage

Creating a new Snowflakify ID generator

```js
import { Snowflakify } from 'snowflakify';

// with default options
const snowflakify = new Snowflakify();

// or with a custom epoch and one of the three presets
const CUSTOM_EPOCH = 1262304001000;
const snowflakify = new Snowflakify({ epoch: CUSTOM_EPOCH, preset: 'ipv4' });
```

Generating a snowflake ID

```js
snowflakify.nextId();
// 1000920566716264449n
```

Destructuring a snowflake ID

```js
const snowflakeId = snowflakify.nextId();
// 1000920566716264449n

snowflakify.destructure(snowflakeId);
// [
//   { identifier: 'TimestampFragment', value: 1658708459310n },
//   { identifier: 'WorkerFragment', value: 0 },
//   { identifier: 'ProcessFragment', value: 23 },
//   { identifier: 'SequenceFragment', value: 1 }
// ]
```

Creating a custom snowflake structure

```js
import {
  Snowflakify,
  TimestampFragment,
  NetworkFragment,
  SequenceFragment,
} from 'snowflakify';

const CUSTOM_EPOCH = 1262304001000;

const snowflakify = new Snowflakify({
  fragmentArray: [
    new TimestampFragment(42, CUSTOM_EPOCH),
    new NetworkFragment(10, 'ipv4'),
    new SequenceFragment(12),
  ],
});

const snowflakeId = snowflakify.nextId();
// 1662643509670989825n

snowflakify.destructure(snowflakeId);
// [
//   { identifier: 'TimestampFragment', value: 1658709104128n },
//   { identifier: 'NetworkFragment:ipv4', value: 197 },
//   { identifier: 'SequenceFragment', value: 1 }
// ]
```

<br><br>

> ## **Note:** Snowflakify must be instantiated inside the worker when working with worker_threads or cluster, else it won't be able to see the worker.

<br>

## Example with worker_threads

index.js

```js
import { Worker } from 'worker_threads';

const numWorkers = 3;

for (let i = 0; i < numWorkers; i += 1) {
  const worker = new Worker('./worker.js');

  worker.on('message', (msg) => {
    console.log(`Worker ${worker.threadId} generated snowflake:`);
    console.log(msg);
  });
}
```

worker.js

```js
import { parentPort } from 'worker_threads';
import { Snowflakify } from 'snowflakify';

const snowflakify = new Snowflakify();

const snowflakeId = () => {
  const snowflake = snowflakify.nextId();
  const destructuredSnowflake = snowflakify.destructure(snowflake);

  return {
    snowflake,
    destructuredSnowflake,
  };
};

parentPort.postMessage(snowflakeId());
```

Console output

```bash
Worker 1 generated snowflake:
{
  snowflake: 1001124197361188865n,
  destructuredSnowflake: [
    { identifier: 'TimestampFragment', value: 1658757008639n },
    { identifier: 'WorkerFragment', value: 1 },
    { identifier: 'ProcessFragment', value: 16 },
    { identifier: 'SequenceFragment', value: 1 }
  ]
}
Worker 2 generated snowflake:
{
  snowflake: 1001124197382291457n,
  destructuredSnowflake: [
    { identifier: 'TimestampFragment', value: 1658757008644n },
    { identifier: 'WorkerFragment', value: 2 },
    { identifier: 'ProcessFragment', value: 16 },
    { identifier: 'SequenceFragment', value: 1 }
  ]
}
Worker 3 generated snowflake:
{
  snowflake: 1001124197378228225n,
  destructuredSnowflake: [
    { identifier: 'TimestampFragment', value: 1658757008643n },
    { identifier: 'WorkerFragment', value: 3 },
    { identifier: 'ProcessFragment', value: 16 },
    { identifier: 'SequenceFragment', value: 1 }
  ]
}
```

<br>

## Example with cluster

index.js

```js
import cluster from 'node:cluster';
import { Snowflakify } from 'snowflakify';

const numWorkers = 3;

if (cluster.isPrimary) {
  for (let i = 0; i < numWorkers; i += 1) {
    cluster.fork();
  }
} else {
  const snowflakify = new Snowflakify();

  const snowflake = snowflakify.nextId();
  const destructuredSnowflake = snowflakify.destructure(snowflake);

  console.log(`Worker ${cluster.worker.id} generated snowflake:`);
  console.log({ snowflake, destructuredSnowflake });
}
```

Console output

```bash
Worker 1 generated snowflake:
{
  snowflake: 1001124291087147009n,
  destructuredSnowflake: [
    { identifier: 'TimestampFragment', value: 1658757030985n },
    { identifier: 'WorkerFragment', value: 1 },
    { identifier: 'ProcessFragment', value: 26 },
    { identifier: 'SequenceFragment', value: 1 }
  ]
}
Worker 2 generated snowflake:
{
  snowflake: 1001124291099865089n,
  destructuredSnowflake: [
    { identifier: 'TimestampFragment', value: 1658757030988n },
    { identifier: 'WorkerFragment', value: 2 },
    { identifier: 'ProcessFragment', value: 27 },
    { identifier: 'SequenceFragment', value: 1 }
  ]
}
Worker 3 generated snowflake:
{
  snowflake: 1001124291150331905n,
  destructuredSnowflake: [
    { identifier: 'TimestampFragment', value: 1658757031000n },
    { identifier: 'WorkerFragment', value: 3 },
    { identifier: 'ProcessFragment', value: 28 },
    { identifier: 'SequenceFragment', value: 1 }
  ]
}
```

<br>

## Using the Circular/Ring Buffer

```js
import { Snowflakify } from 'snowflakify';

const CUSTOM_EPOCH = 1262304001000;

const snowflakify = new Snowflakify({
  useBuffer: true,
  bufferSize: 2 ** 21,
  workerCount: 2,
  fragmentArray: [
    new TimestampFragment(42, CUSTOM_EPOCH),
    new WorkerFragment(5),
    new ProcessFragment(5),
    new SequenceFragment(12),
  ],
});

// ...
```

Console output (next 3 snowflake IDs generated and destructured)

```bash
1662657179066654721n
[
  { identifier: 'TimestampFragment', value: 1658712363166n },
  { identifier: 'WorkerFragment', value: 2 },
  { identifier: 'ProcessFragment', value: 22 },
  { identifier: 'SequenceFragment', value: 1 }
]
1662657179066654722n
[
  { identifier: 'TimestampFragment', value: 1658712363166n },
  { identifier: 'WorkerFragment', value: 2 },
  { identifier: 'ProcessFragment', value: 22 },
  { identifier: 'SequenceFragment', value: 2 }
]
1662657179066654723n
[
  { identifier: 'TimestampFragment', value: 1658712363166n },
  { identifier: 'WorkerFragment', value: 2 },
  { identifier: 'ProcessFragment', value: 22 },
  { identifier: 'SequenceFragment', value: 3 }
]
```
