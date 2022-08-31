import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { Worker } from 'worker_threads';
import { SnowflakifyOptions } from '../@types';
import CircularBuffer from './CircularBuffer.js';

const CLEANUP_EVENTS = [
  'exit',
  'uncaughtException',
  'SIGINT',
  'SIGQUIT',
  'SIGUSR1',
  'SIGUSR2',
];

export default class CircularBufferRefiller {
  private workers: Worker[] = [];

  // We keep a reference to the SAB because we need
  // to make it known to the workers as well
  private readonly isRefillingSAB: SharedArrayBuffer;

  private readonly isRefillingTa: Int32Array;

  constructor(
    private readonly buffer: CircularBuffer,
    private readonly generatorOptions: SnowflakifyOptions,
    private readonly workerCount: number = 2,
  ) {
    if (typeof workerCount !== 'number')
      throw new TypeError(
        '[WORKER_COUNT_INVALID_TYPE]: Worker count must be a number.',
      );

    if (workerCount < 1)
      throw new Error('[WORKER_COUNT_INVALID]: Worker count must be greater than 0');

    this.isRefillingSAB = new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT);
    this.isRefillingTa = new Int32Array(this.isRefillingSAB);

    Atomics.store(this.isRefillingTa, 0, 0);

    for (let i = 0; i < this.workerCount; i += 1) {
      this.workers.push(this.createWorker());
    }

    for (const event of CLEANUP_EVENTS) {
      process.on(event, () => this.cleanup());
    }
  }

  refill(): void {
    Atomics.store(this.isRefillingTa, 0, 1);

    for (const worker of this.workers) {
      worker.postMessage('refill');
    }
  }

  isRefilling(): boolean {
    return Atomics.load(this.isRefillingTa, 0) === 1;
  }

  private createWorker(): Worker {
    const workerFilePath = fileURLToPath(import.meta.url).endsWith('ts')
      ? 'workerProxyForTs.js'
      : 'worker.js';
    const worker = new Worker(resolve(dirname(workerFilePath)), {
      workerData: {
        buffer: this.buffer,
        generatorOptions: this.generatorOptions,
        isRefillingSAB: this.isRefillingSAB,
      },
    });

    return worker;
  }

  private cleanup(): void {
    for (const worker of this.workers) {
      worker.terminate();
    }
  }
}
