import { parentPort, workerData } from 'worker_threads';
import { SnowflakifyFragment } from '../@types';
import Snowflakify, {
  TimestampFragment,
  WorkerFragment,
  ProcessFragment,
  NetworkFragment,
  RandomFragment,
  SequenceFragment,
} from '../index.js';
import CircularBuffer from './CircularBuffer.js';

const { buffer, generatorOptions, isRefillingSAB } = workerData;

const fragmentProtypeMap: { [key: string]: any } = {
  TimestampFragment: TimestampFragment.prototype,
  WorkerFragment: WorkerFragment.prototype,
  ProcessFragment: ProcessFragment.prototype,
  NetworkFragment: NetworkFragment.prototype,
  RandomFragment: RandomFragment.prototype,
  SequenceFragment: SequenceFragment.prototype,
};

Object.setPrototypeOf(buffer, CircularBuffer.prototype);

// When passing a fragment array, the prototypes of the fragments must be set again,
// and the ID values for the workers, processes, and network must be updated to
// reflect those of the workers that generated the snowflake IDs.
if (generatorOptions?.fragmentArray) {
  generatorOptions.fragmentArray.forEach((fragment: SnowflakifyFragment) => {
    Object.setPrototypeOf(fragment, fragmentProtypeMap[fragment.identifier]);

    if (fragment.identifier === 'WorkerFragment') {
      (fragment as WorkerFragment).updateId();
    } else if (fragment.identifier === 'ProcessFragment') {
      (fragment as ProcessFragment).updateId();
    } else if (fragment.identifier === 'NetworkFragment') {
      (fragment as NetworkFragment).updateId();
    }
  });
}

const snowflake = new Snowflakify(generatorOptions);
const isRefillingTa = new Int32Array(isRefillingSAB);

const refillBuffer = () => {
  let isFull = false;

  // There was an issue with while(true) which would cause
  // one worker to block out all others...
  // Will have to check again in the future
  while (!isFull) {
    try {
      buffer.push(snowflake.nextId());
    } catch (e) {
      Atomics.store(isRefillingTa, 0, 0);
      isFull = true;
    }
  }
};

parentPort?.on('message', (msg) => {
  if (msg === 'refill') {
    refillBuffer();
  }
});
