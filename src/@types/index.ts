import TimestampFragment from '../Fragments/TimestampFragment';
import WorkerFragment from '../Fragments/WorkerFragment';
import ProcessFragment from '../Fragments/ProcessFragment';
import NetworkFragment from '../Fragments/NetworkFragment';
import RandomFragment from '../Fragments/RandomFragment';
import SequenceFragment from '../Fragments/SequenceFragment';

export type PredefinedPreset = 'worker_process' | 'ipv4' | 'mac';

export type PresetOptions = { epoch?: number; preset?: PredefinedPreset };

export type FragmentArray = Array<
  | TimestampFragment
  | WorkerFragment
  | ProcessFragment
  | NetworkFragment
  | RandomFragment
  | SequenceFragment
>;

export type SnowflakifyOptions = PresetOptions | FragmentArray;

export interface DestructuredFragment {
  identifier: string;
  value: number | bigint;
}
