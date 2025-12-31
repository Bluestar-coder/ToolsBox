/**
 * 古典密码工具集
 *
 * @remarks
 * 提供多种古典密码算法的加密解密功能，包括：
 * - 凯撒密码 (Caesar)
 * - ROT13 / ROT47
 * - Atbash密码
 * - 仿射密码 (Affine)
 * - 维吉尼亚密码 (Vigenère)
 * - 栅栏密码 (Rail Fence)
 * - 培根密码 (Bacon)
 * - 摩尔斯电码 (Morse)
 * - Polybius方格
 * - 猪圈密码 (Pigpen)
 * - 键盘密码
 * - T9九宫格
 * - Playfair密码
 * - 列换位密码 (Columnar Transposition)
 *
 * @packageDocumentation
 */

// ============ 凯撒密码 ============

/**
 * 凯撒密码加密
 *
 * @param text - 要加密的文本
 * @param shift - 偏移量，正数向右偏移，负数向左偏移
 * @returns 加密后的文本
 *
 * @example
 * ```typescript
 * caesarEncrypt('HELLO', 3);  // 'KHOOR'
 * caesarEncrypt('Hello', -1); // 'Gdkkn'
 * ```
 *
 * @remarks
 * 凯撒密码是最简单的替换密码之一，通过将字母表中的每个字母
 * 向右（或向左）移动固定位数来实现加密。保留大小写和非字母字符。
 */
export const caesarEncrypt = (text: string, shift: number): string => {
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26 + 26) % 26 + base);
  });
};

export const caesarDecrypt = (text: string, shift: number): string => {
  return caesarEncrypt(text, -shift);
};

// ROT13 特例
export const rot13 = (text: string): string => caesarEncrypt(text, 13);

// ROT47
export const rot47 = (text: string): string => {
  return text.replace(/[!-~]/g, (char) => {
    return String.fromCharCode(((char.charCodeAt(0) - 33 + 47) % 94) + 33);
  });
};

// ============ Atbash 密码 ============
export const atbash = (text: string): string => {
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    return String.fromCharCode(base + 25 - (char.charCodeAt(0) - base));
  });
};

// ============ 仿射密码 ============
const modInverse = (a: number, m: number): number => {
  for (let x = 1; x < m; x++) {
    if ((a * x) % m === 1) return x;
  }
  return -1;
};

export const affineEncrypt = (text: string, a: number, b: number): string => {
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    const x = char.charCodeAt(0) - base;
    return String.fromCharCode(((a * x + b) % 26) + base);
  });
};

export const affineDecrypt = (text: string, a: number, b: number): string => {
  const aInv = modInverse(a, 26);
  if (aInv === -1) throw new Error('a 与 26 不互质');
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    const y = char.charCodeAt(0) - base;
    return String.fromCharCode((((aInv * (y - b)) % 26) + 26) % 26 + base);
  });
};

// ============ 维吉尼亚密码 ============
export const vigenereEncrypt = (text: string, key: string): string => {
  const k = key.toUpperCase();
  let j = 0;
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    const shift = k.charCodeAt(j % k.length) - 65;
    j++;
    return String.fromCharCode(((char.charCodeAt(0) - base + shift) % 26) + base);
  });
};

export const vigenereDecrypt = (text: string, key: string): string => {
  const k = key.toUpperCase();
  let j = 0;
  return text.replace(/[a-zA-Z]/g, (char) => {
    const base = char <= 'Z' ? 65 : 97;
    const shift = k.charCodeAt(j % k.length) - 65;
    j++;
    return String.fromCharCode((((char.charCodeAt(0) - base - shift) % 26) + 26) % 26 + base);
  });
};

// ============ 栅栏密码 ============
export const railFenceEncrypt = (text: string, rails: number): string => {
  if (rails <= 1) return text;
  const fence: string[][] = Array.from({ length: rails }, () => []);
  let rail = 0, dir = 1;
  for (const char of text) {
    fence[rail].push(char);
    rail += dir;
    if (rail === 0 || rail === rails - 1) dir = -dir;
  }
  return fence.flat().join('');
};

export const railFenceDecrypt = (text: string, rails: number): string => {
  if (rails <= 1) return text;
  const len = text.length;
  const fence: (string | null)[][] = Array.from({ length: rails }, () => Array(len).fill(null));
  let rail = 0, dir = 1;
  for (let i = 0; i < len; i++) {
    fence[rail][i] = '*';
    rail += dir;
    if (rail === 0 || rail === rails - 1) dir = -dir;
  }
  let idx = 0;
  for (let r = 0; r < rails; r++) {
    for (let c = 0; c < len; c++) {
      if (fence[r][c] === '*') fence[r][c] = text[idx++];
    }
  }
  let result = '';
  rail = 0; dir = 1;
  for (let i = 0; i < len; i++) {
    result += fence[rail][i];
    rail += dir;
    if (rail === 0 || rail === rails - 1) dir = -dir;
  }
  return result;
};

// ============ 培根密码 ============
const baconMap: Record<string, string> = {
  A: 'AAAAA', B: 'AAAAB', C: 'AAABA', D: 'AAABB', E: 'AABAA',
  F: 'AABAB', G: 'AABBA', H: 'AABBB', I: 'ABAAA', J: 'ABAAB',
  K: 'ABABA', L: 'ABABB', M: 'ABBAA', N: 'ABBAB', O: 'ABBBA',
  P: 'ABBBB', Q: 'BAAAA', R: 'BAAAB', S: 'BAABA', T: 'BAABB',
  U: 'BABAA', V: 'BABAB', W: 'BABBA', X: 'BABBB', Y: 'BBAAA', Z: 'BBAAB',
};
const baconReverse = Object.fromEntries(Object.entries(baconMap).map(([k, v]) => [v, k]));

export const baconEncrypt = (text: string): string => {
  return text.toUpperCase().replace(/[A-Z]/g, (c) => baconMap[c] || c);
};

export const baconDecrypt = (text: string): string => {
  const clean = text.toUpperCase().replace(/[^AB]/g, '');
  let result = '';
  for (let i = 0; i + 5 <= clean.length; i += 5) {
    result += baconReverse[clean.slice(i, i + 5)] || '?';
  }
  return result;
};

// ============ 摩尔斯电码 ============
const morseMap: Record<string, string> = {
  A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....',
  I: '..', J: '.---', K: '-.-', L: '.-..', M: '--', N: '-.', O: '---', P: '.--.',
  Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-',
  Y: '-.--', Z: '--..', '0': '-----', '1': '.----', '2': '..---', '3': '...--',
  '4': '....-', '5': '.....', '6': '-....', '7': '--...', '8': '---..', '9': '----.',
  '.': '.-.-.-', ',': '--..--', '?': '..--..', ' ': '/',
};
const morseReverse = Object.fromEntries(Object.entries(morseMap).map(([k, v]) => [v, k]));

export const morseEncrypt = (text: string): string => {
  return text.toUpperCase().split('').map((c) => morseMap[c] || c).join(' ');
};

export const morseDecrypt = (text: string): string => {
  return text.split(' ').map((c) => morseReverse[c] || c).join('');
};

// ============ Polybius 棋盘密码 ============
const polybiusSquare = 'ABCDEFGHIKLMNOPQRSTUVWXYZ'; // I/J 合并

export const polybiusEncrypt = (text: string): string => {
  return text.toUpperCase().replace(/J/g, 'I').replace(/[A-Z]/g, (c) => {
    const idx = polybiusSquare.indexOf(c);
    return idx >= 0 ? `${Math.floor(idx / 5) + 1}${(idx % 5) + 1}` : c;
  });
};

export const polybiusDecrypt = (text: string): string => {
  const clean = text.replace(/[^1-5]/g, '');
  let result = '';
  for (let i = 0; i + 2 <= clean.length; i += 2) {
    const row = parseInt(clean[i]) - 1;
    const col = parseInt(clean[i + 1]) - 1;
    result += polybiusSquare[row * 5 + col] || '?';
  }
  return result;
};

// ============ 猪圈密码 (返回描述) ============
export const pigpenEncrypt = (text: string): string => {
  const map: Record<string, string> = {
    A: '┘', B: '┴', C: '└', D: '┤', E: '┼', F: '├', G: '┐', H: '┬', I: '┌',
    J: '╝', K: '╩', L: '╚', M: '╣', N: '╬', O: '╠', P: '╗', Q: '╦', R: '╔',
    S: '>', T: '^', U: '<', V: 'V', W: '◢', X: '◣', Y: '◤', Z: '◥',
  };
  return text.toUpperCase().replace(/[A-Z]/g, (c) => map[c] || c);
};

export const pigpenDecrypt = (text: string): string => {
  const map: Record<string, string> = {
    '┘': 'A', '┴': 'B', '└': 'C', '┤': 'D', '┼': 'E', '├': 'F', '┐': 'G', '┬': 'H', '┌': 'I',
    '╝': 'J', '╩': 'K', '╚': 'L', '╣': 'M', '╬': 'N', '╠': 'O', '╗': 'P', '╦': 'Q', '╔': 'R',
    '>': 'S', '^': 'T', '<': 'U', 'V': 'V', '◢': 'W', '◣': 'X', '◤': 'Y', '◥': 'Z',
  };
  return text.split('').map((c) => map[c] || c).join('');
};

// ============ 键盘密码 ============
const qwertyRows = ['QWERTYUIOP', 'ASDFGHJKL', 'ZXCVBNM'];

export const keyboardEncrypt = (text: string): string => {
  return text.toUpperCase().replace(/[A-Z]/g, (c) => {
    for (let row = 0; row < qwertyRows.length; row++) {
      const col = qwertyRows[row].indexOf(c);
      if (col >= 0) return `${row + 1}${col + 1}`;
    }
    return c;
  });
};

export const keyboardDecrypt = (text: string): string => {
  const clean = text.replace(/[^1-9]/g, '');
  let result = '';
  for (let i = 0; i + 2 <= clean.length; i += 2) {
    const row = parseInt(clean[i]) - 1;
    const col = parseInt(clean[i + 1]) - 1;
    if (row >= 0 && row < 3 && col >= 0 && col < qwertyRows[row].length) {
      result += qwertyRows[row][col];
    }
  }
  return result;
};

// ============ 手机九宫格 ============
const t9Map: Record<string, string> = {
  A: '21', B: '22', C: '23', D: '31', E: '32', F: '33', G: '41', H: '42', I: '43',
  J: '51', K: '52', L: '53', M: '61', N: '62', O: '63', P: '71', Q: '72', R: '73',
  S: '74', T: '81', U: '82', V: '83', W: '91', X: '92', Y: '93', Z: '94',
};
const t9Reverse = Object.fromEntries(Object.entries(t9Map).map(([k, v]) => [v, k]));

export const t9Encrypt = (text: string): string => {
  return text.toUpperCase().replace(/[A-Z]/g, (c) => t9Map[c] || c);
};

export const t9Decrypt = (text: string): string => {
  const clean = text.replace(/[^1-9]/g, '');
  let result = '';
  for (let i = 0; i + 2 <= clean.length; i += 2) {
    result += t9Reverse[clean.slice(i, i + 2)] || '?';
  }
  return result;
};

// ============ Playfair 密码 ============
const createPlayfairMatrix = (key: string): string[] => {
  const seen = new Set<string>();
  const matrix: string[] = [];
  const keyClean = (key + 'ABCDEFGHIKLMNOPQRSTUVWXYZ').toUpperCase().replace(/J/g, 'I');
  for (const c of keyClean) {
    if (/[A-Z]/.test(c) && !seen.has(c)) {
      seen.add(c);
      matrix.push(c);
    }
  }
  return matrix;
};

export const playfairEncrypt = (text: string, key: string): string => {
  const matrix = createPlayfairMatrix(key);
  const clean = text.toUpperCase().replace(/J/g, 'I').replace(/[^A-Z]/g, '');
  const pairs: string[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    const a = clean[i];
    let b = clean[i + 1] || 'X';
    if (a === b) { b = 'X'; i--; }
    pairs.push(a + b);
  }
  return pairs.map(([a, b]) => {
    const ai = matrix.indexOf(a), bi = matrix.indexOf(b);
    const ar = Math.floor(ai / 5), ac = ai % 5;
    const br = Math.floor(bi / 5), bc = bi % 5;
    if (ar === br) return matrix[ar * 5 + (ac + 1) % 5] + matrix[br * 5 + (bc + 1) % 5];
    if (ac === bc) return matrix[((ar + 1) % 5) * 5 + ac] + matrix[((br + 1) % 5) * 5 + bc];
    return matrix[ar * 5 + bc] + matrix[br * 5 + ac];
  }).join('');
};

export const playfairDecrypt = (text: string, key: string): string => {
  const matrix = createPlayfairMatrix(key);
  const clean = text.toUpperCase().replace(/[^A-Z]/g, '');
  const pairs: string[] = [];
  for (let i = 0; i < clean.length; i += 2) {
    pairs.push(clean.slice(i, i + 2));
  }
  return pairs.map(([a, b]) => {
    const ai = matrix.indexOf(a), bi = matrix.indexOf(b);
    const ar = Math.floor(ai / 5), ac = ai % 5;
    const br = Math.floor(bi / 5), bc = bi % 5;
    if (ar === br) return matrix[ar * 5 + (ac + 4) % 5] + matrix[br * 5 + (bc + 4) % 5];
    if (ac === bc) return matrix[((ar + 4) % 5) * 5 + ac] + matrix[((br + 4) % 5) * 5 + bc];
    return matrix[ar * 5 + bc] + matrix[br * 5 + ac];
  }).join('');
};

// ============ 列换位密码 ============
export const columnarEncrypt = (text: string, key: string): string => {
  const cols = key.length;
  const rows = Math.ceil(text.length / cols);
  const padded = text.padEnd(rows * cols, 'X');
  const order = [...key].map((c, i) => ({ c, i })).sort((a, b) => a.c.localeCompare(b.c)).map((x) => x.i);
  let result = '';
  for (const col of order) {
    for (let row = 0; row < rows; row++) {
      result += padded[row * cols + col];
    }
  }
  return result;
};

export const columnarDecrypt = (text: string, key: string): string => {
  const cols = key.length;
  const rows = Math.ceil(text.length / cols);
  const order = [...key].map((c, i) => ({ c, i })).sort((a, b) => a.c.localeCompare(b.c)).map((x) => x.i);
  const grid: string[][] = Array.from({ length: rows }, () => Array(cols).fill(''));
  let idx = 0;
  for (const col of order) {
    for (let row = 0; row < rows; row++) {
      grid[row][col] = text[idx++] || '';
    }
  }
  return grid.flat().join('').replace(/X+$/, '');
};
