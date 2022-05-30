import { isMainThread, threadId } from 'node:worker_threads';
import cluster from 'node:cluster';
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
    } else if (!isMainThread) {
      // is worker thread
      this.value = BigInt(threadId ?? 0) & this.maxValue;
    } else if (!cluster.isPrimary) {
      // is cluster worker
      this.value = BigInt(cluster.worker?.id ?? 0) & this.maxValue;
    } else {
      this.value = BigInt(0);
    }
  }

  getValue(): bigint {
    return this.value;
  }

  destructure(snowflake: number | bigint | string): DestructuredFragment {
    const bits = BigInt(snowflake) & this.bitMask;

    return {
      identifier: 'worker',
      value: Number(bits >> this.bitShift),
    };
  }
}
