import {
  TimestampFragment,
  WorkerFragment,
  ProcessFragment,
  NetworkFragment,
  RandomFragment,
  SequenceFragment,
} from '../index.js';

export type PredefinedPreset = 'worker_process' | 'ipv4' | 'mac';

export type SnowflakifyFragment =
  | TimestampFragment
  | WorkerFragment
  | ProcessFragment
  | NetworkFragment
  | RandomFragment
  | SequenceFragment;

export type FragmentArray = SnowflakifyFragment[];

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
