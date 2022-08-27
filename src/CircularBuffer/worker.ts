import { parentPort, workerData } from 'worker_threads';
import { SnowflakifyFragment } from 'src/@types';
import Snowflakify from '../Snowflakify.js';
import TimestampFragment from '../Fragments/TimestampFragment.js';
import WorkerFragment from '../Fragments/WorkerFragment.js';
import ProcessFragment from '../Fragments/ProcessFragment.js';
import NetworkFragment from '../Fragments/NetworkFragment.js';
import RandomFragment from '../Fragments/RandomFragment.js';
import SequenceFragment from '../Fragments/SequenceFragment.js';
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

// When passing a fragment array, the porotypes of the fragments must be set again,
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

  while (!isFull) {
    try {
      buffer.push(snowflake.nextId());
    } catch (e) {
      Atomics.store(isRefillingTa, 0, 0);
      isFull = true;
      break;
    }
  }
};

parentPort?.on('message', (msg) => {
  if (msg === 'refill') {
    refillBuffer();
  }
});
