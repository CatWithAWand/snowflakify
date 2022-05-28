import FragmentBase from '../FragmentBase';
import { getIPv4Address, getMacAddress } from '../Utils/Util';
import { DestructuredFragment } from '../@types';

export default class NetworkFragment extends FragmentBase {
  constructor(bits: number, readonly networkAddress: 'ipv4' | 'mac' = 'ipv4') {
    super(bits);

    if (networkAddress !== 'ipv4' && networkAddress !== 'mac')
      throw new Error('NetworkFragment networkAddress must be "ipv4" or "mac"');

    this.value = this.getNetworkId();
  }

  getValue(): bigint {
    return this.value;
  }

  destructure(snowflake: bigint | string): DestructuredFragment {
    const bits = BigInt(snowflake) & this.bitMask;

    return {
      identifier: this.networkAddress,
      value: Number(bits >> this.bitShift),
    };
  }

  private getNetworkId(): bigint {
    let address = null;

    if (this.networkAddress === 'ipv4') {
      address = getIPv4Address((err, ip) => {
        if (err) {
          throw err;
        }

        return ip;
      });
    } else {
      address = getMacAddress((err, mac) => {
        if (err) {
          throw err;
        }

        return mac;
      });
    }

    const seperator = this.networkAddress === 'ipv4' ? '.' : ':';
    const addressBinary =
      address
        ?.split(seperator)
        .reduce((acc, part) => acc.concat(Number(part).toString(2)), '') ?? '';

    return BigInt(parseInt(addressBinary, 2)) & this.maxValue;
  }
}
