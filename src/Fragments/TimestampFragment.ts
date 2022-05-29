import { hrtime } from 'node:process';
import FragmentBase from '../FragmentBase';
import SequenceFragment from './SequenceFragment';
import { DestructuredFragment } from '../@types';

const DEFAULT_EPOCH = 1420070400000;

export default class TimestampFragment extends FragmentBase {
  private sequenceFragmentRef: SequenceFragment;

  private lastTimestamp: bigint;

  private readonly epoch: bigint;

  private readonly timeUnit: bigint;

  private readonly nanoTimeAnchor: bigint;

  constructor(bits: number, epoch: number = DEFAULT_EPOCH) {
    super(bits);

    if (bits < 38)
      throw new RangeError(
        '[TIMESTAMP_BITS_INVALID_RANGE]: TimestampFragment bits must be greater than or equal to 38',
      );

    if (typeof epoch !== 'number')
      throw new TypeError(
        '[EPOCH_INVALID_TYPE]: TimestampFragment epoch must be a number.',
      );

    if (epoch < 0 || epoch > Date.now())
      throw new RangeError(
        '[EPOCH_INVALID_RANGE]: TimestampFragment epoch must be within 0 and Date.now() at instantiation time.',
      );

    if (bits >= 58) {
      // nanosecond time unit
      this.timeUnit = BigInt(1);
      this.epoch = BigInt(epoch * 10 ** 6);
    } else if (bits >= 48) {
      // microsecond time unit
      this.timeUnit = BigInt(10 ** 3);
      this.epoch = BigInt(epoch * 10 ** 3);
    } else {
      // millisecond time unit
      this.timeUnit = BigInt(10 ** 6);
      this.epoch = BigInt(epoch);
    }

    const firstHrTime = hrtime.bigint();
    const unixMilliseconds = Date.now();
    const secondHrTime = hrtime.bigint();

    this.nanoTimeAnchor =
      BigInt(unixMilliseconds) * BigInt(10 ** 6) -
      (firstHrTime + secondHrTime) / BigInt(2);

    this.lastTimestamp = BigInt(0);
  }

  set sequenceFragmentReference(sequenceFragment: SequenceFragment) {
    this.sequenceFragmentRef = sequenceFragment;
  }

  getValue(): bigint {
    this.value = this.unixNow();
    // Cannot detect clock drift when using hrtime.bigint()
    // this.checkForClockDrift();
    if (this.sequenceFragmentRef) this.checkForCounterCollision();
    this.lastTimestamp = this.value;

    return this.value - this.epoch;
  }

  destructure(snowflake: number | bigint | string): DestructuredFragment {
    const bits = BigInt(snowflake) & this.bitMask;

    return {
      identifier: 'timestamp',
      value: (bits >> this.bitShift) + this.epoch,
    };
  }

  private unixNow(): bigint {
    return (this.nanoTimeAnchor + hrtime.bigint()) / this.timeUnit;
  }

  private waitForNextTimestamp(): void {
    // :)
    while (this.value === this.lastTimestamp) {
      this.value = this.unixNow();
    }
  }

  private checkForCounterCollision(): void {
    if (this.value === this.lastTimestamp && this.sequenceFragmentRef.willReset())
      return this.waitForNextTimestamp();
    return this.sequenceFragmentRef.resetSequence();
  }

  // private checkForClockDrift(): void {
  //   if (this.value < this.lastTimestamp)
  //     throw new Error('Clock drift detected! Please check your system time!');
  // }
}
