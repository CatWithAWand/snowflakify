import TimestampFragment from '../Fragments/TimestampFragment.js';
import WorkerFragment from '../Fragments/WorkerFragment.js';
import ProcessFragment from '../Fragments/ProcessFragment.js';
import NetworkFragment from '../Fragments/NetworkFragment.js';
import RandomFragment from '../Fragments/RandomFragment.js';
import SequenceFragment from '../Fragments/SequenceFragment.js';

export type PredefinedPreset = 'worker_process' | 'ipv4' | 'mac';

export type SnowflakifyFragment =
  | TimestampFragment
  | WorkerFragment
  | ProcessFragment
  | NetworkFragment
  | RandomFragment
  | SequenceFragment;

export type FragmentArray = Array<SnowflakifyFragment>;

export type SnowflakifyOptions = {
  epoch?: number;
  preset?: PredefinedPreset;
  useBuffer?: boolean;
  bufferSize?: number;
  bufferRefillThershold?: number;
  workerCount?: number;
  fragmentArray?: FragmentArray;
};
export interface DestructuredFragment {
  identifier: string;
  value: number | bigint;
}
