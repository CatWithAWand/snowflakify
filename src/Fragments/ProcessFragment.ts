import process from 'node:process';
import FragmentBase from '../FragmentBase';
import { DestructuredFragment } from '../@types';

export default class ProcessFragment extends FragmentBase {
  constructor(bits: number, value?: number) {
    super(bits);

    if (value) {
      if (typeof value !== 'number')
        throw new TypeError('ProcessFragment value must be a number!');

      if (value > this.maxValue)
        throw new RangeError(
          'ProcessFragment value must be less than or equal to 2 ** bits - 1',
        );

      this.value = BigInt(value);
    } else {
      this.value = BigInt(process.pid) & this.maxValue;
    }
  }

  getValue(): bigint {
    return this.value;
  }

  destructure(snowflake: bigint | string): DestructuredFragment {
    const bits = BigInt(snowflake) & this.bitMask;

    return {
      identifier: 'process',
      value: Number(bits >> this.bitShift),
    };
  }
}
