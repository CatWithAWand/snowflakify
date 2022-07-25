import FragmentBase from '../FragmentBase';
import { DestructuredFragment } from '../@types';

/**
 * SequenceFragment class for sequence (increment/counter) IDs.
 * @public
 */
export default class SequenceFragment extends FragmentBase {
  getValue(): bigint {
    this.value = (this.value + BigInt(1)) & this.maxValue;

    return this.value;
  }

  destructure(snowflake: number | bigint | string): DestructuredFragment {
    const bits = BigInt(snowflake) & this.bitMask;

    return {
      identifier: this.identifier,
      value: Number(bits >> this.bitShift),
    };
  }

  /**
   * Returns a boolean indicating whether the sequence will reset on the next call.
   *
   * @returns `true` if the sequence will reset when the next getValue() is called.
   * Otherwise, returns `false`.
   * @internal
   */
  willReset(): boolean {
    return ((this.value + BigInt(1)) & this.maxValue) === BigInt(0);
  }

  /**
   * Resets the sequence to 0
   * @internal
   */
  resetSequence(): void {
    this.value = BigInt(0);
  }
}
