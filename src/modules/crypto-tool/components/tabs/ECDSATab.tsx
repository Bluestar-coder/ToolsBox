import React, { useState } from 'react';
import { Card, Input, Select, Button, Space, message } from 'antd';
import { generateECDSAKeyPair, ecdsaSign, ecdsaVerify, type ECDSACurve } from '../../utils/asymmetric';

const { TextArea } = Input;

const ECDSATab: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [outputError, setOutputError] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [curve, setCurve] = useState<ECDSACurve>('secp256k1');

  const handleGenerateKeyPair = () => {
    try {
      const keyPair = generateECDSAKeyPair(curve);
      setPublicKey(keyPair.publicKey);
      setPrivateKey(keyPair.privateKey);
      message.success('ECDSA 密钥对生成成功');
    } catch (error) {
      message.error('密钥生成失败: ' + (error as Error).message);
    }
  };

  const handleSign = () => {
    if (!inputText) { message.warning('请输入要签名的内容'); return; }
    if (!privateKey) { message.warning('请输入私钥'); return; }

    try {
      const signature = ecdsaSign(inputText, privateKey, curve);
      setOutputText(signature);
      setOutputError('');
      message.success('ECDSA 签名成功');
    } catch (error) {
      setOutputError('ECDSA 签名失败: ' + (error as Error).message);
    }
  };

  const handleVerify = () => {
    if (!inputText) { message.warning('请输入原文'); return; }
    if (!outputText) { message.warning('请在结果框输入签名'); return; }
    if (!publicKey) { message.warning('请输入公钥'); return; }

    try {
      const isValid = ecdsaVerify(inputText, outputText, publicKey, curve);
      if (isValid) {
        message.success('ECDSA 签名验证通过 ✓');
        setOutputError('');
      } else {
        setOutputError('ECDSA 签名验证失败 ✗');
      }
    } catch (error) {
      setOutputError('ECDSA 验签失败: ' + (error as Error).message);
    }
  };

  const handleCopyOutput = async () => {
    if (!outputText) { message.warning('没有可复制的内容'); return; }
    try {
      await navigator.clipboard.writeText(outputText);
      message.success('已复制到剪贴板');
    } catch { message.error('复制失败'); }
  };

  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setOutputError('');
  };

  return (
    <>
      <TextArea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="请输入要签名/验签的内容"
        rows={6}
        style={{ marginBottom: 16, fontFamily: 'monospace' }}
      />

      <Space style={{ marginBottom: 16 }}>
        <Button style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: '#fff' }} onClick={handleSign}>
          签名
        </Button>
        <Button style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2', color: '#fff' }} onClick={handleVerify}>
          验签
        </Button>
        <Button danger onClick={handleClear}>
          清空
        </Button>
      </Space>

      {(outputText || outputError) && (
        <Card size="small" style={{ marginBottom: 16, backgroundColor: outputError ? '#fff2f0' : '#f6ffed', borderColor: outputError ? '#ffccc7' : '#b7eb8f' }}>
          {outputError ? (
            <div style={{ color: '#ff4d4f' }}>{outputError}</div>
          ) : (
            <>
              <TextArea value={outputText} readOnly rows={3} style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 8 }} />
              <Button size="small" onClick={handleCopyOutput}>复制</Button>
            </>
          )}
        </Card>
      )}

      <Card size="small" title="ECDSA 密钥设置" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px 16px', alignItems: 'center' }}>
          <span>曲线:</span>
          <Space>
            <Select
              value={curve}
              onChange={setCurve}
              style={{ width: 180 }}
              options={[
                { value: 'secp256k1', label: 'secp256k1 (比特币/以太坊)' },
                { value: 'p256', label: 'P-256 (NIST)' },
                { value: 'p384', label: 'P-384 (NIST)' },
              ]}
            />
            <Button type="primary" onClick={handleGenerateKeyPair}>生成密钥对</Button>
          </Space>

          <span>公钥:</span>
          <Input
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            placeholder="压缩格式公钥 (Hex)"
            style={{ fontFamily: 'monospace', fontSize: 11 }}
          />

          <span>私钥:</span>
          <Input
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="私钥 (Hex)"
            style={{ fontFamily: 'monospace', fontSize: 11 }}
          />
        </div>
        <div style={{ marginTop: 12, padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
          ℹ️ ECDSA 是基于椭圆曲线的数字签名算法。secp256k1 用于比特币和以太坊，P-256/P-384 是 NIST 标准曲线。
        </div>
      </Card>
    </>
  );
};

export default ECDSATab;
