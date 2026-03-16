import CryptoJSCore from 'crypto-js/core.js';

export type CryptoJSModule = typeof import('crypto-js');
export type CryptoJSWordArray = ReturnType<CryptoJSModule['lib']['WordArray']['create']>;
export type CryptoJSCipherParams = ReturnType<CryptoJSModule['lib']['CipherParams']['create']>;

const CryptoJS = CryptoJSCore as CryptoJSModule;

export default CryptoJS;
