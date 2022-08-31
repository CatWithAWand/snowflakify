import { SnowflakifyOptions } from '../@types';
import { isPowerOfTwo } from '../Utils/Util.js';
import CircularBufferRefiller from './CircularBufferRefiller.js';

export default class CircularBuffer {
  private readonly indexBitMask: number;

  private readonly thresholdIndex: number;

  // private readonly tailSAB: SharedArrayBuffer;

  // private readonly headSAB: SharedArrayBuffer;

  // private readonly bufferSAB: SharedArrayBuffer;

  private readonly tailTA: Int32Array;

  private readonly headTA: Int32Array;

  private readonly bufferTA: BigInt64Array;

  private readonly bufferRefiller: CircularBufferRefiller;

  private readonly semaphoreTA: Int32Array;

  constructor(
    private readonly bufferSize: number = 1 << 23,
    generatorOptions: SnowflakifyOptions,
    refillTheshold: number = 0.5,
    workerCount: number = 2,
  ) {
    if (typeof bufferSize !== 'number')
      throw new TypeError(
        '[BUFFER_SIZE_INVALID_TYPE]: Buffer size must be a number.',
      );

    if (!isPowerOfTwo(bufferSize) || bufferSize < 1)
      throw new Error(
        '[BUFFER_SIZE_INVALID]: Buffer size must be a positive number and a power of two.',
      );

    if (typeof refillTheshold !== 'number')
      throw new TypeError(
        '[REFILL_THRESHOLD_INVALID_TYPE]: Refill threshold must be a number.',
      );

    if (refillTheshold < 0 || refillTheshold > 1)
      throw new Error(
        '[REFILL_THRESHOLD_INVALID]: Refill threshold must be within 0 and 1',
      );

    this.indexBitMask = this.bufferSize - 1;
    this.thresholdIndex = Math.floor((this.bufferSize - 1) * refillTheshold);

    this.tailTA = new Int32Array(
      new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT),
    );
    this.headTA = new Int32Array(
      new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT),
    );
    this.bufferTA = new BigInt64Array(
      new SharedArrayBuffer(BigInt64Array.BYTES_PER_ELEMENT * this.bufferSize),
    );

    this.tail = -1;
    this.head = -1;

    this.semaphoreTA = new Int32Array(
      new SharedArrayBuffer(Int32Array.BYTES_PER_ELEMENT),
    );
    Atomics.store(this.semaphoreTA, 0, 1);

    this.bufferRefiller = new CircularBufferRefiller(
      this,
      generatorOptions,
      workerCount,
    );
    this.bufferRefiller.refill();
  }

  get size(): number {
    return this.bufferSize;
  }

  get tail(): number {
    return Atomics.load(this.tailTA, 0);
  }

  private set tail(value: number) {
    Atomics.store(this.tailTA, 0, value);
  }

  get head(): number {
    return Atomics.load(this.headTA, 0);
  }

  private set head(value: number) {
    Atomics.store(this.headTA, 0, value);
  }

  get buffer(): BigInt64Array {
    return this.bufferTA;
  }

  push(value: bigint): void {
    this.acquire();

    const currTail = this.tail + 1;

    if (CircularBuffer.distance(currTail, this.head) >= this.bufferSize) {
      this.release();
      throw new Error('[BUFFER_FULL]: Buffer is full, cannot push.');
    }

    this.incrementTail();

    this.release();

    const nextTailIndex = this.nextIndex(currTail);

    // Atomics.store(this.buffer, nextTailIndex, value);
    this.buffer[nextTailIndex] = value;
  }

  pop(): bigint {
    const currHead = this.head;
    const nextHead = Atomics.store(
      this.headTA,
      0,
      currHead === this.tail ? currHead : currHead + 1,
    );

    if (nextHead < currHead)
      throw new Error('[UPEXPECTED_HEAD_INDEX]: Unexpected head index.');

    if (nextHead === currHead)
      throw new Error('[BUFFER_EMPTY]: Buffer is empty, cannot pop.');

    if (
      this.tail - nextHead <= this.thresholdIndex &&
      !this.bufferRefiller.isRefilling()
    ) {
      this.bufferRefiller.refill();
    }

    const nextHeadIndex = this.nextIndex(nextHead);

    return Atomics.load(this.buffer, nextHeadIndex);
  }

  isFull(): boolean {
    return CircularBuffer.distance(this.tail, this.head) === this.bufferSize - 1;
  }

  isEmpty(): boolean {
    return this.head === this.tail;
  }

  private incrementTail(): number {
    return Atomics.add(this.tailTA, 0, 1);
  }

  // @ts-ignore
  private incrementHead(): number {
    return Atomics.add(this.headTA, 0, 1);
  }

  private static distance(currTail: number, currHead: number): number {
    return (currTail === -1 ? 0 : currTail) - (currHead === -1 ? 0 : currHead);
  }

  private nextIndex(index: number): number {
    return index & this.indexBitMask;
  }

  private acquire(): void {
    Atomics.wait(this.semaphoreTA, 0, 0);
    Atomics.sub(this.semaphoreTA, 0, 1);
  }

  private release(): void {
    Atomics.add(this.semaphoreTA, 0, 1);
    Atomics.notify(this.semaphoreTA, 0, 1);
  }
}
