import React, { useState } from 'react';
import { Card, Input, Select, Button, Space, message, Tabs } from 'antd';
import { generateRSAKeyPair, generateRSASignKeyPair, rsaEncryptAuto, rsaDecryptAuto, rsaSign, rsaVerify } from '../../utils/asymmetric';

const { TextArea } = Input;

type RSAMode = 'encrypt' | 'sign';

const RSATab: React.FC = () => {
  const [mode, setMode] = useState<RSAMode>('encrypt');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [outputError, setOutputError] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [privateKey, setPrivateKey] = useState('');
  const [keySize, setKeySize] = useState<number>(2048);
  const [loading, setLoading] = useState(false);

  const handleGenerateKeyPair = async () => {
    setLoading(true);
    try {
      const keyPair = mode === 'encrypt' 
        ? await generateRSAKeyPair(keySize)
        : await generateRSASignKeyPair(keySize);
      setPublicKey(keyPair.publicKey);
      setPrivateKey(keyPair.privateKey);
      message.success('RSA 密钥对生成成功');
    } catch (error) {
      message.error('密钥生成失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleEncrypt = async () => {
    if (!inputText) { message.warning('请输入要加密的内容'); return; }
    if (!publicKey) { message.warning('请输入或生成公钥'); return; }

    setLoading(true);
    try {
      const encrypted = await rsaEncryptAuto(inputText, publicKey);
      setOutputText(encrypted);
      setOutputError('');
      message.success('RSA 加密成功');
    } catch (error) {
      setOutputError('RSA 加密失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleDecrypt = async () => {
    if (!inputText) { message.warning('请输入要解密的密文'); return; }
    if (!privateKey) { message.warning('请输入私钥'); return; }

    setLoading(true);
    try {
      const decrypted = await rsaDecryptAuto(inputText, privateKey);
      setOutputText(decrypted);
      setOutputError('');
      message.success('RSA 解密成功');
    } catch (error) {
      setOutputError('RSA 解密失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleSign = async () => {
    if (!inputText) { message.warning('请输入要签名的内容'); return; }
    if (!privateKey) { message.warning('请输入私钥'); return; }

    setLoading(true);
    try {
      const signature = await rsaSign(inputText, privateKey);
      setOutputText(signature);
      setOutputError('');
      message.success('RSA 签名成功');
    } catch (error) {
      setOutputError('RSA 签名失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async () => {
    if (!inputText) { message.warning('请输入原文'); return; }
    if (!outputText) { message.warning('请在结果框输入签名'); return; }
    if (!publicKey) { message.warning('请输入公钥'); return; }

    setLoading(true);
    try {
      const isValid = await rsaVerify(inputText, outputText, publicKey);
      if (isValid) {
        message.success('RSA 签名验证通过 ✓');
        setOutputError('');
      } else {
        setOutputError('RSA 签名验证失败 ✗');
      }
    } catch (error) {
      setOutputError('RSA 验签失败: ' + (error as Error).message);
    } finally {
      setLoading(false);
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

  const modeItems = [
    { key: 'encrypt', label: '🔐 加密/解密' },
    { key: 'sign', label: '✍️ 签名/验签' },
  ];

  return (
    <>
      <Tabs
        activeKey={mode}
        onChange={(key) => { setMode(key as RSAMode); handleClear(); setPublicKey(''); setPrivateKey(''); }}
        items={modeItems}
        size="small"
        style={{ marginBottom: 16 }}
      />

      <TextArea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder={mode === 'encrypt' ? '请输入要加密/解密的内容' : '请输入要签名/验签的内容'}
        autoSize={{ minRows: 6, maxRows: 20 }}
        style={{ marginBottom: 16, fontFamily: 'monospace' }}
      />

      <Space style={{ marginBottom: 16 }}>
        {mode === 'encrypt' ? (
          <>
            <Button type="primary" style={{ backgroundColor: '#52c41a' }} onClick={handleEncrypt} loading={loading}>
              加密
            </Button>
            <Button type="primary" onClick={handleDecrypt} loading={loading}>
              解密
            </Button>
          </>
        ) : (
          <>
            <Button style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: '#fff' }} onClick={handleSign} loading={loading}>
              签名
            </Button>
            <Button style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2', color: '#fff' }} onClick={handleVerify} loading={loading}>
              验签
            </Button>
          </>
        )}
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
              <TextArea value={outputText} readOnly autoSize={{ minRows: 4, maxRows: 20 }} style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 8 }} />
              <Button size="small" onClick={handleCopyOutput}>复制</Button>
            </>
          )}
        </Card>
      )}

      <Card size="small" title="RSA 密钥设置" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px 16px', alignItems: 'start' }}>
          <span>公钥:</span>
          <TextArea
            value={publicKey}
            onChange={(e) => setPublicKey(e.target.value)}
            placeholder="PEM 格式公钥 (用于加密和验签)"
            autoSize={{ minRows: 4, maxRows: 20 }}
            style={{ fontFamily: 'monospace', fontSize: 10 }}
          />

          <span>私钥:</span>
          <TextArea
            value={privateKey}
            onChange={(e) => setPrivateKey(e.target.value)}
            placeholder="PEM 格式私钥 (用于解密和签名)"
            autoSize={{ minRows: 4, maxRows: 20 }}
            style={{ fontFamily: 'monospace', fontSize: 10 }}
          />

          <span>密钥长度:</span>
          <Space>
            <Select
              value={keySize}
              onChange={setKeySize}
              style={{ width: 120 }}
              options={[
                { value: 1024, label: '1024 位' },
                { value: 2048, label: '2048 位' },
                { value: 4096, label: '4096 位' },
              ]}
            />
            <Button type="primary" onClick={handleGenerateKeyPair} loading={loading}>
              生成密钥对
            </Button>
          </Space>
        </div>
        <div style={{ marginTop: 12, padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
          ℹ️ RSA 更适合短消息；长文本会自动切换为混合加密（RSA‑OAEP + AES‑GCM），输出为 JSON。
        </div>
      </Card>
    </>
  );
};

export default RSATab;
