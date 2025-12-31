// Cryptographically secure random number helpers
// getRandomByte is exported but may not always be used, which is fine
export const getRandomByte = (): number => {
  const array = new Uint8Array(1);
  crypto.getRandomValues(array);
  return array[0];
};

const getRandomUint32 = (): number => {
  const array = new Uint32Array(1);
  crypto.getRandomValues(array);
  return array[0];
};

const getRandomBytes = (length: number): Uint8Array => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return array;
};

// UUID v1 (基于时间戳)
export const generateUUIDv1 = (): string => {
  const now = Date.now();
  const timeHex = now.toString(16).padStart(12, '0');
  const clockSeq = (getRandomUint32() & 0x3fff) | 0x8000;
  const nodeBytes = getRandomBytes(6);
  const node = Array.from(nodeBytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-1${timeHex.slice(9, 12)}-${clockSeq.toString(16)}-${node}`;
};

// UUID v4 (随机)
export const generateUUID = (): string => {
  const bytes = getRandomBytes(16);
  bytes[6] = (bytes[6] & 0x0f) | 0x40; // version 4
  bytes[8] = (bytes[8] & 0x3f) | 0x80; // variant

  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join('-');
};

// GUID (大写)
export const generateGUID = (): string => generateUUID().toUpperCase();

// UUID 无连字符
export const generateUUIDNoDash = (): string => generateUUID().replace(/-/g, '');

// 短 UUID (基于时间戳+随机)
export const generateShortUUID = (): string => {
  const timestamp = Date.now().toString(36);
  const randomBytes = getRandomBytes(4);
  const randomPart = Array.from(randomBytes, (b) => b.toString(36)).join('').substring(0, 8);
  return timestamp + randomPart;
};

// NanoID 风格 (21字符)
export const generateNanoID = (size: number = 21): string => {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
  const randomBytes = getRandomBytes(size);
  return Array.from(randomBytes, (b) => alphabet[b % alphabet.length]).join('');
};

// ULID (时间排序的唯一ID)
export const generateULID = (): string => {
  const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const now = Date.now();
  let timeStr = '';
  let t = now;
  for (let i = 0; i < 10; i++) {
    timeStr = ENCODING[t % 32] + timeStr;
    t = Math.floor(t / 32);
  }
  const randomBytes = getRandomBytes(10);
  const randomStr = Array.from(randomBytes, (b) => ENCODING[b % 32]).join('');
  return timeStr + randomStr;
};

// Snowflake ID (模拟)
export const generateSnowflakeID = (): string => {
  const epoch = 1609459200000; // 2021-01-01
  const timestamp = Date.now() - epoch;
  const workerId = getRandomUint32() % 32;
  const datacenterId = getRandomUint32() % 32;
  const sequence = getRandomUint32() % 4096;
  const id = BigInt(timestamp) << BigInt(22) | BigInt(datacenterId) << BigInt(17) | BigInt(workerId) << BigInt(12) | BigInt(sequence);
  return id.toString();
};

// ObjectId (MongoDB风格)
export const generateObjectId = (): string => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const machineBytes = getRandomBytes(3);
  const machineId = (machineBytes[0] << 16 | machineBytes[1] << 8 | machineBytes[2]).toString(16).padStart(6, '0');
  const processBytes = getRandomBytes(2);
  const processId = ((processBytes[0] << 8) | processBytes[1]).toString(16).padStart(4, '0');
  const counterBytes = getRandomBytes(3);
  const counter = (counterBytes[0] << 16 | counterBytes[1] << 8 | counterBytes[2]).toString(16).padStart(6, '0');
  return timestamp + machineId + processId + counter;
};

// CUID (碰撞安全ID)
export const generateCUID = (): string => {
  const timestamp = Date.now().toString(36);
  const counterBytes = getRandomBytes(2);
  const counter = ((counterBytes[0] << 8) | counterBytes[1] % 1679616).toString(36).padStart(4, '0');
  const fingerprintBytes = getRandomBytes(2);
  const fingerprint = ((fingerprintBytes[0] << 8) | fingerprintBytes[1] % 1679616).toString(36).padStart(4, '0');
  const randomBytes = getRandomBytes(8);
  const random = Array.from(randomBytes, (b) => b.toString(36)).join('').substring(0, 8);
  return 'c' + timestamp + counter + fingerprint + random;
};

// KSUID (K-Sortable Unique ID)
export const generateKSUID = (): string => {
  const epoch = 1400000000;
  const timestamp = Math.floor(Date.now() / 1000) - epoch;
  const payload = Array.from(getRandomBytes(16));
  const timestampBytes = [(timestamp >> 24) & 0xff, (timestamp >> 16) & 0xff, (timestamp >> 8) & 0xff, timestamp & 0xff];
  const allBytes = [...timestampBytes, ...payload];
  return allBytes.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
};

// 随机字符串
export const generateRandomString = (length: number = 16, charset: string = 'alphanumeric'): string => {
  const charsets: Record<string, string> = {
    alphanumeric: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    numeric: '0123456789',
    hex: '0123456789abcdef',
  };
  const chars = charsets[charset] || charsets.alphanumeric;
  const randomBytes = getRandomBytes(length);
  return Array.from(randomBytes, (b) => chars[b % chars.length]).join('');
};
