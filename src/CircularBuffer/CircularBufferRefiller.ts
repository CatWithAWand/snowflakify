import path from 'node:path';
import { Worker } from 'node:worker_threads';
import { SnowflakifyOptions } from 'src/@types';
import CircularBuffer from './CircularBuffer';

export default class CircularBufferRefiller {
  private workers: Worker[] = [];

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

    process.on('exit', () => this.cleanup());
    process.on('uncaughtException', () => this.cleanup());
    process.on('SIGINT', () => this.cleanup());
    process.on('SIGQUIT', () => this.cleanup());
    process.on('SIGUSR1', () => this.cleanup());
    process.on('SIGUSR2', () => this.cleanup());
  }

  private createWorker(): Worker {
    const workerFilePath = __filename.endsWith('ts')
      ? 'workerProxyForTs.js'
      : 'worker.js';
    const worker = new Worker(path.resolve(__dirname, workerFilePath), {
      workerData: {
        buffer: this.buffer,
        generatorOptions: this.generatorOptions,
        isRefillingSAB: this.isRefillingSAB,
      },
    });

    return worker;
  }

  private cleanup(): void {
    this.workers.forEach((worker) => worker.terminate());
  }

  refill(): void {
    Atomics.store(this.isRefillingTa, 0, 1);
    this.workers.forEach((worker) => worker.postMessage('refill'));
  }

  isRefilling(): boolean {
    return Atomics.load(this.isRefillingTa, 0) === 1;
  }
}
