import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { isIP } from 'node:net';

const passwordHashPrefix = 'scrypt:v1';
const passwordSaltBytes = 16;
const passwordKeyBytes = 32;

export const hashQuizAccessPassword = (password: string): string => {
  const salt = randomBytes(passwordSaltBytes);
  const key = scryptSync(password, salt, passwordKeyBytes);

  return `${passwordHashPrefix}:${salt.toString('hex')}:${key.toString('hex')}`;
};

export const verifyQuizAccessPassword = (password: string, hash: string): boolean => {
  const [algorithm, version, saltHex, keyHex] = hash.split(':');

  if (`${algorithm}:${version}` !== passwordHashPrefix || !saltHex || !keyHex) {
    return false;
  }

  const expected = Buffer.from(keyHex, 'hex');
  const actual = scryptSync(password, Buffer.from(saltHex, 'hex'), expected.length);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
};

const parseIpv4 = (address: string): number | null => {
  if (isIP(address) !== 4) {
    return null;
  }

  return (
    address.split('.').reduce((value, octet) => (value << 8) + Number.parseInt(octet, 10), 0) >>> 0
  );
};

const parseAllowedRange = (range: string): { address: number; mask: number } | null => {
  const [addressText, prefixText] = range.split('/');
  const address = parseIpv4(addressText ?? '');

  if (address === null) {
    return null;
  }

  if (prefixText === undefined) {
    return { address, mask: 0xffffffff };
  }

  if (!/^\d+$/.test(prefixText)) {
    return null;
  }

  const prefix = Number.parseInt(prefixText, 10);

  if (prefix < 0 || prefix > 32) {
    return null;
  }

  const mask = prefix === 0 ? 0 : (0xffffffff << (32 - prefix)) >>> 0;

  return { address, mask };
};

export const normalizeQuizAllowedIpRanges = (ranges: string[]): string[] =>
  ranges
    .map((range) => range.trim())
    .map((range) => {
      if (!parseAllowedRange(range)) {
        throw new Error('Quiz allowed IP ranges must be IPv4 addresses or CIDR ranges.');
      }

      return range;
    });

export const isClientIpAllowedByRanges = (clientIp: string, ranges: string[]): boolean => {
  const clientAddress = parseIpv4(clientIp);

  if (clientAddress === null) {
    return false;
  }

  return ranges.some((range) => {
    const parsed = parseAllowedRange(range);

    if (!parsed) {
      return false;
    }

    return (clientAddress & parsed.mask) === (parsed.address & parsed.mask);
  });
};
