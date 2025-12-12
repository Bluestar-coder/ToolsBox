import React, { useState } from 'react';
import { Input, Button, Space, message, Alert, Card, Typography, Select } from 'antd';
import { generateECDHKeyPair, ecdhGetSharedSecret, type ECDSACurve } from '../../utils/asymmetric';

const { TextArea } = Input;
const { Text } = Typography;

const curveOptions = [
  { value: 'secp256k1', label: 'secp256k1 (比特币/以太坊)' },
  { value: 'p256', label: 'P-256 (NIST)' },
  { value: 'p384', label: 'P-384 (NIST)' },
];

const ECDHTab: React.FC = () => {
  const [curve, setCurve] = useState<ECDSACurve>('secp256k1');
  const [myPrivateKey, setMyPrivateKey] = useState('');
  const [myPublicKey, setMyPublicKey] = useState('');
  const [peerPublicKey, setPeerPublicKey] = useState('');
  const [sharedSecret, setSharedSecret] = useState('');

  const handleGenerateKeyPair = () => {
    try {
      const keyPair = generateECDHKeyPair(curve);
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
      const secret = ecdhGetSharedSecret(myPrivateKey, peerPublicKey, curve);
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
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Card title="ECDH 密钥设置" size="small">
        <Space wrap>
          <Text>曲线:</Text>
          <Select
            value={curve}
            onChange={setCurve}
            options={curveOptions}
            style={{ width: 220 }}
          />
          <Button type="primary" onClick={handleGenerateKeyPair}>
            生成密钥对
          </Button>
        </Space>
      </Card>

      <Card title="我的密钥对" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">公钥 (Hex 压缩格式):</Text>
            <TextArea rows={2} value={myPublicKey} readOnly placeholder="生成后显示公钥" />
          </div>
          <div>
            <Text type="secondary">私钥 (Hex):</Text>
            <TextArea rows={2} value={myPrivateKey} readOnly placeholder="生成后显示私钥" />
          </div>
        </Space>
      </Card>

      <Card title="密钥交换" size="small">
        <Space direction="vertical" style={{ width: '100%' }}>
          <div>
            <Text type="secondary">对方公钥 (Hex):</Text>
            <TextArea
              rows={2}
              value={peerPublicKey}
              onChange={(e) => setPeerPublicKey(e.target.value)}
              placeholder="输入对方的公钥 (压缩或非压缩格式)"
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
            <TextArea rows={2} value={sharedSecret} readOnly placeholder="计算后显示共享密钥" />
          </div>
        </Space>
      </Card>

      <Alert
        type="info"
        message="ECDH 是基于椭圆曲线的 Diffie-Hellman 密钥交换协议，双方交换公钥后可计算出相同的共享密钥用于对称加密。"
      />
    </Space>
  );
};

export default ECDHTab;
