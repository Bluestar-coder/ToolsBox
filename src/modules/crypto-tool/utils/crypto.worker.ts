import CryptoJS from 'crypto-js';

// 定义消息类型
type CryptoMessage = {
  id: string;
  type: 'encrypt' | 'decrypt';
  algorithm: string;
  input: string;
  password: string;
};

type CryptoResponse = {
  id: string;
  success: boolean;
  result?: string;
  error?: string;
};

// 监听主线程消息
self.onmessage = (e: MessageEvent<CryptoMessage>) => {
  const { id, type, algorithm, input, password } = e.data;
  
  try {
    let result: string;
    
    if (type === 'encrypt') {
      result = encrypt(algorithm, input, password);
    } else {
      result = decrypt(algorithm, input, password);
    }
    
    const response: CryptoResponse = {
      id,
      success: true,
      result
    };
    
    self.postMessage(response);
  } catch (error) {
    const response: CryptoResponse = {
      id,
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
    self.postMessage(response);
  }
};

function encrypt(algorithm: string, input: string, password: string): string {
  switch (algorithm) {
    case 'AES-128-CBC':
    case 'AES-192-CBC':
    case 'AES-256-CBC':
      return CryptoJS.AES.encrypt(input, password).toString();
    case 'DES-CBC':
      return CryptoJS.DES.encrypt(input, password).toString();
    case 'TripleDES-CBC':
      return CryptoJS.TripleDES.encrypt(input, password).toString();
    case 'Rabbit':
      return CryptoJS.Rabbit.encrypt(input, password).toString();
    case 'RC4':
      return CryptoJS.RC4.encrypt(input, password).toString();
    default:
      return CryptoJS.AES.encrypt(input, password).toString();
  }
}

function decrypt(algorithm: string, input: string, password: string): string {
  let decryptedBytes;
  
  switch (algorithm) {
    case 'AES-128-CBC':
    case 'AES-192-CBC':
    case 'AES-256-CBC':
      decryptedBytes = CryptoJS.AES.decrypt(input, password);
      break;
    case 'DES-CBC':
      decryptedBytes = CryptoJS.DES.decrypt(input, password);
      break;
    case 'TripleDES-CBC':
      decryptedBytes = CryptoJS.TripleDES.decrypt(input, password);
      break;
    case 'Rabbit':
      decryptedBytes = CryptoJS.Rabbit.decrypt(input, password);
      break;
    case 'RC4':
      decryptedBytes = CryptoJS.RC4.decrypt(input, password);
      break;
    default:
      decryptedBytes = CryptoJS.AES.decrypt(input, password);
  }
  
  const decrypted = decryptedBytes.toString(CryptoJS.enc.Utf8);
  if (!decrypted) {
    throw new Error('Decryption result is empty');
  }
  
  return decrypted;
}
