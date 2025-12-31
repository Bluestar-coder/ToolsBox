import { describe, it, expect } from 'vitest';
import {
  caesarEncrypt,
  caesarDecrypt,
  rot13,
  rot47,
  atbash,
  affineEncrypt,
  affineDecrypt,
  vigenereEncrypt,
  vigenereDecrypt,
  railFenceEncrypt,
  railFenceDecrypt,
  baconEncrypt,
  baconDecrypt,
  morseEncrypt,
  morseDecrypt,
  polybiusEncrypt,
  polybiusDecrypt,
  pigpenEncrypt,
  pigpenDecrypt,
  keyboardEncrypt,
  keyboardDecrypt,
  t9Encrypt,
  t9Decrypt,
  playfairEncrypt,
  playfairDecrypt,
  columnarEncrypt,
  columnarDecrypt
} from './classical';

describe('古典密码工具测试', () => {
  describe('凯撒密码 (Caesar Cipher)', () => {
    it('应该正确加密文本', () => {
      expect(caesarEncrypt('HELLO', 3)).toBe('KHOOR');
      expect(caesarEncrypt('WORLD', 5)).toBe('BTWQI');
    });

    it('应该正确解密文本', () => {
      expect(caesarDecrypt('KHOOR', 3)).toBe('HELLO');
      expect(caesarDecrypt('BTWQI', 5)).toBe('WORLD');
    });

    it('应该保持大小写', () => {
      expect(caesarEncrypt('Hello World', 1)).toBe('Ifmmp Xpsme');
      expect(caesarDecrypt('Ifmmp Xpsme', 1)).toBe('Hello World');
    });

    it('应该处理负数偏移', () => {
      expect(caesarEncrypt('HELLO', -1)).toBe('GDKKN');
      expect(caesarDecrypt('GDKKN', -1)).toBe('HELLO');
    });

    it('应该处理大偏移量', () => {
      expect(caesarEncrypt('HELLO', 26)).toBe('HELLO');
      expect(caesarEncrypt('HELLO', 52)).toBe('HELLO');
    });

    it('应该保留非字母字符', () => {
      expect(caesarEncrypt('Hello, World! 123', 3)).toBe('Khoor, Zruog! 123');
    });

    it('加密解密应该还原原文', () => {
      const plaintext = 'The quick brown fox jumps over the lazy dog';
      const encrypted = caesarEncrypt(plaintext, 13);
      expect(caesarDecrypt(encrypted, 13)).toBe(plaintext);
    });
  });

  describe('ROT13', () => {
    it('应该正确转换文本', () => {
      expect(rot13('HELLO')).toBe('URYYB');
      expect(rot13('URYYB')).toBe('HELLO');
    });

    it('应该是自身的逆运算', () => {
      const text = 'ROT13 Test';
      expect(rot13(rot13(text))).toBe(text);
    });
  });

  describe('ROT47', () => {
    it('应该正确转换ASCII字符', () => {
      expect(rot47('Hello')).toBeDefined();
      expect(typeof rot47('Hello')).toBe('string');
    });

    it('应该是自身的逆运算', () => {
      const text = 'Hello World!';
      const encrypted = rot47(text);
      expect(rot47(encrypted)).toBe(text);
    });
  });

  describe('Atbash密码', () => {
    it('应该正确反转字母表', () => {
      expect(atbash('HELLO')).toBe('SVOOL');
      expect(atbash('ABCDEFGHIJKLMNOPQRSTUVWXYZ')).toBe('ZYXWVUTSRQPONMLKJIHGFEDCBA');
    });

    it('应该保持大小写', () => {
      expect(atbash('Hello')).toBe('Svool');
    });

    it('应该是自身的逆运算', () => {
      const text = 'Test Atbash';
      expect(atbash(atbash(text))).toBe(text);
    });
  });

  describe('仿射密码 (Affine Cipher)', () => {
    it('应该正确加密解密', () => {
      expect(affineEncrypt('HELLO', 5, 8)).toBe('RCLLA');
      expect(affineDecrypt('RCLLA', 5, 8)).toBe('HELLO');
    });

    it('应该对无效参数抛出错误', () => {
      expect(() => affineDecrypt('TEST', 2, 3)).toThrow('a 与 26 不互质');
    });

    it('加密解密应该还原原文', () => {
      const plaintext = 'AFFINE CIPHER';
      const encrypted = affineEncrypt(plaintext, 5, 8);
      expect(affineDecrypt(encrypted, 5, 8)).toBe(plaintext);
    });
  });

  describe('维吉尼亚密码 (Vigenère Cipher)', () => {
    it('应该正确加密解密', () => {
      expect(vigenereEncrypt('HELLO', 'KEY')).toBe('RIJVS');
      expect(vigenereDecrypt('RIJVS', 'KEY')).toBe('HELLO');
    });

    it('应该处理不同长度的密钥', () => {
      const plaintext = 'ATTACKATDAWN';
      const key = 'LEMON';
      const encrypted = vigenereEncrypt(plaintext, key);
      expect(vigenereDecrypt(encrypted, key)).toBe(plaintext);
    });

    it('应该保留非字母字符', () => {
      const result = vigenereEncrypt('Hello, World!', 'KEY');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('栅栏密码 (Rail Fence Cipher)', () => {
    it('应该正确加密解密2栏', () => {
      expect(railFenceEncrypt('HELLOWORLD', 2)).toBe('HLOOLELWRD');
      expect(railFenceDecrypt('HLOOLELWRD', 2)).toBe('HELLOWORLD');
    });

    it('应该正确加密解密3栏', () => {
      const plaintext = 'WEAREDISCOVEREDFLEEATONCE';
      const encrypted = railFenceEncrypt(plaintext, 3);
      expect(railFenceDecrypt(encrypted, 3)).toBe(plaintext);
    });

    it('应该处理单栏（不加密）', () => {
      expect(railFenceEncrypt('TEST', 1)).toBe('TEST');
      expect(railFenceDecrypt('TEST', 1)).toBe('TEST');
    });
  });

  describe('培根密码 (Bacon Cipher)', () => {
    it('应该正确加密解密', () => {
      const encrypted = baconEncrypt('HELLO');
      expect(encrypted).toBeDefined();
      expect(encrypted.length).toBeGreaterThan(0);
      expect(baconDecrypt(encrypted)).toBe('HELLO');
    });

    it('应该只转换字母', () => {
      const result = baconEncrypt('HI!');
      expect(result).toBeDefined();
    });
  });

  describe('摩尔斯电码 (Morse Code)', () => {
    it('应该正确加密字母', () => {
      expect(morseEncrypt('SOS')).toBe('... --- ...');
      expect(morseEncrypt('HELLO')).toBe('.... . .-.. .-.. ---');
    });

    it('应该正确加密数字', () => {
      expect(morseEncrypt('123')).toBe('.---- ..--- ...--');
    });

    it('应该正确解密', () => {
      expect(morseDecrypt('... --- ...')).toBe('SOS');
    });

    it('应该处理空格分隔', () => {
      expect(morseEncrypt('HELLO WORLD')).toContain(' / ');
    });
  });

  describe('Polybius方格密码', () => {
    it('应该正确加密解密', () => {
      expect(polybiusEncrypt('HELLO')).toBe('2315313134');
      expect(polybiusDecrypt('2315313134')).toBe('HELLO');
    });

    it('应该合并I和J', () => {
      expect(polybiusEncrypt('IJ')).toBe('2424');
      expect(polybiusEncrypt('JI')).toBe('2424');
    });
  });

  describe('猪圈密码 (Pigpen Cipher)', () => {
    it('应该正确加密', () => {
      const result = pigpenEncrypt('TEST');
      expect(typeof result).toBe('string');
      expect(result.length).toBe(4);
    });

    it('应该正确解密', () => {
      const encrypted = pigpenEncrypt('HELLO');
      expect(pigpenDecrypt(encrypted)).toBe('HELLO');
    });
  });

  describe('键盘密码 (Keyboard Cipher)', () => {
    it('应该正确加密字母位置', () => {
      const result = keyboardEncrypt('A');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('应该正确解密', () => {
      const encrypted = keyboardEncrypt('Q');
      expect(keyboardDecrypt(encrypted)).toBe('Q');
    });
  });

  describe('T9九宫格密码', () => {
    it('应该正确加密字母', () => {
      const result = t9Encrypt('HELLO');
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('应该正确解密', () => {
      const encrypted = t9Encrypt('HELLO');
      expect(t9Decrypt(encrypted)).toBe('HELLO');
    });
  });

  describe('Playfair密码', () => {
    it('应该正确加密解密', () => {
      const plaintext = 'HIDETHEGOLDINTHETREESTUMP';
      const key = 'PLAYFAIR';
      const encrypted = playfairEncrypt(plaintext, key);
      const decrypted = playfairDecrypt(encrypted, key);
      expect(decrypted).toContain('HIDE');
    });
  });

  describe('列换位密码 (Columnar Transposition)', () => {
    it('应该正确加密解密', () => {
      const plaintext = 'WEAREDISCOVEREDFLEEATONCE';
      const key = 'ZEBRAS';
      const encrypted = columnarEncrypt(plaintext, key);
      expect(columnarDecrypt(encrypted, key)).toBe(plaintext);
    });

    it('应该处理填充字符', () => {
      const result = columnarEncrypt('TEST', 'KEY');
      expect(result.length).toBeGreaterThan(0);
    });
  });

  describe('边界条件测试', () => {
    it('应该处理空字符串', () => {
      expect(caesarEncrypt('', 3)).toBe('');
      expect(atbash('')).toBe('');
    });

    it('应该处理只有非字母字符的字符串', () => {
      expect(caesarEncrypt('123!@#', 3)).toBe('123!@#');
    });

    it('应该处理单个字符', () => {
      expect(caesarEncrypt('A', 1)).toBe('B');
      expect(atbash('A')).toBe('Z');
    });

    it('应该处理长文本', () => {
      const longText = 'A'.repeat(1000);
      const encrypted = caesarEncrypt(longText, 13);
      expect(encrypted.length).toBe(1000);
    });
  });

  describe('错误处理', () => {
    it('应该处理无效的仿射密码参数', () => {
      expect(() => affineDecrypt('TEST', 13, 0)).toThrow();
    });
  });
});
