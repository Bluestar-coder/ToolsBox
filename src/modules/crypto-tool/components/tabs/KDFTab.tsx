import React, { useState } from 'react';
import { Input, Button, Space, message, Alert, Card, Typography, Select, InputNumber, Tabs } from 'antd';
import { pbkdf2Derive, hmacGenerate, hmacVerify, generateSalt, hkdfDerive } from '../../utils/kdf';

const { TextArea } = Input;
const { Text } = Typography;

const hashOptions = [
  { value: 'SHA256', label: 'SHA-256' },
  { value: 'SHA512', label: 'SHA-512' },
  { value: 'SHA1', label: 'SHA-1' },
];

const hmacHashOptions = [
  { value: 'SHA256', label: 'SHA-256' },
  { value: 'SHA512', label: 'SHA-512' },
  { value: 'SHA1', label: 'SHA-1' },
  { value: 'MD5', label: 'MD5' },
];

const KDFTab: React.FC = () => {
  const [activeTab, setActiveTab] = useState('pbkdf2');

  // PBKDF2 状态
  const [password, setPassword] = useState('');
  const [salt, setSalt] = useState('');
  const [iterations, setIterations] = useState(10000);
  const [keySize, setKeySize] = useState(256);
  const [hash, setHash] = useState<'SHA1' | 'SHA256' | 'SHA512'>('SHA256');
  const [derivedKey, setDerivedKey] = useState('');

  // HMAC 状态
  const [hmacMessage, setHmacMessage] = useState('');
  const [hmacKey, setHmacKey] = useState('');
  const [hmacHash, setHmacHash] = useState<'MD5' | 'SHA1' | 'SHA256' | 'SHA512'>('SHA256');
  const [hmacResult, setHmacResult] = useState('');
  const [hmacVerifyInput, setHmacVerifyInput] = useState('');

  // HKDF 状态
  const [hkdfIkm, setHkdfIkm] = useState('');
  const [hkdfSalt, setHkdfSalt] = useState('');
  const [hkdfInfo, setHkdfInfo] = useState('');
  const [hkdfKeyLen, setHkdfKeyLen] = useState(32);
  const [hkdfResult, setHkdfResult] = useState('');

  const handlePbkdf2 = () => {
    if (!password || !salt) {
      message.warning('请输入密码和盐值');
      return;
    }
    try {
      const key = pbkdf2Derive(password, salt, iterations, keySize, hash);
      setDerivedKey(key);
      message.success('密钥派生成功');
    } catch (error) {
      message.error(`派生失败: ${error}`);
    }
  };

  const handleHmacGenerate = () => {
    if (!hmacMessage || !hmacKey) {
      message.warning('请输入消息和密钥');
      return;
    }
    try {
      const result = hmacGenerate(hmacMessage, hmacKey, hmacHash);
      setHmacResult(result);
      message.success('HMAC 生成成功');
    } catch (error) {
      message.error(`生成失败: ${error}`);
    }
  };

  const handleHmacVerify = () => {
    if (!hmacMessage || !hmacKey || !hmacVerifyInput) {
      message.warning('请输入消息、密钥和待验证的 HMAC');
      return;
    }
    const isValid = hmacVerify(hmacMessage, hmacKey, hmacVerifyInput, hmacHash);
    if (isValid) {
      message.success('HMAC 验证通过');
    } else {
      message.error('HMAC 验证失败');
    }
  };

  const handleHkdf = async () => {
    if (!hkdfIkm) {
      message.warning('请输入输入密钥材料');
      return;
    }
    try {
      const result = await hkdfDerive(hkdfIkm, hkdfSalt, hkdfInfo, hkdfKeyLen);
      setHkdfResult(result);
      message.success('HKDF 派生成功');
    } catch (error) {
      message.error(`派生失败: ${error}`);
    }
  };

  const tabItems = [
    {
      key: 'pbkdf2',
      label: 'PBKDF2',
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card size="small" title="PBKDF2 参数">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                addonBefore="密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码"
              />
              <Space>
                <Input
                  addonBefore="盐值"
                  value={salt}
                  onChange={(e) => setSalt(e.target.value)}
                  placeholder="输入盐值"
                  style={{ width: 300 }}
                />
                <Button size="small" onClick={() => setSalt(generateSalt())}>生成盐</Button>
              </Space>
              <Space wrap>
                <Text>迭代次数:</Text>
                <InputNumber value={iterations} onChange={(v) => setIterations(v || 10000)} min={1000} />
                <Text>密钥长度:</Text>
                <Select value={keySize} onChange={setKeySize} options={[
                  { value: 128, label: '128位' },
                  { value: 256, label: '256位' },
                  { value: 512, label: '512位' },
                ]} style={{ width: 100 }} />
                <Text>哈希:</Text>
                <Select value={hash} onChange={setHash} options={hashOptions} style={{ width: 120 }} />
              </Space>
            </Space>
          </Card>
          <Button type="primary" onClick={handlePbkdf2}>派生密钥</Button>
          <TextArea rows={2} value={derivedKey} readOnly placeholder="派生的密钥 (Hex)" />
          <Alert type="info" message="PBKDF2 通过多次迭代增加暴力破解难度，推荐迭代次数 >= 10000。" />
        </Space>
      ),
    },
    {
      key: 'hmac',
      label: 'HMAC',
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card size="small" title="HMAC 参数">
            <Space direction="vertical" style={{ width: '100%' }}>
              <TextArea
                rows={2}
                value={hmacMessage}
                onChange={(e) => setHmacMessage(e.target.value)}
                placeholder="输入消息"
              />
              <Input
                addonBefore="密钥"
                value={hmacKey}
                onChange={(e) => setHmacKey(e.target.value)}
                placeholder="输入密钥"
              />
              <Space>
                <Text>哈希算法:</Text>
                <Select value={hmacHash} onChange={setHmacHash} options={hmacHashOptions} style={{ width: 120 }} />
              </Space>
            </Space>
          </Card>
          <Space>
            <Button type="primary" onClick={handleHmacGenerate}>生成 HMAC</Button>
          </Space>
          <TextArea rows={2} value={hmacResult} readOnly placeholder="HMAC 结果 (Hex)" />
          <Card size="small" title="HMAC 验证">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                value={hmacVerifyInput}
                onChange={(e) => setHmacVerifyInput(e.target.value)}
                placeholder="输入待验证的 HMAC"
              />
              <Button onClick={handleHmacVerify}>验证 HMAC</Button>
            </Space>
          </Card>
          <Alert type="info" message="HMAC 用于验证消息完整性和真实性，结合密钥和哈希函数。" />
        </Space>
      ),
    },
    {
      key: 'hkdf',
      label: 'HKDF',
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card size="small" title="HKDF 参数">
            <Space direction="vertical" style={{ width: '100%' }}>
              <Input
                addonBefore="IKM"
                value={hkdfIkm}
                onChange={(e) => setHkdfIkm(e.target.value)}
                placeholder="输入密钥材料 (Input Keying Material)"
              />
              <Input
                addonBefore="Salt"
                value={hkdfSalt}
                onChange={(e) => setHkdfSalt(e.target.value)}
                placeholder="盐值 (可选)"
              />
              <Input
                addonBefore="Info"
                value={hkdfInfo}
                onChange={(e) => setHkdfInfo(e.target.value)}
                placeholder="上下文信息 (可选)"
              />
              <Space>
                <Text>输出长度:</Text>
                <InputNumber value={hkdfKeyLen} onChange={(v) => setHkdfKeyLen(v || 32)} min={1} max={255} />
                <Text>字节</Text>
              </Space>
            </Space>
          </Card>
          <Button type="primary" onClick={handleHkdf}>派生密钥</Button>
          <TextArea rows={2} value={hkdfResult} readOnly placeholder="派生的密钥 (Hex)" />
          <Alert type="info" message="HKDF 是基于 HMAC 的密钥派生函数，用于从共享密钥派生多个密钥。" />
        </Space>
      ),
    },
  ];

  return (
    <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} size="small" />
  );
};

export default KDFTab;
