<a href="https://github.com/CatWithAWand/snowflakify">
  <p align="center">
    <img width=500 src="https://raw.githubusercontent.com/CatWithAWand/snowflakify/main/logo.svg"/>
  </p>
</a>

<p align="center">
  <a href="https://catwithawand.github.io/snowflakify/"><img src="https://img.shields.io/github/deployments/CatWithAWand/snowflakify/github-pages?label=github-pages&style=flat" alt="GitHub-pages deployment" /></a>
  <a href="http://commitizen.github.io/cz-cli/"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen?style=flat" alt="Commitizen friendly" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <br>
  <strong>A complete Snowflake ID generator in TypeScript. <br>
  Generation, destructuring, custom snowflakes structures and more...</strong>
</p>

---

<br>

## About

Snowflakify is a complete [Node.js](https://nodejs.org) module for distributed systems to generate snowflake IDs written in [TypeScript](https://www.typescriptlang.org/).

- IDs based on worker threads/cluster, <br> machine IPv4/MAC addresses
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

## Installation

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

<br>

## Usage

Creating a new Snowflakify ID generator

```js
const { Snowflakify } = require('snowflakify');

// with default options
const snowflakify = new Snowflakify();

// or with a custom epoch and one of the three presets
const CUSTOM_EPOCH = 1262304001000;
const snowflakify = new Snowflakify({ epoch: CUSTOM_EPOCH, preset: 'ipv4' });
```

Generating a snowflake ID

```js
snowflakify.nextId();
// 980396402074988545n
```

Destructuring a snowflake ID

```js
const snowflakeId = snowflakify.nextId();
// 980397365649235969n

snowflakify.destructure(snowflakeId);
// [
//   { identifier: 'timestamp', value: 1653815346873n },
//   { identifier: 'worker', value: 0 },
//   { identifier: 'process', value: 6 },
//   { identifier: 'sequence', value: 1 }
// ]
```

Creating a custom snowflake structure

```js
const {
  Snowflakify,
  TimestampFragment,
  NetworkFragment,
  SequenceFragment,
} = require('snowflakify');

const CUSTOM_EPOCH = 1262304001000;

const snowflakify = new Snowflakify([
  new TimestampFragment(42, CUSTOM_EPOCH),
  new NetworkFragment(10, 'mac'),
  new SequenceFragment(12),
]);

const snowflakeId = snowflakify.nextId();
// 1642119277687676929n

snowflakify.destructure(snowflakeId);
// [
//   { identifier: 'timestamp', value: 1653815745901n },
//   { identifier: 'mac', value: 594 },
//   { identifier: 'sequence', value: 1 }
// ]
```

<br><br>

> ## **Note:** Snowflakify must be instantiated inside the worker when working with worker_threads or cluster, else it won't be able to see the worker.

<br>

## Example with worker_threads

index.js

```js
const { Worker } = require('worker_threads');

const numWorkers = 3;

for (let i = 0; i < numWorkers; i += 1) {
  const worker = new Worker('./worker.js');

  worker.on('message', (msg) => {
    console.log(`Worker ${worker.threadId} received message:`);
    console.log(msg);
  });
}
```

worker.js

```js
const { parentPort } = require('node:worker_threads');
const { Snowflakify } = require('snowflakify');

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
Worker 1 received message:
{
  snowflake: 980668860120371201n,
  destructuredSnowflake: [
    { identifier: 'timestamp', value: 1653880076199n },
    { identifier: 'worker', value: 1 },
    { identifier: 'process', value: 17 },
    { identifier: 'sequence', value: 1 }
  ]
}
Worker 2 received message:
{
  snowflake: 980668860128890881n,
  destructuredSnowflake: [
    { identifier: 'timestamp', value: 1653880076201n },
    { identifier: 'worker', value: 2 },
    { identifier: 'process', value: 17 },
    { identifier: 'sequence', value: 1 }
  ]
}
Worker 3 received message:
{
  snowflake: 980668860129021953n,
  destructuredSnowflake: [
    { identifier: 'timestamp', value: 1653880076201n },
    { identifier: 'worker', value: 3 },
    { identifier: 'process', value: 17 },
    { identifier: 'sequence', value: 1 }
  ]
}
```

## Example with cluster

index.js

```js
const cluster = require('node:cluster');
const { Snowflakify } = require('snowflakify');

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
  snowflake: 980676479111352321n,
  destructuredSnowflake: [
    { identifier: 'timestamp', value: 1653881892708n },
    { identifier: 'worker', value: 1 },
    { identifier: 'process', value: 21 },
    { identifier: 'sequence', value: 1 }
  ]
}
Worker 2 generated snowflake:
{
  snowflake: 980676479132459009n,
  destructuredSnowflake: [
    { identifier: 'timestamp', value: 1653881892713n },
    { identifier: 'worker', value: 2 },
    { identifier: 'process', value: 22 },
    { identifier: 'sequence', value: 1 }
  ]
}
Worker 3 generated snowflake:
{
  snowflake: 980676479220695041n,
  destructuredSnowflake: [
    { identifier: 'timestamp', value: 1653881892734n },
    { identifier: 'worker', value: 3 },
    { identifier: 'process', value: 28 },
    { identifier: 'sequence', value: 1 }
  ]
}
```
