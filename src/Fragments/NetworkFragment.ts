import FragmentBase from '../FragmentBase';
import { getIPv4Address, getMacAddress } from '../Utils/Util';
import { DestructuredFragment } from '../@types';

/**
 * NetworkFragment class for network IDs.
 * @public
 */
export default class NetworkFragment extends FragmentBase {
  /**
   * @param bits - The number of bits for the fragment.
   * @param networkAddress - The type of network address to use, `"ipv4"` or `"mac"`.
   *
   * Defaults to `"ipv4"` if omitted.
   *
   * @throws `[NETWORK_ADDRESS_INVALID]` If networkAddress is not "ipv4" or "mac".
   */
  constructor(bits: number, readonly networkAddress: 'ipv4' | 'mac' = 'ipv4') {
    super(bits);

    if (networkAddress !== 'ipv4' && networkAddress !== 'mac')
      throw new Error(
        `[NETWORK_ADDRESS_INVALID]: NetworkFragment networkAddress "${networkAddress}" is invalid; Expected "ipv4" or "mac".`,
      );

    this.value = this.getNetworkId();
  }

  getValue(): bigint {
    return this.value;
  }

  destructure(snowflake: number | bigint | string): DestructuredFragment {
    const bits = BigInt(snowflake) & this.bitMask;

    return {
      identifier: `${this.identifier}:${this.networkAddress}`,
      value: Number(bits >> this.bitShift),
    };
  }

  updateId(): void {
    this.value = this.getNetworkId();
  }

  /**
   * Returns the network ID.
   *
   * @remarks
   * The value is masked by the maxValue to fit in the fragment's bits.
   *
   * @returns The network ID of the machine based on a non internal network address.
   * @internal
   */
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
