import process from 'process';
import FragmentBase from '../FragmentBase';
import { DestructuredFragment } from '../@types';

/**
 * ProcessFragment class for process IDs.
 * @public
 */
export default class ProcessFragment extends FragmentBase {
  /**
   * @param bits - The number of bits for the fragment.
   * @param value - A persistent ID value to use for the fragment.
   *
   * Defaults to the current process ID if omitted.
   *
   * @throws `[VALUE_INVALID_TYPE]` If value is not a number.
   * @throws `[VALUE_INVALID_RANGE]` If value is not within 0 and 2 ** bits - 1
   */
  constructor(bits: number, value?: number) {
    super(bits);

    if (value) {
      if (typeof value !== 'number')
        throw new TypeError(
          '[VALUE_INVALID_TYPE]: ProcessFragment value must be a number.',
        );

      if (value < 0 || value > this.maxValue)
        throw new RangeError(
          '[VALUE_INVALID_RANGE]: ProcessFragment value must be within 0 and 2 ** bits - 1',
        );

      this.value = BigInt(value);
    } else {
      this.value = this.getProcessId();
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
    this.value = this.getProcessId();
  }

  /**
   * Returns the process ID.
   *
   * @remarks
   * The value is masked by the maxValue to fit in the fragment's bits.
   *
   * @returns The process ID.
   * @internal
   */
  private getProcessId(): bigint {
    return BigInt(process.pid) & this.maxValue;
  }
}
