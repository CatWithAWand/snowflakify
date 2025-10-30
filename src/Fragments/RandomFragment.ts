import { randomInt } from 'crypto';
import FragmentBase from '../FragmentBase.js';
import { DestructuredFragment } from '../@types';

/**
 * RandomFragment class for random IDs.
 * @public
 */
export default class RandomFragment extends FragmentBase {
  /**
   * @remarks
   * When using a custom random function, please ensure it returns a positive number
   * no greater than `2 ** bits - 1`.
   *
   * @param bits - The number of bits for the fragment.
   * @param fn - Optional custom random function.
   *
   * @throws `[RND_FUNCTION_RETURN_TYPE]` If custom function does not return number or bigint, or if the value is out of range.
   */
  constructor(bits: number, private readonly fn?: () => number | bigint) {
    super(bits);

    if (fn && !['number', 'bigint'].includes(typeof fn()))
      throw new TypeError(
        `[RND_FUNCTION_RETURN_TYPE]: RandomFragment custom function return is of type: ${typeof fn()}; Expected number or bigint.`,
      );
  }

  getValue(): bigint {
    if (this.fn) {
      const rndNum = BigInt(this.fn());

      if (rndNum < 0n)
        throw new TypeError(
          `[RND_FUNCTION_BAD_RETURN]: RandomFragment custom function returned a negative value.`,
        );

      if (rndNum >= 1n << BigInt(this.bits))
        throw new TypeError(
          `[RND_FUNCTION_BAD_RETURN]: RandomFragment custom function returned a value bigger than (2 ** ${this.bits}) - 1.`,
        );

      return rndNum;
    }

    if (this.bits <= 47)
      return BigInt(randomInt(0, Number(1n << BigInt(this.bits))));

    // 47 bit parts due to randomInt range limitation
    // max param limit of Number.MAX_SAFE_INTEGER
    let rndNum = BigInt(0);
    for (let i = 0; i < this.bits; i += 47) {
      rndNum |=
        BigInt(randomInt(0, Number(1n << BigInt(Math.min(this.bits - i, 47))))) <<
        BigInt(i);
    }

    return rndNum;
  }

  destructure(snowflake: number | bigint | string): DestructuredFragment {
    const bits = BigInt(snowflake) & this.bitMask;

    return {
      identifier: this.identifier,
      value: bits >> this.bitShift,
    };
  }
}
