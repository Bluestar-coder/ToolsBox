import { p256, p384 } from '@noble/curves/nist.js';
import { secp256k1 } from '@noble/curves/secp256k1.js';
import { hexToUint8Array, strToUint8Array, uint8ArrayToHex } from './helpers';

export type ECDSACurve = 'secp256k1' | 'p256' | 'p384';

export interface ECDSAKeyPair {
  publicKey: string;
  privateKey: string;
  publicKeyUncompressed: string;
}

export interface ECDHKeyPair {
  publicKey: string;
  privateKey: string;
}

type CurveInstance = {
  keygen: () => { secretKey: Uint8Array; publicKey: Uint8Array };
  getPublicKey: (secretKey: Uint8Array, compressed: boolean) => Uint8Array;
  sign: (message: Uint8Array, secretKey: Uint8Array) => { toCompactRawBytes: () => Uint8Array };
  verify: (signature: Uint8Array, message: Uint8Array, publicKey: Uint8Array) => boolean;
  getSharedSecret: (privateKey: Uint8Array, publicKey: Uint8Array) => Uint8Array;
};

const getCurve = (curve: ECDSACurve): CurveInstance => {
  switch (curve) {
    case 'secp256k1':
      return secp256k1 as unknown as CurveInstance;
    case 'p256':
      return p256 as unknown as CurveInstance;
    case 'p384':
      return p384 as unknown as CurveInstance;
    default:
      return secp256k1 as unknown as CurveInstance;
  }
};

export const generateECDSAKeyPair = (curve: ECDSACurve = 'secp256k1'): ECDSAKeyPair => {
  const currentCurve = getCurve(curve);
  const { secretKey, publicKey } = currentCurve.keygen();
  const publicKeyUncompressed = currentCurve.getPublicKey(secretKey, false);
  return {
    privateKey: uint8ArrayToHex(secretKey),
    publicKey: uint8ArrayToHex(publicKey),
    publicKeyUncompressed: uint8ArrayToHex(publicKeyUncompressed),
  };
};

export const ecdsaSignBytes = (
  messageBytes: Uint8Array,
  privateKeyHex: string,
  curve: ECDSACurve = 'secp256k1'
): string => {
  const currentCurve = getCurve(curve);
  const privateKey = hexToUint8Array(privateKeyHex);
  const signature = currentCurve.sign(messageBytes, privateKey);
  return uint8ArrayToHex(signature.toCompactRawBytes());
};

export const ecdsaSign = (message: string, privateKeyHex: string, curve: ECDSACurve = 'secp256k1'): string => {
  return ecdsaSignBytes(strToUint8Array(message), privateKeyHex, curve);
};

export const ecdsaVerifyBytes = (
  messageBytes: Uint8Array,
  signatureHex: string,
  publicKeyHex: string,
  curve: ECDSACurve = 'secp256k1'
): boolean => {
  try {
    const currentCurve = getCurve(curve);
    const publicKey = hexToUint8Array(publicKeyHex);
    const signature = hexToUint8Array(signatureHex);
    return currentCurve.verify(signature, messageBytes, publicKey);
  } catch {
    return false;
  }
};

export const ecdsaVerify = (
  message: string,
  signatureHex: string,
  publicKeyHex: string,
  curve: ECDSACurve = 'secp256k1'
): boolean => {
  return ecdsaVerifyBytes(strToUint8Array(message), signatureHex, publicKeyHex, curve);
};

export const generateECDHKeyPair = (curve: ECDSACurve = 'secp256k1'): ECDHKeyPair => {
  const currentCurve = getCurve(curve);
  const { secretKey, publicKey } = currentCurve.keygen();
  return {
    privateKey: uint8ArrayToHex(secretKey),
    publicKey: uint8ArrayToHex(publicKey),
  };
};

export const ecdhGetSharedSecret = (
  privateKeyHex: string,
  publicKeyHex: string,
  curve: ECDSACurve = 'secp256k1'
): string => {
  const currentCurve = getCurve(curve);
  const privateKey = hexToUint8Array(privateKeyHex);
  const publicKey = hexToUint8Array(publicKeyHex);
  const sharedSecret = currentCurve.getSharedSecret(privateKey, publicKey);
  return uint8ArrayToHex(sharedSecret);
};
