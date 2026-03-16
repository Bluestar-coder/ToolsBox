import CryptoJS from './cryptojs-symmetric';
import type { CryptoJSWordArray } from './cryptojs-base';

export const parseValue = (value: string, encoding: string): CryptoJSWordArray => {
  if (encoding === 'Hex') {
    return CryptoJS.enc.Hex.parse(value);
  }

  if (encoding === 'Base64') {
    return CryptoJS.enc.Base64.parse(value);
  }

  return CryptoJS.enc.Utf8.parse(value);
};

export const getCryptoMode = (mode: string) => {
  const modes: Record<string, typeof CryptoJS.mode.CBC> = {
    CBC: CryptoJS.mode.CBC,
    CFB: CryptoJS.mode.CFB,
    CTR: CryptoJS.mode.CTR,
    OFB: CryptoJS.mode.OFB,
    ECB: CryptoJS.mode.ECB,
  };

  return modes[mode] || CryptoJS.mode.CBC;
};

export const getCryptoPadding = (padding: string) => {
  const paddings: Record<string, typeof CryptoJS.pad.Pkcs7> = {
    Pkcs7: CryptoJS.pad.Pkcs7,
    Iso97971: CryptoJS.pad.Iso97971,
    AnsiX923: CryptoJS.pad.AnsiX923,
    Iso10126: CryptoJS.pad.Iso10126,
    ZeroPadding: CryptoJS.pad.ZeroPadding,
    NoPadding: CryptoJS.pad.NoPadding,
  };

  return paddings[padding] || CryptoJS.pad.Pkcs7;
};
