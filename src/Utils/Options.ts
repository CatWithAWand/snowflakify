import { FragmentArray, PresetOptions } from '../@types';
import TimestampFragment from '../Fragments/TimestampFragment';
import WorkerFragment from '../Fragments/WorkerFragment';
import ProcessFragment from '../Fragments/ProcessFragment';
import NetworkFragment from '../Fragments/NetworkFragment';
import SequenceFragment from '../Fragments/SequenceFragment';

export default class Options extends null {
  private static defaultWorkerProcess = (epoch?: number): FragmentArray => [
    new TimestampFragment(42, epoch),
    new WorkerFragment(5),
    new ProcessFragment(5),
    new SequenceFragment(12),
  ];

  private static defaultNetwork = (
    epoch?: number,
    type?: 'ipv4' | 'mac',
  ): FragmentArray => [
    new TimestampFragment(42, epoch),
    new NetworkFragment(10, type),
    new SequenceFragment(12),
  ];

  static defaultOptions = (options?: PresetOptions): FragmentArray => {
    if (options?.preset === 'ipv4' || options?.preset === 'mac')
      return this.defaultNetwork(options.epoch, options.preset);

    return this.defaultWorkerProcess(options?.epoch);
  };
}
