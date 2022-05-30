import cluster from 'node:cluster';
import FragmentBase from '../FragmentBase';
import { DestructuredFragment } from '../@types';

/**
 * WorkerFragment class for cluster worker IDs.
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
      this.value =
        BigInt(cluster.isWorker ? cluster.worker?.id ?? 0 : 0) & this.maxValue;
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
