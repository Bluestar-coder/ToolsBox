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

  const handleEncrypt = () => {
    if (!input || !key) {
      message.warning('请输入明文和密钥');
      return;
    }
    try {
      let result = '';
      switch (algorithm) {
        case 'rc4':
          result = rc4Encrypt(input, key);
          break;
        case 'rc4drop':
          result = rc4DropEncrypt(input, key, drop);
          break;
        case 'rc2':
          result = rc2Encrypt(input, key);
          break;
      }
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
      let result = '';
      switch (algorithm) {
        case 'rc4':
          result = rc4Decrypt(input, key);
          break;
        case 'rc4drop':
          result = rc4DropDecrypt(input, key, drop);
          break;
        case 'rc2':
          result = rc2Decrypt(input, key);
          break;
      }
      setOutput(result);
      message.success('解密成功');
    } catch (error) {
      message.error(`解密失败: ${error}`);
    }
  };

  const handleGenerateKey = () => {
    const newKey = algorithm === 'rc2' ? generateRC2Key(16) : generateRC4Key(16);
    setKey(newKey);
    message.success('密钥生成成功');
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
  };

  const getAlgorithmInfo = () => {
    switch (algorithm) {
      case 'rc4':
        return '⚠️ RC4 已被证明存在安全漏洞，TLS 1.3 已禁用，仅供学习参考。';
      case 'rc4drop':
        return 'RC4Drop 丢弃前 N 个字节输出，可缓解部分 RC4 弱点，但仍不推荐用于生产。';
      case 'rc2':
        return 'RC2 是 64 位分组密码，密钥长度可变，曾用于 S/MIME，现已过时。';
      default:
        return '';
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Card size="small" title="RC 算法设置">
        <Space wrap>
          <Text>算法:</Text>
          <Select
            value={algorithm}
            onChange={setAlgorithm}
            options={algorithmOptions}
            style={{ width: 180 }}
          />
          {algorithm === 'rc4drop' && (
            <>
              <Text>丢弃字节:</Text>
              <Input
                type="number"
                value={drop}
                onChange={(e) => setDrop(Number(e.target.value))}
                style={{ width: 100 }}
              />
            </>
          )}
        </Space>
      </Card>

      <Card size="small" title="密钥">
        <Space direction="vertical" style={{ width: '100%' }}>
          <Space>
            <Text>{algorithm === 'rc2' ? '密钥 (Hex):' : '密钥:'}</Text>
            <Button size="small" onClick={handleGenerateKey}>生成密钥</Button>
          </Space>
          <Input
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder={algorithm === 'rc2' ? '输入 Hex 格式密钥' : '输入密钥字符串'}
          />
        </Space>
      </Card>

      <TextArea
        rows={4}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="输入明文或密文"
      />

      <Space>
        <Button type="primary" onClick={handleEncrypt}>加密</Button>
        <Button type="primary" onClick={handleDecrypt}>解密</Button>
        <Button onClick={handleClear}>清空</Button>
      </Space>

      <TextArea rows={4} value={output} readOnly placeholder="输出结果" />

      <Alert type="warning" message={getAlgorithmInfo()} />
    </Space>
  );
};

export default RCTab;
