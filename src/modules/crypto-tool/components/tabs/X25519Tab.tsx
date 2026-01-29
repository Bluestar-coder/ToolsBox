import React, { useState } from 'react';
import { Input, Button, Space, message, Alert, Card, Typography } from 'antd';
import { generateX25519KeyPair, x25519GetSharedSecret } from '../../utils/asymmetric';

const { TextArea } = Input;
const { Text } = Typography;

const X25519Tab: React.FC = () => {
  const [myPrivateKey, setMyPrivateKey] = useState('');
  const [myPublicKey, setMyPublicKey] = useState('');
  const [peerPublicKey, setPeerPublicKey] = useState('');
  const [sharedSecret, setSharedSecret] = useState('');

  const handleGenerateKeyPair = () => {
    try {
      const keyPair = generateX25519KeyPair();
      setMyPrivateKey(keyPair.privateKey);
      setMyPublicKey(keyPair.publicKey);
      message.success('密钥对生成成功');
    } catch (error) {
      message.error(`密钥生成失败: ${error}`);
    }
  };

  const handleComputeSharedSecret = () => {
    if (!myPrivateKey || !peerPublicKey) {
      message.warning('请输入我的私钥和对方公钥');
      return;
    }
    try {
      const secret = x25519GetSharedSecret(myPrivateKey, peerPublicKey);
      setSharedSecret(secret);
      message.success('共享密钥计算成功');
    } catch (error) {
      message.error(`计算失败: ${error}`);
    }
  };

  const handleClear = () => {
    setMyPrivateKey('');
    setMyPublicKey('');
    setPeerPublicKey('');
    setSharedSecret('');
  };

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
      <Card title="我的密钥对" size="small">
        <Space orientation="vertical" style={{ width: '100%' }}>
          <Button type="primary" onClick={handleGenerateKeyPair}>
            生成密钥对
          </Button>
          <div>
            <Text type="secondary">公钥 (Hex):</Text>
            <TextArea autoSize={{ minRows: 2, maxRows: 20 }} value={myPublicKey} readOnly placeholder="生成后显示公钥" />
          </div>
          <div>
            <Text type="secondary">私钥 (Hex):</Text>
            <TextArea autoSize={{ minRows: 2, maxRows: 20 }} value={myPrivateKey} readOnly placeholder="生成后显示私钥" />
          </div>
        </Space>
      </Card>

      <Card title="密钥交换" size="small">
        <Space orientation="vertical" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">对方公钥 (Hex):</Text>
            <TextArea
              autoSize={{ minRows: 2, maxRows: 20 }}
              value={peerPublicKey}
              onChange={(e) => setPeerPublicKey(e.target.value)}
              placeholder="输入对方的公钥"
            />
          </div>
          <Space>
            <Button type="primary" onClick={handleComputeSharedSecret}>
              计算共享密钥
            </Button>
            <Button onClick={handleClear}>清空</Button>
          </Space>
          <div>
            <Text type="secondary">共享密钥 (Hex):</Text>
            <TextArea autoSize={{ minRows: 2, maxRows: 20 }} value={sharedSecret} readOnly placeholder="计算后显示共享密钥" />
          </div>
        </Space>
      </Card>

      <Alert
        type="info"
        message="X25519 是基于 Curve25519 的密钥交换算法，双方各自生成密钥对，交换公钥后可计算出相同的共享密钥。"
      />
    </Space>
  );
};

export default X25519Tab;
