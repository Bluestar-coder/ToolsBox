import React, { useState } from 'react';
import { Input, Button, Space, message, Alert, Card, Typography } from 'antd';
import { blowfishEncrypt, blowfishDecrypt, generateBlowfishKey } from '../../utils/blowfish';

const { TextArea } = Input;
const { Text } = Typography;

const BlowfishTab: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [key, setKey] = useState('');

  const handleEncrypt = () => {
    if (!input || !key) {
      message.warning('请输入明文和密钥');
      return;
    }
    try {
      const result = blowfishEncrypt(input, key);
      setOutput(result);
      message.success('加密成功');
    } catch (error) {
      message.error(`加密失败: ${error}`);
    }
  };

  const handleDecrypt = () => {
    if (!input || !key) {
      message.warning('请输入密文和密钥');
      return;
    }
    try {
      const result = blowfishDecrypt(input, key);
      setOutput(result);
      message.success('解密成功');
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : String(error);
      message.error(`解密失败: ${errMsg}`);
    }
  };

  const handleGenerateKey = () => {
    const newKey = generateBlowfishKey(16);
    setKey(newKey);
    message.success('密钥生成成功');
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Card size="small" title="密钥设置">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Text>密钥 (Hex, 4-56字节):</Text>
            <Button size="small" onClick={handleGenerateKey}>生成密钥</Button>
          </Space>
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="输入 Hex 格式密钥 (8-112个字符)"
          />
        </Space>
      </Card>

      <TextArea
        rows={4}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入明文或密文 (Hex)"
      />

      <Space>
        <Button type="primary" onClick={handleEncrypt}>加密</Button>
        <Button type="primary" onClick={handleDecrypt}>解密</Button>
        <Button onClick={() => { setInput(''); setOutput(''); }}>清空</Button>
      </Space>

      <TextArea rows={4} value={output} readOnly placeholder="输出结果" />

      <Alert
        type="info"
        message="Blowfish 是 64 位分组密码，密钥长度 32-448 位。虽然安全性尚可，但因块大小较小，推荐使用 AES。"
      />
    </Space>
  );
};

export default BlowfishTab;
