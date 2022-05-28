import { randomInt } from 'node:crypto';
import FragmentBase from '../FragmentBase';
import { DestructuredFragment } from '../@types';

export default class RandomFragment extends FragmentBase {
  constructor(bits: number, private readonly func?: () => number | bigint) {
    super(bits);

    if (func && !['number', 'bigint'].includes(typeof func()))
      throw new Error(
        'RandomFragment custom function must return a number or bigint!',
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

  destructure(snowflake: bigint | string): DestructuredFragment {
    const bits = BigInt(snowflake) & this.bitMask;

    return {
      identifier: 'random',
      value: bits >> this.bitShift,
    };
  }
}
