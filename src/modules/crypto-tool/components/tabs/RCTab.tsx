import React, { useState } from 'react';
import { Input, Button, Space, message, Alert, Select, Card, Typography } from 'antd';
import {
  rc4Encrypt, rc4Decrypt, rc4DropEncrypt, rc4DropDecrypt,
  rc2Encrypt, rc2Decrypt, generateRC2Key, generateRC4Key,
} from '../../utils/rc';

const { TextArea } = Input;
const { Text } = Typography;

type RCAlgorithm = 'rc4' | 'rc4drop' | 'rc2';

const algorithmOptions = [
  { value: 'rc4', label: 'RC4 (流密码)' },
  { value: 'rc4drop', label: 'RC4Drop (增强版)' },
  { value: 'rc2', label: 'RC2 (分组密码)' },
];

const RCTab: React.FC = () => {
  const [algorithm, setAlgorithm] = useState<RCAlgorithm>('rc4');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [key, setKey] = useState('');
  const [drop, setDrop] = useState(768);
  const [inputEncoding, setInputEncoding] = useState<'Hex' | 'Base64'>('Hex');
  const [outputEncoding, setOutputEncoding] = useState<'Hex' | 'Base64'>('Hex');

  const hexToBase64 = (hex: string): string => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.substr(i, 2), 16);
    return btoa(String.fromCharCode(...bytes));
  };

  const base64ToHex = (b64: string): string => {
    const binary = atob(b64);
    return Array.from(binary).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  };

  const handleEncrypt = () => {
    if (!input || !key) { message.warning('请输入明文和密钥'); return; }
    try {
      let resultHex = '';
      switch (algorithm) {
        case 'rc4': resultHex = rc4Encrypt(input, key); break;
        case 'rc4drop': resultHex = rc4DropEncrypt(input, key, drop); break;
        case 'rc2': resultHex = rc2Encrypt(input, key); break;
      }
      setOutput(outputEncoding === 'Base64' ? hexToBase64(resultHex) : resultHex);
      message.success('加密成功');
    } catch (error) {
      message.error(`加密失败: ${error}`);
    }
  };

  const handleDecrypt = () => {
    if (!input || !key) { message.warning('请输入密文和密钥'); return; }
    try {
      const cipherHex = inputEncoding === 'Base64' ? base64ToHex(input) : input;
      let result = '';
      switch (algorithm) {
        case 'rc4': result = rc4Decrypt(cipherHex, key); break;
        case 'rc4drop': result = rc4DropDecrypt(cipherHex, key, drop); break;
        case 'rc2': result = rc2Decrypt(cipherHex, key); break;
      }
      setOutput(result);
      message.success('解密成功');
    } catch (error) {
      message.error(`解密失败: ${error}`);
    }
  };

  const handleGenerateKey = () => {
    setKey(algorithm === 'rc2' ? generateRC2Key(16) : generateRC4Key(16));
    message.success('密钥生成成功');
  };

  const getAlgorithmInfo = () => {
    switch (algorithm) {
      case 'rc4': return '⚠️ RC4 已被证明存在安全漏洞，TLS 1.3 已禁用，仅供学习参考。';
      case 'rc4drop': return 'RC4Drop 丢弃前 N 个字节输出，可缓解部分 RC4 弱点，但仍不推荐用于生产。';
      case 'rc2': return 'RC2 是 64 位分组密码，密钥长度可变，曾用于 S/MIME，现已过时。';
      default: return '';
    }
  };

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
      <Card size="small" title="RC 算法设置">
        <Space orientation="vertical" style={{ width: '100%' }} size="small">
          <Space wrap>
            <Text>算法:</Text>
            <Select value={algorithm} onChange={setAlgorithm} options={algorithmOptions} style={{ width: 180 }} />
            {algorithm === 'rc4drop' && (
              <>
                <Text>丢弃字节:</Text>
                <Input type="number" value={drop} onChange={(e) => setDrop(Number(e.target.value))} style={{ width: 100 }} />
              </>
            )}
          </Space>
          <Space wrap>
            <Text>密钥:</Text>
            <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder={algorithm === 'rc2' ? 'Hex格式' : '字符串'} style={{ width: 280 }} />
            <Button size="small" onClick={handleGenerateKey}>生成密钥</Button>
          </Space>
          <Space wrap>
            <Text>密文格式:</Text>
            <Select value={inputEncoding} onChange={setInputEncoding} style={{ width: 160 }}
              options={[{ value: 'Hex', label: 'Hex (解密用)' }, { value: 'Base64', label: 'Base64 (解密用)' }]} />
            <Select value={outputEncoding} onChange={setOutputEncoding} style={{ width: 170 }}
              options={[{ value: 'Hex', label: 'Hex (加密输出)' }, { value: 'Base64', label: 'Base64 (加密输出)' }]} />
          </Space>
        </Space>
      </Card>

      <TextArea rows={4} value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入明文或密文" />

      <Space>
        <Button type="primary" style={{ backgroundColor: '#52c41a' }} onClick={handleEncrypt}>加密</Button>
        <Button type="primary" onClick={handleDecrypt}>解密</Button>
        <Button onClick={() => { setInput(''); setOutput(''); }}>清空</Button>
      </Space>

      <TextArea rows={4} value={output} readOnly placeholder="输出结果" />

      <Alert type="warning" message={getAlgorithmInfo()} />
    </Space>
  );
};

export default RCTab;
