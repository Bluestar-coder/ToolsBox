import { ed25519, x25519 } from '@noble/curves/ed25519.js';
import { hexToUint8Array, strToUint8Array, uint8ArrayToHex } from './helpers';

export interface Ed25519KeyPair {
  publicKey: string;
  privateKey: string;
}

export interface X25519KeyPair {
  publicKey: string;
  privateKey: string;
}

export const generateEd25519KeyPair = (): Ed25519KeyPair => {
  const { secretKey, publicKey } = ed25519.keygen();
  return {
    privateKey: uint8ArrayToHex(secretKey),
    publicKey: uint8ArrayToHex(publicKey),
  };
};

export const ed25519SignBytes = (messageBytes: Uint8Array, privateKeyHex: string): string => {
  const privateKey = hexToUint8Array(privateKeyHex);
  const signature = ed25519.sign(messageBytes, privateKey);
  return uint8ArrayToHex(signature);
};

export const ed25519Sign = (message: string, privateKeyHex: string): string => {
  return ed25519SignBytes(strToUint8Array(message), privateKeyHex);
};

export const ed25519VerifyBytes = (
  messageBytes: Uint8Array,
  signatureHex: string,
  publicKeyHex: string
): boolean => {
  try {
    const publicKey = hexToUint8Array(publicKeyHex);
    const signature = hexToUint8Array(signatureHex);
    return ed25519.verify(signature, messageBytes, publicKey);
  } catch {
    return false;
  }
};

export const ed25519Verify = (message: string, signatureHex: string, publicKeyHex: string): boolean => {
  return ed25519VerifyBytes(strToUint8Array(message), signatureHex, publicKeyHex);
};

export const generateX25519KeyPair = (): X25519KeyPair => {
  const privateKey = x25519.utils.randomSecretKey();
  const publicKey = x25519.getPublicKey(privateKey);
  return {
    privateKey: uint8ArrayToHex(privateKey),
    publicKey: uint8ArrayToHex(publicKey),
  };
};

export const x25519GetSharedSecret = (privateKeyHex: string, publicKeyHex: string): string => {
  const privateKey = hexToUint8Array(privateKeyHex);
  const publicKey = hexToUint8Array(publicKeyHex);
  const sharedSecret = x25519.getSharedSecret(privateKey, publicKey);
  return uint8ArrayToHex(sharedSecret);
};
