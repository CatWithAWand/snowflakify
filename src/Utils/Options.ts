import { FragmentArray, SnowflakifyOptions } from '../@types';
import TimestampFragment from '../Fragments/TimestampFragment.js';
import WorkerFragment from '../Fragments/WorkerFragment.js';
import ProcessFragment from '../Fragments/ProcessFragment.js';
import NetworkFragment from '../Fragments/NetworkFragment.js';
import SequenceFragment from '../Fragments/SequenceFragment.js';

/**
 * Options class used to construct default Snowflakify instances.
 * @internal
 */
export default class Options extends null {
  /**
   * @internal
   */
  private static defaultWorkerProcess = (epoch?: number): FragmentArray => [
    new TimestampFragment(42, epoch),
    new WorkerFragment(5),
    new ProcessFragment(5),
    new SequenceFragment(12),
  ];

  /**
   * @internal
   */
  private static defaultNetwork = (
    epoch?: number,
    type?: 'ipv4' | 'mac',
  ): FragmentArray => [
    new TimestampFragment(42, epoch),
    new NetworkFragment(10, type),
    new SequenceFragment(12),
  ];

  /**
   * @internal
   */
  static defaultOptions = (options?: SnowflakifyOptions): FragmentArray => {
    if (options?.preset === 'ipv4' || options?.preset === 'mac')
      return this.defaultNetwork(options.epoch, options.preset);

    return this.defaultWorkerProcess(options?.epoch);
  };
}
