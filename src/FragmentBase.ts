import { DestructuredFragment } from './@types';

export default abstract class FragmentBase {
  value: bigint;

  readonly maxValue: bigint;

  bitMask: bigint;

  bitMaskHex: string;

  bitShift: bigint;

  constructor(readonly bits: number) {
    if (bits < 1) throw new RangeError('Fragment bits must be greater than 0!');

    this.value = BigInt(0);
    this.maxValue = BigInt(2 ** bits) - BigInt(1);
  }

  abstract getValue(): bigint;

  abstract destructure(snowflake: bigint | string): DestructuredFragment;

  setBitShiftAndBitMask(bitsRightSide: number) {
    this.bitShift = BigInt(bitsRightSide);
    this.bitMask = this.maxValue << this.bitShift;
    this.bitMaskHex = `0x${this.bitMask.toString(16)}`;
  }
}
