import React, { useState, useMemo } from 'react';
import { Input, Button, Space, message, Select, Card, InputNumber } from 'antd';
import * as classical from '../../utils/classical';

const { TextArea } = Input;

type CipherType =
  | 'caesar' | 'rot13' | 'rot47' | 'atbash' | 'affine' | 'vigenere' | 'playfair' | 'bacon'
  | 'railfence' | 'columnar'
  | 'morse' | 'polybius' | 'pigpen' | 'keyboard' | 't9';

// 替换密码
const substituteCiphers = [
  { value: 'caesar', label: '凯撒密码' },
  { value: 'rot13', label: 'ROT13' },
  { value: 'rot47', label: 'ROT47' },
  { value: 'atbash', label: 'Atbash' },
  { value: 'affine', label: '仿射密码' },
  { value: 'vigenere', label: '维吉尼亚' },
  { value: 'playfair', label: 'Playfair' },
  { value: 'bacon', label: '培根密码' },
];

// 换位密码
const transposeCiphers = [
  { value: 'railfence', label: '栅栏密码' },
  { value: 'columnar', label: '列换位' },
];

// 特殊编码
const encodeCiphers = [
  { value: 'morse', label: '摩尔斯电码' },
  { value: 'polybius', label: 'Polybius棋盘' },
  { value: 'pigpen', label: '猪圈密码' },
  { value: 'keyboard', label: '键盘密码' },
  { value: 't9', label: '手机九宫格' },
];

const getDefaultCipher = (tab: string): CipherType => {
  switch (tab) {
    case 'substitute': return 'caesar';
    case 'transpose': return 'railfence';
    case 'encode': return 'morse';
    default: return 'caesar';
  }
};

interface ClassicalTabProps {
  activeTab: string;
}

const ClassicalTab: React.FC<ClassicalTabProps> = ({ activeTab }) => {
  const cipherOptions = useMemo(() => {
    switch (activeTab) {
      case 'substitute': return substituteCiphers;
      case 'transpose': return transposeCiphers;
      case 'encode': return encodeCiphers;
      default: return substituteCiphers;
    }
  }, [activeTab]);

  const [cipher, setCipher] = useState<CipherType>(() => getDefaultCipher(activeTab));
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [shift, setShift] = useState(3);
  const [affineA, setAffineA] = useState(5);
  const [affineB, setAffineB] = useState(8);
  const [key, setKey] = useState('KEY');
  const [rails, setRails] = useState(3);

  const effectiveCipher = useMemo(() => {
    const isValidCipher = cipherOptions.some(opt => opt.value === cipher);
    return isValidCipher ? cipher : getDefaultCipher(activeTab);
  }, [activeTab, cipher, cipherOptions]);

  const handleEncrypt = () => {
    if (!input) { message.warning('请输入文本'); return; }
    try {
      let result = '';
      switch (effectiveCipher) {
        case 'caesar': result = classical.caesarEncrypt(input, shift); break;
        case 'rot13': result = classical.rot13(input); break;
        case 'rot47': result = classical.rot47(input); break;
        case 'atbash': result = classical.atbash(input); break;
        case 'affine': result = classical.affineEncrypt(input, affineA, affineB); break;
        case 'vigenere': result = classical.vigenereEncrypt(input, key); break;
        case 'railfence': result = classical.railFenceEncrypt(input, rails); break;
        case 'bacon': result = classical.baconEncrypt(input); break;
        case 'morse': result = classical.morseEncrypt(input); break;
        case 'polybius': result = classical.polybiusEncrypt(input); break;
        case 'pigpen': result = classical.pigpenEncrypt(input); break;
        case 'keyboard': result = classical.keyboardEncrypt(input); break;
        case 't9': result = classical.t9Encrypt(input); break;
        case 'playfair': result = classical.playfairEncrypt(input, key); break;
        case 'columnar': result = classical.columnarEncrypt(input, key); break;
      }
      setOutput(result);
      message.success('加密成功');
    } catch (e) {
      message.error(`加密失败: ${e}`);
    }
  };

  const handleDecrypt = () => {
    if (!input) { message.warning('请输入文本'); return; }
    try {
      let result = '';
      switch (effectiveCipher) {
        case 'caesar': result = classical.caesarDecrypt(input, shift); break;
        case 'rot13': result = classical.rot13(input); break;
        case 'rot47': result = classical.rot47(input); break;
        case 'atbash': result = classical.atbash(input); break;
        case 'affine': result = classical.affineDecrypt(input, affineA, affineB); break;
        case 'vigenere': result = classical.vigenereDecrypt(input, key); break;
        case 'railfence': result = classical.railFenceDecrypt(input, rails); break;
        case 'bacon': result = classical.baconDecrypt(input); break;
        case 'morse': result = classical.morseDecrypt(input); break;
        case 'polybius': result = classical.polybiusDecrypt(input); break;
        case 'pigpen': result = classical.pigpenDecrypt(input); break;
        case 'keyboard': result = classical.keyboardDecrypt(input); break;
        case 't9': result = classical.t9Decrypt(input); break;
        case 'playfair': result = classical.playfairDecrypt(input, key); break;
        case 'columnar': result = classical.columnarDecrypt(input, key); break;
      }
      setOutput(result);
      message.success('解密成功');
    } catch (e) {
      message.error(`解密失败: ${e}`);
    }
  };

  const handleCaesarBruteForce = () => {
    if (!input) { message.warning('请输入文本'); return; }
    const results = [];
    for (let i = 1; i <= 25; i++) {
      results.push(`[${i.toString().padStart(2, '0')}] ${classical.caesarDecrypt(input, i)}`);
    }
    setOutput(results.join('\n'));
  };

  const renderParams = () => {
    switch (effectiveCipher) {
      case 'caesar':
        return (
          <Space>
            <span>位移:</span>
            <InputNumber value={shift} onChange={(v) => setShift(v || 0)} min={1} max={25} />
            <Button size="small" onClick={handleCaesarBruteForce}>暴力破解</Button>
          </Space>
        );
      case 'affine':
        return (
          <Space wrap>
            <span>a:</span>
            <InputNumber value={affineA} onChange={(v) => setAffineA(v || 1)} min={1} max={25} />
            <span>b:</span>
            <InputNumber value={affineB} onChange={(v) => setAffineB(v || 0)} min={0} max={25} />
            <span style={{ fontSize: 12, color: '#888' }}>(a需与26互质)</span>
          </Space>
        );
      case 'vigenere':
      case 'playfair':
      case 'columnar':
        return (
          <Space>
            <span>密钥:</span>
            <Input value={key} onChange={(e) => setKey(e.target.value)} style={{ width: 150 }} />
          </Space>
        );
      case 'railfence':
        return (
          <Space>
            <span>栏数:</span>
            <InputNumber value={rails} onChange={(v) => setRails(v || 2)} min={2} max={20} />
          </Space>
        );
      default:
        return null;
    }
  };

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
      <Card size="small" title="密码选择">
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Space wrap>
            <span>密码类型:</span>
            <Select
              value={effectiveCipher}
              onChange={(v) => setCipher(v as CipherType)}
              options={cipherOptions}
              style={{ width: 160 }}
            />
          </Space>
          {renderParams()}
        </Space>
      </Card>

      <TextArea
        autoSize={{ minRows: 4, maxRows: 20 }}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入明文或密文"
      />

      <Space>
        <Button type="primary" onClick={handleEncrypt}>加密</Button>
        <Button type="primary" onClick={handleDecrypt}>解密</Button>
        <Button onClick={() => { setInput(''); setOutput(''); }}>清空</Button>
      </Space>

      <TextArea autoSize={{ minRows: 6, maxRows: 20 }} value={output} readOnly placeholder="输出结果" />
    </Space>
  );
};

export default ClassicalTab;
