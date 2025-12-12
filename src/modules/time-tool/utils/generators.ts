// UUID v1 (基于时间戳)
export const generateUUIDv1 = (): string => {
  const now = Date.now();
  const timeHex = now.toString(16).padStart(12, '0');
  const clockSeq = Math.floor(Math.random() * 0x3fff) | 0x8000;
  const node = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
  return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-1${timeHex.slice(9, 12)}-${clockSeq.toString(16)}-${node}`;
};

// UUID v4 (随机)
export const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// GUID (大写)
export const generateGUID = (): string => generateUUID().toUpperCase();

// UUID 无连字符
export const generateUUIDNoDash = (): string => generateUUID().replace(/-/g, '');

// 短 UUID (基于时间戳+随机)
export const generateShortUUID = (): string => Date.now().toString(36) + Math.random().toString(36).substring(2, 10);

// NanoID 风格 (21字符)
export const generateNanoID = (size: number = 21): string => {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
  return Array.from({ length: size }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
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
  const randomStr = Array.from({ length: 16 }, () => ENCODING[Math.floor(Math.random() * 32)]).join('');
  return timeStr + randomStr;
};

// Snowflake ID (模拟)
export const generateSnowflakeID = (): string => {
  const epoch = 1609459200000; // 2021-01-01
  const timestamp = Date.now() - epoch;
  const workerId = Math.floor(Math.random() * 32);
  const datacenterId = Math.floor(Math.random() * 32);
  const sequence = Math.floor(Math.random() * 4096);
  const id = BigInt(timestamp) << BigInt(22) | BigInt(datacenterId) << BigInt(17) | BigInt(workerId) << BigInt(12) | BigInt(sequence);
  return id.toString();
};

// ObjectId (MongoDB风格)
export const generateObjectId = (): string => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const machineId = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
  const processId = Math.floor(Math.random() * 65536).toString(16).padStart(4, '0');
  const counter = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
  return timestamp + machineId + processId + counter;
};

// CUID (碰撞安全ID)
export const generateCUID = (): string => {
  const timestamp = Date.now().toString(36);
  const counter = Math.floor(Math.random() * 1679616).toString(36).padStart(4, '0');
  const fingerprint = Math.floor(Math.random() * 1679616).toString(36).padStart(4, '0');
  const random = Math.random().toString(36).substring(2, 10);
  return 'c' + timestamp + counter + fingerprint + random;
};

// KSUID (K-Sortable Unique ID)
export const generateKSUID = (): string => {
  const epoch = 1400000000;
  const timestamp = Math.floor(Date.now() / 1000) - epoch;
  const payload = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
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
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};
