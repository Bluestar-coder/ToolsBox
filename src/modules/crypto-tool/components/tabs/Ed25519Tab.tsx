import React, { useState } from 'react';
import { Card, Input, Button, Space, message, Switch, Select } from 'antd';
import { generateEd25519KeyPair, ed25519Sign, ed25519Verify, ed25519SignBytes, ed25519VerifyBytes } from '../../utils/asymmetric';
import { hashMessageToUint8Array } from '../../utils/helpers';

const { TextArea } = Input;

const Ed25519Tab: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [outputError, setOutputError] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [prehash, setPrehash] = useState(false);
  const [hashAlg, setHashAlg] = useState<'SHA256' | 'SHA384' | 'SHA512'>('SHA256');

  const handleGenerateKeyPair = () => {
    try {
      const keyPair = generateEd25519KeyPair();
      setPublicKey(keyPair.publicKey);
      setPrivateKey(keyPair.privateKey);
      message.success('Ed25519 密钥对生成成功');
    } catch (error) {
      message.error('密钥生成失败: ' + (error as Error).message);
    }
  };

  const handleSign = () => {
    if (!inputText) { message.warning('请输入要签名的内容'); return; }
    if (!privateKey) { message.warning('请输入私钥'); return; }

    try {
      const signature = prehash
        ? ed25519SignBytes(hashMessageToUint8Array(inputText, hashAlg), privateKey)
        : ed25519Sign(inputText, privateKey);
      setOutputText(signature);
      setOutputError('');
      message.success('Ed25519 签名成功');
    } catch (error) {
      setOutputError('Ed25519 签名失败: ' + (error as Error).message);
    }
  };

  const handleVerify = () => {
    if (!inputText) { message.warning('请输入原文'); return; }
    if (!outputText) { message.warning('请在结果框输入签名'); return; }
    if (!publicKey) { message.warning('请输入公钥'); return; }

    try {
      const isValid = prehash
        ? ed25519VerifyBytes(hashMessageToUint8Array(inputText, hashAlg), outputText, publicKey)
        : ed25519Verify(inputText, outputText, publicKey);
      if (isValid) {
        message.success('Ed25519 签名验证通过 ✓');
        setOutputError('');
      } else {
        setOutputError('Ed25519 签名验证失败 ✗');
      }
    } catch (error) {
      setOutputError('Ed25519 验签失败: ' + (error as Error).message);
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
        autoSize={{ minRows: 6, maxRows: 20 }}
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
              <TextArea value={outputText} readOnly autoSize={{ minRows: 3, maxRows: 20 }} style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 8 }} />
              <Button size="small" onClick={handleCopyOutput}>复制</Button>
            </>
          )}
        </Card>
      )}

      <Card size="small" title="Ed25519 密钥设置" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px 16px', alignItems: 'center' }}>
          <span>预哈希:</span>
          <Space>
            <Switch checked={prehash} onChange={setPrehash} />
            <Select
              value={hashAlg}
              onChange={setHashAlg}
              style={{ width: 120 }}
              disabled={!prehash}
              options={[
                { value: 'SHA256', label: 'SHA-256' },
                { value: 'SHA384', label: 'SHA-384' },
                { value: 'SHA512', label: 'SHA-512' },
              ]}
            />
          </Space>

          <span>公钥:</span>
          <Space style={{ width: '100%' }}>
            <Input
              value={publicKey}
              onChange={(e) => setPublicKey(e.target.value)}
              placeholder="32字节公钥 (Hex)"
              style={{ fontFamily: 'monospace', fontSize: 11, flex: 1 }}
            />
          </Space>

          <span>私钥:</span>
          <Input
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="32字节私钥 (Hex)"
            style={{ fontFamily: 'monospace', fontSize: 11 }}
          />

          <span></span>
          <Button type="primary" onClick={handleGenerateKeyPair}>生成密钥对</Button>
        </div>
        <div style={{ marginTop: 12, padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
          ℹ️ Ed25519 是现代高性能椭圆曲线签名算法，密钥短、签名快、安全性高。广泛用于 SSH、TLS 1.3、区块链等。
        </div>
      </Card>
    </>
  );
};

export default Ed25519Tab;
