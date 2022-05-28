import FragmentBase from '../FragmentBase';
import { DestructuredFragment } from '../@types';

export default class SequenceFragment extends FragmentBase {
  getValue(): bigint {
    this.value = (this.value + BigInt(1)) & this.maxValue;

    return this.value;
  }

  destructure(snowflake: bigint | string): DestructuredFragment {
    const bits = BigInt(snowflake) & this.bitMask;

    return {
      identifier: 'sequence',
      value: Number(bits >> this.bitShift),
    };
  }

  willReset(): boolean {
    return ((this.value + BigInt(1)) & this.maxValue) === BigInt(0);
  }

  resetSequence(): void {
    this.value = BigInt(0);
  }
}
