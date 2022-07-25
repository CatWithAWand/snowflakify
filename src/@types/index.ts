import TimestampFragment from '../Fragments/TimestampFragment';
import WorkerFragment from '../Fragments/WorkerFragment';
import ProcessFragment from '../Fragments/ProcessFragment';
import NetworkFragment from '../Fragments/NetworkFragment';
import RandomFragment from '../Fragments/RandomFragment';
import SequenceFragment from '../Fragments/SequenceFragment';

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
