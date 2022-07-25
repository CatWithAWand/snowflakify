import { parentPort, workerData } from 'worker_threads';
import { SnowflakifyFragment } from 'src/@types';
import Snowflakify from '../Snowflakify';
import TimestampFragment from '../Fragments/TimestampFragment';
import WorkerFragment from '../Fragments/WorkerFragment';
import ProcessFragment from '../Fragments/ProcessFragment';
import NetworkFragment from '../Fragments/NetworkFragment';
import RandomFragment from '../Fragments/RandomFragment';
import SequenceFragment from '../Fragments/SequenceFragment';
import CircularBuffer from './CircularBuffer';

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
