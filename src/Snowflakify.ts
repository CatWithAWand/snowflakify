import SequenceFragment from './Fragments/SequenceFragment';
import TimestampFragment from './Fragments/TimestampFragment';
import Options from './Utils/Options';
import { FragmentArray, SnowflakifyOptions, DestructuredFragment } from './@types';

export default class Snowflakify {
  readonly totalBits: number;

  protected fragments: FragmentArray;

  constructor(options?: SnowflakifyOptions) {
    this.resolveOptions(options);

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

  destructure(snowflake: bigint | string): DestructuredFragment[] {
    return this.fragments.map((fragment) => fragment.destructure(snowflake));
  }

  private resolveOptions(options?: SnowflakifyOptions): void {
    if (Array.isArray(options)) {
      const fragmentTypes = options.map((fragment) => fragment.constructor.name);

      if (
        !['TimestampFragment', 'RandomFragment'].some((type) =>
          fragmentTypes.includes(type),
        )
      )
        throw new Error(
          'A Snowflakify instance must have at least one TimestampFragment or RandomFragment!',
        );

      if (
        fragmentTypes.includes('RandomFragment') &&
        !['TimestampFragment', 'SequenceFragment'].some((type) =>
          fragmentTypes.includes(type),
        )
      )
        throw new Error(
          'RandomFragment must be coupled with at least one TimestampFragment or SequenceFragment!',
        );

      this.fragments = options;
    } else {
      if (options?.epoch && (options.epoch < 0 || options.epoch > Date.now()))
        throw new RangeError('Epoch must be between 0 and Date.now() at runtime!');

      if (options?.preset && !['internal', 'ipv4', 'mac'].includes(options.preset))
        throw new Error('Preset must be one of "internal", "ipv4" or "mac"!');

      this.fragments = Options.defaultOptions(options);
    }
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
}
