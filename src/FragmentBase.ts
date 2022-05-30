import { DestructuredFragment } from './@types';

/**
 * Base class for fragments.
 */
export default abstract class FragmentBase {
  /**
   * The current value of the fragment.
   */
  value: bigint;

  /**
   * The maximum value that can be represented by this fragment.
   *
   * maxValue is equal to `2 ** bits - 1`
   * @readonly
   */
  readonly maxValue: bigint;

  /**
   * The number of bits for left and right shifting.
   *
   * bitShift is equal to the number of bits on the right side
   */
  bitShift: bigint;

  /**
   * The bit mask used to isolate the fragment's bits from the snowflake.
   *
   * bitMask is equal to `maxValue << bitShift`
   */
  bitMask: bigint;

  /**
   * The hexadecimal representation of the bit mask as string.
   */
  bitMaskHex: string;

  /**
   * @param bits - The number of bits for the fragment.
   *
   * @throws `[BITS_INVALID_TYPE]` If bits is not a number.
   * @throws `[BITS_INVALID_RANGE]` If bits is less than 1
   */
  constructor(readonly bits: number) {
    if (typeof bits !== 'number')
      throw new TypeError('[BITS_INVALID_TYPE]: Fragment bits must be a number.');

    if (bits < 1)
      throw new RangeError(
        '[BITS_INVALID_RANGE]: Fragment bits must be greater than 0',
      );

    this.value = BigInt(0);
    this.maxValue = BigInt(2 ** bits) - BigInt(1);
  }

  /**
   * Returns the value for the fragment.
   *
   * @remarks
   * Do not use this method outside of a Snowflakify instance.
   * @internal
   */
  abstract getValue(): bigint;

  /**
   * Returns a destructured fragment.
   *
   * @remarks
   * Do not use this method outside of a Snowflakify instance.
   *
   * @param snowflake - The snowflake to destructure.
   *
   * @returns A destructured fragment object with the following properties:
   * - `identifier`: The identifier of the ID.
   * - `value`: The value of the fragment for that snowflake.
   * @internal
   */
  abstract destructure(snowflake: number | bigint | string): DestructuredFragment;

  /**
   * @internal
   */
  setBitShiftAndBitMask(bitsRightSide: number) {
    this.bitShift = BigInt(bitsRightSide);
    this.bitMask = this.maxValue << this.bitShift;
    this.bitMaskHex = `0x${this.bitMask.toString(16)}`;
  }
}
