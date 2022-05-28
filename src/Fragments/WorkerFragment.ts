import cluster from 'node:cluster';
import FragmentBase from '../FragmentBase';
import { DestructuredFragment } from '../@types';

export default class WorkerFragment extends FragmentBase {
  constructor(bits: number, value?: number) {
    super(bits);

    if (value) {
      if (typeof value !== 'number')
        throw new TypeError('WorkerFragment value must be a number!');

      if (value > this.maxValue)
        throw new RangeError(
          'WorkerFragment value must be less than or equal to 2 ** bits - 1',
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

  destructure(snowflake: bigint | string): DestructuredFragment {
    const bits = BigInt(snowflake) & this.bitMask;

    return {
      identifier: 'worker',
      value: Number(bits >> this.bitShift),
    };
  }
}