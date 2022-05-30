import { hrtime } from 'node:process';
import FragmentBase from '../FragmentBase';
import SequenceFragment from './SequenceFragment';
import { DestructuredFragment } from '../@types';

const DEFAULT_EPOCH = 1420070400000;

/**
 * TimestampFragment class for timestamp IDs.
 * @public
 */
export default class TimestampFragment extends FragmentBase {
  /**
   * Reference to the SequenceFragment instance.
   * This is used to check for sequence collisions,
   * and to reset the sequence when necessary.
   */
  private sequenceFragmentRef: SequenceFragment;

  /**
   * Value of the last timestamp.
   */
  private lastTimestamp: bigint;

  /**
   * Epoch timestamp used to calculate the fragment's timestamps.
   * @readonly
   */
  private readonly epoch: bigint;

  /**
   * Time unit used to convert the nanosecond timestamp to.
   * - `1`: nanosecond
   * - `10 ** 3`: microsecond
   * - `10 ** 6`: millisecond
   * @readonly
   */
  private readonly timeUnit: bigint;

  /**
   * Nanosecond time reference.
   *
   * @remarks
   * Date.now() returns the number of milliseconds since the Unix epoch.
   * hrtime.bigint() returns a high-resolution time value in nanoseconds,
   * however it is relative to an arbitrary time in the past and not the Unix epoch.
   *
   * If `x` hrtime was taken at `y` Unix timestamp, then when we recapture a
   * hrttime at `x'` we can calculate the time with the following formula:
   *
   * `y + (x' - x)` or `(y - x) + x'`
   * @readonly
   */
  private readonly nanoTimeAnchor: bigint;

  /**
   * @remarks
   * When using a custom random function, please ensure it returns a positive number
   * no greater than `2 ** bits - 1`.
   *
   * @param bits - The number of bits for the fragment.
   * @param epoch - A custom epoch timestamp.
   *
   * Defaults to `1420070400000` (2015-01-01 00:00:00) if omitted.
   *
   * @throws `[TIMESTAMP_BITS_INVALID_RANGE]` If bits is less than 38
   * @throws `[EPOCH_INVALID_TYPE]` If epoch is not a number
   * @throws `[EPOCH_INVALID_RANGE]` If epoch is not within 0 and Date.now()
   */
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

  /**
   * @internal
   */
  set sequenceFragmentReference(sequenceFragment: SequenceFragment) {
    this.sequenceFragmentRef = sequenceFragment;
  }

  getValue(): bigint {
    this.value = this.unixNow();
    // Cannot detect clock drift when using hrtime.bigint()
    // this.checkForClockDrift();
    if (this.sequenceFragmentRef) this.checkForSequenceCollision();
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

  /**
   * Returns a Unix timestamp.
   *
   * @remarks
   * The number of the fragment's bits defines the time unit.
   * This is done to avoid overflow when left shifting.
   *
   * @returns A Unix timestamp in the fragments' time unit.
   * @internal
   */
  private unixNow(): bigint {
    return (this.nanoTimeAnchor + hrtime.bigint()) / this.timeUnit;
  }

  /**
   * Wait for the next timestamp.
   * @internal
   */
  private waitForNextTimestamp(): void {
    // :)
    while (this.value === this.lastTimestamp) {
      this.value = this.unixNow();
    }
  }

  /**
   * Check for sequence collision.
   *
   * @remarks
   * If a sequence completes its cycle, and the timestamp
   * is still the same, an already generated snowflake will
   * be re-generated.
   * @internal
   */
  private checkForSequenceCollision(): void {
    if (this.value === this.lastTimestamp && this.sequenceFragmentRef.willReset())
      return this.waitForNextTimestamp();
    return this.sequenceFragmentRef.resetSequence();
  }

  // private checkForClockDrift(): void {
  //   if (this.value < this.lastTimestamp)
  //     throw new Error('Clock drift detected! Please check your system time!');
  // }
}
