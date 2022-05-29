import SequenceFragment from './Fragments/SequenceFragment';
import TimestampFragment from './Fragments/TimestampFragment';
import Options from './Utils/Options';
import { FragmentArray, SnowflakifyOptions, DestructuredFragment } from './@types';

export default class Snowflakify {
  readonly totalBits: number;

  readonly fragments: FragmentArray;

  constructor(options?: SnowflakifyOptions) {
    this.fragments = Snowflakify.resolveOptions(options);

    this.totalBits = this.fragments.reduce(
      (acc, fragment) => acc + fragment.bits,
      0,
    );

    this.updateBitShiftsAndMasks();
    this.coupleTimestampAndSequence();
  }

  nextId(): bigint {
    return this.fragments.reduce(
      (acc, fragment) => acc + (fragment.getValue() << fragment.bitShift),
      BigInt(0),
    );
  }

  destructure(snowflake: number | bigint | string): DestructuredFragment[] {
    // We do not need bigint precision when checking if a snowflake is valid
    if (Number.isNaN(Number(snowflake)) || Number(snowflake) < 0)
      throw new Error(
        `[SNOWFLAKE_INVALID]: snowflake "${snowflake}" is invalid; Expected a number, bigint, or string of a positive number.`,
      );

    return this.fragments.map((fragment) => fragment.destructure(snowflake));
  }

  private updateBitShiftsAndMasks(): void {
    let remainingBits = this.totalBits;
    this.fragments.forEach((fragment) => {
      remainingBits -= fragment.bits;
      fragment.setBitShiftAndBitMask(remainingBits);
    });
  }

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

  private static resolveOptions(options?: SnowflakifyOptions): FragmentArray {
    if (typeof options !== 'undefined' && typeof options !== 'object')
      throw new Error(
        '[OPTIONS_INVALID]: Snowflakify options supplied are invalid.',
      );

    if (Array.isArray(options)) {
      const fragmentTypes = options.map((fragment) => fragment.constructor.name);

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

      return options;
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
