import { randomInt } from 'node:crypto';
import FragmentBase from '../FragmentBase';
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
   * @param func - Optional custom random function.
   *
   * @throws `[RND_FUNCTION_RETURN_TYPE]` If func does not return number or bigint.
   */
  constructor(bits: number, private readonly func?: () => number | bigint) {
    super(bits);

    if (func && !['number', 'bigint'].includes(typeof func()))
      throw new TypeError(
        `[RND_FUNCTION_RETURN_TYPE]: RandomFragment custom function return is of type: ${typeof func()}; Expected number or bigint.`,
      );
  }

  getValue(): bigint {
    if (this.func) return BigInt(this.func());
    // 48 bit parts due to randomInt range limitation
    // and max param limit of Number.MAX_SAFE_INTEGER
    let rndNum = BigInt(1);
    for (let i = 1; i < this.bits / 48; i += 1) {
      rndNum *= BigInt(randomInt(1, 2 ** 48));
    }
    rndNum *= BigInt(randomInt(1, 2 ** (this.bits % 48)));

    return rndNum - BigInt(1);
  }

  destructure(snowflake: number | bigint | string): DestructuredFragment {
    const bits = BigInt(snowflake) & this.bitMask;

    return {
      identifier: 'random',
      value: bits >> this.bitShift,
    };
  }
}
