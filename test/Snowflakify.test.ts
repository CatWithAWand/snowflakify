import process from 'process';
import Snowflakify, {
  TimestampFragment,
  WorkerFragment,
  ProcessFragment,
  NetworkFragment,
  RandomFragment,
  SequenceFragment,
} from '../dist/cjs';

const snowflakify = new Snowflakify();

test('snowflakify instantiation with defaults', () => {
  expect(snowflakify).toBeInstanceOf(Snowflakify);
  expect(snowflakify.totalBits).toBe(64);
  expect(snowflakify.fragments).toHaveLength(4);
});

test('invalid snowflakify options throw', () => {
  expect(() => new Snowflakify({ epoch: -1 })).toThrow();
  expect(() => new Snowflakify({ epoch: Date.now() + 1000 })).toThrow();
  // @ts-ignore
  expect(() => new Snowflakify({ epoch: '1234' })).toThrow();
  // @ts-ignore
  expect(() => new Snowflakify({ preset: 1 })).toThrow();
  // @ts-ignore
  expect(() => new Snowflakify({ preset: 'abcdefu' })).toThrow();
  // @ts-ignore
  expect(() => new Snowflakify(1420070400000)).toThrow();
});

test('missing a TimestampFragment or RandomFragment throws', () => {
  expect(() => new Snowflakify({ fragmentArray: [] })).toThrow();
  expect(
    () => new Snowflakify({ fragmentArray: [new NetworkFragment(10)] }),
  ).toThrow();
});

test('RandomFragment missing TimestampFragment or SequenceFragment couple throws', () => {
  expect(
    () => new Snowflakify({ fragmentArray: [new RandomFragment(10)] }),
  ).toThrow();
});

test('snowflake generation', () => {
  const snowflake = snowflakify.nextId();

  expect(typeof snowflake).toBe('bigint');
  expect(snowflake).toBeGreaterThan(BigInt(0));
  expect(snowflake.toString().length).toBe(19);
});

test('destructure of valid snowflake', () => {
  const snowflake = snowflakify.nextId();
  const destructuredSnowflake = snowflakify.destructure(snowflake);

  expect(destructuredSnowflake).toBeInstanceOf(Object);
  destructuredSnowflake.forEach((fragment) => {
    expect(fragment).toBeInstanceOf(Object);
    expect(typeof fragment.identifier).toBe('string');

    switch (fragment.identifier) {
      case 'timestamp':
        expect(fragment.value).toBeLessThanOrEqual(Date.now());
        break;
      case 'worker':
        expect(fragment.value).toBe(0);
        break;
      case 'process':
        expect(fragment.value).toBeCloseTo(process.pid & 31);
        break;
      case 'sequence':
        expect(fragment.value).toBe(1);
        break;
      default:
        expect(fragment.value).toBeGreaterThanOrEqual(0);
    }
  });
});

test('destructure of invalid snowflake throws', () => {
  expect(() => snowflakify.destructure(BigInt(-1))).toThrow();
  expect(() => snowflakify.destructure('1000000000000n')).toThrow();
  expect(() => snowflakify.destructure('abcedfu')).toThrow();
});

test('proper TimestampFragment instantiation', () => {
  const timestampFragment = new TimestampFragment(42);

  timestampFragment.setBitShiftAndBitMask(22);

  expect(timestampFragment.bits).toBe(42);
  expect(timestampFragment.maxValue).toBe(BigInt(4398046511103));
  // @ts-ignore
  expect(timestampFragment.timeUnit).toBe(1000000n);
  // @ts-ignore
  expect(timestampFragment.epoch).toBe(BigInt(1420070400000));
  expect(timestampFragment.bitShift).toBe(BigInt(22));
  expect(timestampFragment.bitMask).toBe(BigInt(18446744073705357312));
  expect(timestampFragment.bitMaskHex).toBe('0xffffffffffc00000');
});

test('improper TimestampFragment instantiation throws', () => {
  expect(() => new TimestampFragment(0)).toThrow();
  expect(() => new TimestampFragment(37)).toThrow();
  // @ts-ignore
  expect(() => new TimestampFragment('42')).toThrow();
  expect(() => new TimestampFragment(42, -1)).toThrow();
  // @ts-ignore
  expect(() => new TimestampFragment(42, '1')).toThrow();
  expect(() => new TimestampFragment(42, Date.now() + 1000)).toThrow();
});

test('improper WorkerFragment instantiation throws', () => {
  expect(() => new WorkerFragment(0)).toThrow();
  // @ts-ignore
  expect(() => new WorkerFragment('5')).toThrow();
  expect(() => new WorkerFragment(5, -1)).toThrow();
  // @ts-ignore
  expect(() => new WorkerFragment(5, '1')).toThrow();
  expect(() => new WorkerFragment(5, 2 ** 5)).toThrow();
});

test('improper ProcessFragment instantiation throws', () => {
  expect(() => new ProcessFragment(0)).toThrow();
  // @ts-ignore
  expect(() => new ProcessFragment('5')).toThrow();
  expect(() => new ProcessFragment(5, -1)).toThrow();
  // @ts-ignore
  expect(() => new ProcessFragment(5, '1')).toThrow();
  expect(() => new ProcessFragment(5, 2 ** 5)).toThrow();
});

test('improper NetworkFragment instantiation throws', () => {
  expect(() => new NetworkFragment(0)).toThrow();
  // @ts-ignore
  expect(() => new NetworkFragment('10')).toThrow();
  // @ts-ignore
  expect(() => new NetworkFragment(10, 1234)).toThrow();
  // @ts-ignore
  expect(() => new NetworkFragment(10, 'abcdefu')).toThrow();
});

test('improper RandomFragment instantiation throws', () => {
  expect(() => new RandomFragment(0)).toThrow();
  // @ts-ignore
  expect(() => new RandomFragment('5')).toThrow();
  // @ts-ignore
  expect(() => new RandomFragment(5, 1)).toThrow();
  // @ts-ignore
  expect(() => new RandomFragment(5, '1')).toThrow();
  // @ts-ignore
  expect(() => new RandomFragment(5, () => '1')).toThrow();
});

test('improper SequenceFragment instantiation throws', () => {
  expect(() => new SequenceFragment(0)).toThrow();
});

test.todo(
  'implement tests for RandomFragment default and custom function randomness',
);
