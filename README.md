<a href="https://github.com/CatWithAWand/snowflakify">
  <p align="center">
    <img width=500 src="https://raw.githubusercontent.com/CatWithAWand/snowflakify/main/logo.svg"/>
  </p>
</a>

<p align="center">
  <a href="http://commitizen.github.io/cz-cli/"><img src="https://img.shields.io/badge/commitizen-friendly-brightgreen?style=flat" alt="Commitizen friendly" /></a>
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white" alt="TypeScript" /></a>
  <br>
  <strong>A complete Snowflake ID generator in TypeScript. <br>
  Generate, custom snowflakes structures, destructuring and more...</strong>
</p>

---

<br>

## About

Snowflakify is a complete [Node.js](https://nodejs.org) module for snowflake ID generation written in [TypeScript](https://www.typescriptlang.org/).

- IDs based on Workers/Cluster, machine IPv4/MAC addresses
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
