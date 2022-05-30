import { networkInterfaces } from 'node:os';

/**
 * @internal
 */
const isEmpty = (obj: any) =>
  [Object, Array].includes((obj || {}).constructor) &&
  !Object.entries(obj || {}).length;

/**
 * @internal
 */
const getIPv4Address = (
  callback: (err: Error | null, ip: string) => string,
): string | null => {
  let err = null;
  const ip =
    Object.values(networkInterfaces())
      .flat()
      .find((addr) => ['IPv4', 4].includes(addr?.family ?? '') && !addr?.internal)
      ?.address ?? '';

  // (!/^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)(\.(?!$)|$)){4}$/.test(ip))
  if (!ip)
    err = new Error('[IPV4_ADDR_NOT_FOUND]: Could not find a valid IPv4 address.');

  return callback(err, ip);
};

/**
 * @internal
 */
const getMacAddress = (
  callback: (err: Error | null, mac: string) => string,
): string | null => {
  let err = null;
  const mac =
    Object.values(networkInterfaces())
      .flat()
      .find(
        (addr) =>
          ['IPv6', 'IPv4', 6, 4].includes(addr?.family ?? '') && !addr?.internal,
      )?.mac ?? '';

  // (!/([0-9a-fA-F]{2}[:]){5}([0-9a-fA-F]{2})/.test(mac))
  if (!mac)
    err = new Error('[MAC_ADDR_NOT_FOUND]: Could not find a valid MAC address.');

  return callback(err, mac);
};

export { isEmpty, getIPv4Address, getMacAddress };
