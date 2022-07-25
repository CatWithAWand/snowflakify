import { isMainThread } from 'node:worker_threads';
import { FragmentArray, SnowflakifyOptions, DestructuredFragment } from './@types';
import TimestampFragment from './Fragments/TimestampFragment';
import SequenceFragment from './Fragments/SequenceFragment';
import Options from './Utils/Options';
import CircularBuffer from './CircularBuffer/CircularBuffer';

/**
 * Snowflakify class for generating snowflake IDs.
 * @public
 */
export default class Snowflakify {
  /**
   * Total number of bits in the snowflake ID.
   * @readonly
   */
  readonly totalBits: number;

  /**
   * Array of fragments used to generate snowflake IDs.
   *
   * @remarks
   * When reading this array outside of a Snowflakify class:
   * - Do not call fragments methods.
   * - Do not add or remove fragments.
   * - Do not reorder fragments.
   * - Do not modify this array.
   *
   * @readonly
   */
  readonly fragments: FragmentArray;

  private buffer: CircularBuffer;

  servedByBuffer: number;

  servedByMain: number;

  /**
   *
   * @remarks
   * A Snowflakify instance must follow the following conditions:
   * - At least one TimestampFragment or RandomFragment.
   * - A RandomFragment must be coupled with at least one TimestampFragment or SequenceFragment.
   * 
   * @param options - Optional parameter for specifying Snowflakify options.
   * 
   * Can be an array of fragments or an object with the following properties:
   * - `epoch`: A custom epoch timestamp.
   * - `preset`: `"worker_process"`, `"ipv4"`, or `"mac"`
   
   */
  constructor(options?: SnowflakifyOptions) {
    this.fragments = this.resolveOptions(options);

    this.totalBits = this.fragments.reduce(
      (acc, fragment) => acc + fragment.bits,
      0,
    );

    this.updateBitShiftsAndMasks();
    this.coupleTimestampAndSequence();

    this.servedByBuffer = 0;
    this.servedByMain = 0;
  }

  /**
   * Returns a snowflake ID.
   *
   * @returns The sum of all fragments values shifted to the left by their bitShift.
   *
   * @public
   */
  nextId(): bigint {
    if (isMainThread && this.buffer && !this.buffer.isEmpty()) {
      this.servedByBuffer += 1;
      return this.buffer.pop();
    }
    this.servedByMain += 1;
    return this.fragments.reduce(
      (acc, fragment) => acc + (fragment.getValue() << fragment.bitShift),
      BigInt(0),
    );
  }

  /**
   * Returns a destructured snowflake.
   *
   * @param snowflake - The snowflake to be destructured.
   *
   * @returns An array of destructured fragments.
   *
   * @throws `[SNOWFLAKE_INVALID]` If snowflake is not a number, bigint, or string of a positive number.
   *
   * @public
   */
  destructure(snowflake: number | bigint | string): DestructuredFragment[] {
    // We do not need bigint precision when checking if a snowflake is valid
    if (Number.isNaN(Number(snowflake)) || Number(snowflake) < 0)
      throw new Error(
        `[SNOWFLAKE_INVALID]: snowflake "${snowflake}" is invalid; Expected a number, bigint, or string of a positive number.`,
      );

    return this.fragments.map((fragment) => fragment.destructure(snowflake));
  }

  /**
   * Returns the buffers content.
   *
   * @returns An array of snowflake IDs.
   *
   * @public
   */
  getBuffer(): BigInt64Array {
    return this.buffer.buffer;
  }

  /**
   * @internal
   */
  private updateBitShiftsAndMasks(): void {
    let remainingBits = this.totalBits;
    this.fragments.forEach((fragment) => {
      remainingBits -= fragment.bits;
      fragment.setBitShiftAndBitMask(remainingBits);
    });
  }

  /**
   * @internal
   */
  private coupleTimestampAndSequence(): void {
    const timestampFragment = this.fragments.find(
      (fragment) => fragment.constructor.name === 'TimestampFragment',
    ) as TimestampFragment;

    const sequenceFragment = this.fragments.find(
      (fragment) => fragment.constructor.name === 'SequenceFragment',
    ) as SequenceFragment;

    if (timestampFragment && sequenceFragment)
      timestampFragment.sequenceFragmentReference = sequenceFragment;
  }

  /**
   * @internal
   */
  private resolveOptions(options?: SnowflakifyOptions): FragmentArray {
    if (typeof options !== 'undefined' && typeof options !== 'object')
      throw new Error(
        '[OPTIONS_INVALID]: Snowflakify options supplied are invalid.',
      );

    if (isMainThread && options?.useBuffer)
      this.buffer = new CircularBuffer(
        options?.bufferSize,
        options,
        options?.bufferRefillThershold,
        options?.workerCount,
      );

    if (options?.fragmentArray && Array.isArray(options?.fragmentArray)) {
      const fragmentTypes = options.fragmentArray.map(
        (fragment) => fragment.constructor.name,
      );

      if (
        !['TimestampFragment', 'RandomFragment'].some((type) =>
          fragmentTypes.includes(type),
        )
      )
        throw new Error(
          '[BAD_FRAGMENT_CONDITIONS]: Snowflakify instance must have at least one TimestampFragment or RandomFragment.',
        );

      if (
        fragmentTypes.includes('RandomFragment') &&
        !['TimestampFragment', 'SequenceFragment'].some((type) =>
          fragmentTypes.includes(type),
        )
      )
        throw new Error(
          '[BAD_FRAGMENT_CONDITIONS]: A RandomFragment must be coupled with at least one TimestampFragment or SequenceFragment.',
        );

      return options.fragmentArray;
    }

    if (
      options?.preset &&
      !['worker_process', 'ipv4', 'mac'].includes(options.preset)
    )
      throw new Error(
        `[PRESET_INVALID]: Snowflakify preset "${options?.preset}" is invalid; Expected "worker_process", "ipv4", or "mac".`,
      );

    return Options.defaultOptions(options);
  }
}
