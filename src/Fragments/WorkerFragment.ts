import { isMainThread, threadId } from 'worker_threads';
import cluster from 'cluster';
import FragmentBase from '../FragmentBase';
import { DestructuredFragment } from '../@types';

/**
 * WorkerFragment class for worker IDs.
 * @public
 */
export default class WorkerFragment extends FragmentBase {
  /**
   * @param bits - The number of bits for the fragment.
   * @param value - A persistent ID value to use for the fragment.
   *
   * Defaults to the current worker ID if omitted.
   *
   * @throws `[VALUE_INVALID_TYPE]` If value is not a number.
   * @throws `[VALUE_INVALID_RANGE]` If value is not within 0 and 2 ** bits - 1
   */
  constructor(bits: number, value?: number) {
    super(bits);

    if (value) {
      if (typeof value !== 'number')
        throw new TypeError(
          '[VALUE_INVALID_TYPE]: WorkerFragment value must be a number.',
        );

      if (value < 0 || value > this.maxValue)
        throw new RangeError(
          '[VALUE_INVALID_RANGE]: WorkerFragment value must be within 0 and 2 ** bits - 1',
        );

      this.value = BigInt(value);
    } else {
      this.value = this.getWorkerId();
    }
  }

  getValue(): bigint {
    return this.value;
  }

  destructure(snowflake: number | bigint | string): DestructuredFragment {
    const bits = BigInt(snowflake) & this.bitMask;

    return {
      identifier: this.identifier,
      value: Number(bits >> this.bitShift),
    };
  }

  updateId(): void {
    this.value = this.getWorkerId();
  }

  /**
   * Returns the worker's ID.
   *
   * @remarks
   * The value is masked by the maxValue to fit in the fragment's bits.
   *
   * @returns The worker's ID.
   * @internal
   */
  private getWorkerId(): bigint {
    if (!isMainThread)
      // is worker thread
      return BigInt(threadId ?? 0) & this.maxValue;
    if (!cluster.isPrimary)
      // is cluster worker
      return BigInt(cluster.worker?.id ?? 0) & this.maxValue;
    return BigInt(0);
  }
}
