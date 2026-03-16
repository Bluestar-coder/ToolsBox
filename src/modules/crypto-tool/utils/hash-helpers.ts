import CryptoJS from './cryptojs-hash';
import { hexToUint8Array } from './helpers';

export const hashMessageToUint8Array = (
  message: string,
  algorithm: 'SHA256' | 'SHA384' | 'SHA512'
): Uint8Array => {
  let hashHex: string;

  switch (algorithm) {
    case 'SHA384':
      hashHex = CryptoJS.SHA384(message).toString(CryptoJS.enc.Hex);
      break;
    case 'SHA512':
      hashHex = CryptoJS.SHA512(message).toString(CryptoJS.enc.Hex);
      break;
    case 'SHA256':
    default:
      hashHex = CryptoJS.SHA256(message).toString(CryptoJS.enc.Hex);
      break;
  }

  return hexToUint8Array(hashHex);
};
