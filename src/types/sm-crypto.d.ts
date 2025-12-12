declare module 'sm-crypto' {
  export const sm2: {
    generateKeyPairHex: () => { publicKey: string; privateKey: string };
    doEncrypt: (msg: string, publicKey: string, cipherMode?: 0 | 1) => string;
    doDecrypt: (encryptData: string, privateKey: string, cipherMode?: 0 | 1) => string;
    doSignature: (msg: string, privateKey: string, options?: object) => string;
    doVerifySignature: (msg: string, signHex: string, publicKey: string, options?: object) => boolean;
  };

  export const sm3: (msg: string) => string;

  export const sm4: {
    encrypt: (inArray: string, key: string, options?: { mode?: string; iv?: string }) => string;
    decrypt: (inArray: string, key: string, options?: { mode?: string; iv?: string }) => string;
  };
}
