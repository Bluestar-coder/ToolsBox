import React, { useState } from 'react';
import { Input, Button, Space, message, Alert, Card, Typography, Select } from 'antd';
import { blowfishEncrypt, blowfishDecrypt, generateBlowfishKey } from '../../utils/blowfish';

const { TextArea } = Input;
const { Text } = Typography;

const BlowfishTab: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [key, setKey] = useState('');
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
      const resultHex = blowfishEncrypt(input, key);
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
      const result = blowfishDecrypt(cipherHex, key);
      setOutput(result);
      message.success('解密成功');
    } catch (error) {
      message.error(`解密失败: ${error instanceof Error ? error.message : error}`);
    }
  };

  const handleGenerateKey = () => {
    setKey(generateBlowfishKey(16));
    message.success('密钥生成成功');
  };

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
      <Card size="small" title="Blowfish 设置">
        <Space orientation="vertical" style={{ width: '100%' }} size="small">
          <Space wrap>
            <Text>密钥 (Hex):</Text>
            <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder="8-112个Hex字符" style={{ width: 300 }} />
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

      <TextArea autoSize={{ minRows: 4, maxRows: 20 }} value={input} onChange={(e) => setInput(e.target.value)} placeholder="输入明文或密文" />

      <Space>
        <Button type="primary" style={{ backgroundColor: '#52c41a' }} onClick={handleEncrypt}>加密</Button>
        <Button type="primary" onClick={handleDecrypt}>解密</Button>
        <Button onClick={() => { setInput(''); setOutput(''); }}>清空</Button>
      </Space>

      <TextArea autoSize={{ minRows: 4, maxRows: 20 }} value={output} readOnly placeholder="输出结果" />

      <Alert type="info" message="Blowfish 是 64 位分组密码，密钥长度 32-448 位。虽然安全性尚可，但因块大小较小，推荐使用 AES。" />
    </Space>
  );
};

export default BlowfishTab;
