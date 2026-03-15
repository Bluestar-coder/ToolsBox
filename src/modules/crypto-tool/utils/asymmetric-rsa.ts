import { base64ToUint8Array, strToUint8Array, uint8ArrayToBase64 } from './helpers';

const toArrayBuffer = (bytes: Uint8Array): ArrayBuffer => {
  const buf = bytes.buffer;
  if (buf instanceof ArrayBuffer) {
    return buf.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength);
  }
  const ab = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(ab).set(bytes);
  return ab;
};

export interface RSAKeyPair {
  publicKey: string;
  privateKey: string;
}

export interface RsaHybridPayload {
  __type: typeof HYBRID_RSA_AES_GCM;
  key: string;
  iv: string;
  ciphertext: string;
}

const HYBRID_RSA_AES_GCM = 'RSA-OAEP+AES-GCM';

const arrayBufferToBase64 = (buffer: ArrayBuffer): string => {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
};

const base64ToArrayBuffer = (base64: string): ArrayBuffer => {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes.buffer as ArrayBuffer;
};

export const generateRSAKeyPair = async (keySize: number = 2048): Promise<RSAKeyPair> => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSA-OAEP',
      modulusLength: keySize,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['encrypt', 'decrypt']
  );

  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer);
  const privateKeyBase64 = arrayBufferToBase64(privateKeyBuffer);

  return {
    publicKey: `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`,
    privateKey: `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`,
  };
};

const extractBase64FromPem = (pem: string): string => {
  return pem
    .replace(/-----BEGIN.*-----/, '')
    .replace(/-----END.*-----/, '')
    .replace(/\s/g, '');
};

const rsaImportPublicKey = async (publicKeyPem: string): Promise<CryptoKey> => {
  const publicKeyBase64 = extractBase64FromPem(publicKeyPem);
  const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);
  return crypto.subtle.importKey(
    'spki',
    publicKeyBuffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['encrypt']
  );
};

const rsaImportPrivateKey = async (privateKeyPem: string): Promise<CryptoKey> => {
  const privateKeyBase64 = extractBase64FromPem(privateKeyPem);
  const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);
  return crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'RSA-OAEP', hash: 'SHA-256' },
    false,
    ['decrypt']
  );
};

export const rsaEncryptBytes = async (plaintextBytes: Uint8Array, publicKeyPem: string): Promise<string> => {
  const publicKey = await rsaImportPublicKey(publicKeyPem);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'RSA-OAEP' },
    publicKey,
    plaintextBytes.buffer as ArrayBuffer
  );
  return uint8ArrayToBase64(new Uint8Array(ciphertext));
};

export const rsaDecryptBytes = async (ciphertextBase64: string, privateKeyPem: string): Promise<Uint8Array> => {
  const privateKey = await rsaImportPrivateKey(privateKeyPem);
  const ciphertext = base64ToUint8Array(ciphertextBase64);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'RSA-OAEP' },
    privateKey,
    ciphertext.buffer as ArrayBuffer
  );
  return new Uint8Array(plaintext);
};

export const rsaEncrypt = async (plaintext: string, publicKeyPem: string): Promise<string> => {
  return rsaEncryptBytes(strToUint8Array(plaintext), publicKeyPem);
};

export const rsaDecrypt = async (ciphertextBase64: string, privateKeyPem: string): Promise<string> => {
  const plaintext = await rsaDecryptBytes(ciphertextBase64, privateKeyPem);
  return new TextDecoder().decode(plaintext);
};

const hybridEncrypt = async (plaintext: string, publicKeyPem: string): Promise<string> => {
  const aesKeyBytes = crypto.getRandomValues(new Uint8Array(32));
  const iv = crypto.getRandomValues(new Uint8Array(12));

  const aesKey = await crypto.subtle.importKey(
    'raw',
    aesKeyBytes,
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );

  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    aesKey,
    toArrayBuffer(strToUint8Array(plaintext))
  );

  const encryptedKey = await rsaEncryptBytes(aesKeyBytes, publicKeyPem);
  const payload: RsaHybridPayload = {
    __type: HYBRID_RSA_AES_GCM,
    key: encryptedKey,
    iv: uint8ArrayToBase64(iv),
    ciphertext: uint8ArrayToBase64(new Uint8Array(ciphertext)),
  };
  return JSON.stringify(payload);
};

const hybridDecrypt = async (payload: RsaHybridPayload, privateKeyPem: string): Promise<string> => {
  const aesKeyBytes = await rsaDecryptBytes(payload.key, privateKeyPem);
  const iv = base64ToUint8Array(payload.iv);
  const ciphertext = base64ToUint8Array(payload.ciphertext);

  const aesKey = await crypto.subtle.importKey(
    'raw',
    toArrayBuffer(aesKeyBytes),
    { name: 'AES-GCM' },
    false,
    ['encrypt', 'decrypt']
  );

  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: toArrayBuffer(iv) },
    aesKey,
    ciphertext.buffer as ArrayBuffer
  );

  return new TextDecoder().decode(plaintext);
};

export const rsaEncryptAuto = async (plaintext: string, publicKeyPem: string): Promise<string> => {
  try {
    return await rsaEncrypt(plaintext, publicKeyPem);
  } catch (error) {
    if (error instanceof Error && error.name === 'OperationError') {
      return hybridEncrypt(plaintext, publicKeyPem);
    }
    throw error;
  }
};

export const rsaDecryptAuto = async (ciphertext: string, privateKeyPem: string): Promise<string> => {
  try {
    const parsed = JSON.parse(ciphertext) as RsaHybridPayload;
    if (parsed?.__type === HYBRID_RSA_AES_GCM) {
      return await hybridDecrypt(parsed, privateKeyPem);
    }
  } catch {
    // Non-JSON payload falls back to standard RSA decryption.
  }
  return rsaDecrypt(ciphertext, privateKeyPem);
};

export const generateRSASignKeyPair = async (keySize: number = 2048): Promise<RSAKeyPair> => {
  const keyPair = await crypto.subtle.generateKey(
    {
      name: 'RSASSA-PKCS1-v1_5',
      modulusLength: keySize,
      publicExponent: new Uint8Array([1, 0, 1]),
      hash: 'SHA-256',
    },
    true,
    ['sign', 'verify']
  );

  const publicKeyBuffer = await crypto.subtle.exportKey('spki', keyPair.publicKey);
  const privateKeyBuffer = await crypto.subtle.exportKey('pkcs8', keyPair.privateKey);

  const publicKeyBase64 = arrayBufferToBase64(publicKeyBuffer);
  const privateKeyBase64 = arrayBufferToBase64(privateKeyBuffer);

  return {
    publicKey: `-----BEGIN PUBLIC KEY-----\n${publicKeyBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PUBLIC KEY-----`,
    privateKey: `-----BEGIN PRIVATE KEY-----\n${privateKeyBase64.match(/.{1,64}/g)?.join('\n')}\n-----END PRIVATE KEY-----`,
  };
};

export const rsaSign = async (message: string, privateKeyPem: string): Promise<string> => {
  const privateKeyBase64 = extractBase64FromPem(privateKeyPem);
  const privateKeyBuffer = base64ToArrayBuffer(privateKeyBase64);

  const privateKey = await crypto.subtle.importKey(
    'pkcs8',
    privateKeyBuffer,
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    privateKey,
    strToUint8Array(message).buffer as ArrayBuffer
  );

  return uint8ArrayToBase64(new Uint8Array(signature));
};

export const rsaVerify = async (message: string, signatureBase64: string, publicKeyPem: string): Promise<boolean> => {
  try {
    const publicKeyBase64 = extractBase64FromPem(publicKeyPem);
    const publicKeyBuffer = base64ToArrayBuffer(publicKeyBase64);

    const publicKey = await crypto.subtle.importKey(
      'spki',
      publicKeyBuffer,
      { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
      false,
      ['verify']
    );

    return await crypto.subtle.verify(
      'RSASSA-PKCS1-v1_5',
      publicKey,
      base64ToUint8Array(signatureBase64).buffer as ArrayBuffer,
      strToUint8Array(message).buffer as ArrayBuffer
    );
  } catch {
    return false;
  }
};
