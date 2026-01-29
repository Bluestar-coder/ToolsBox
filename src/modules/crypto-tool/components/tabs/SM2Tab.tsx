import React, { useState } from 'react';
import { Card, Input, Select, Button, Space, message } from 'antd';
import * as smCrypto from 'sm-crypto';

const { sm2 } = smCrypto;
const { TextArea } = Input;

const SM2Tab: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [outputError, setOutputError] = useState('');
  const [sm2PublicKey, setSm2PublicKey] = useState('');
  const [sm2PrivateKey, setSm2PrivateKey] = useState('');
  const [sm2CipherMode, setSm2CipherMode] = useState<0 | 1>(1);

  const generateSm2KeyPair = () => {
    const keypair = sm2.generateKeyPairHex();
    setSm2PublicKey(keypair.publicKey);
    setSm2PrivateKey(keypair.privateKey);
    message.success('SM2 密钥对生成成功');
  };

  const handleSm2Encrypt = () => {
    if (!inputText) { message.warning('请输入要加密的内容'); return; }
    if (!sm2PublicKey) { message.warning('请输入或生成公钥'); return; }

    try {
      const encrypted = sm2.doEncrypt(inputText, sm2PublicKey, sm2CipherMode);
      setOutputText(encrypted);
      setOutputError('');
      message.success('SM2 加密成功');
    } catch (error) {
      setOutputError('SM2 加密失败: ' + (error as Error).message);
    }
  };

  const handleSm2Decrypt = () => {
    if (!inputText) { message.warning('请输入要解密的密文'); return; }
    if (!sm2PrivateKey) { message.warning('请输入私钥'); return; }

    try {
      const decrypted = sm2.doDecrypt(inputText, sm2PrivateKey, sm2CipherMode);
      if (!decrypted) {
        setOutputError('SM2 解密失败，请检查密文和私钥');
        return;
      }
      setOutputText(decrypted);
      setOutputError('');
      message.success('SM2 解密成功');
    } catch (error) {
      setOutputError('SM2 解密失败: ' + (error as Error).message);
    }
  };

  const handleSm2Sign = () => {
    if (!inputText) { message.warning('请输入要签名的内容'); return; }
    if (!sm2PrivateKey) { message.warning('请输入私钥'); return; }

    try {
      const signature = sm2.doSignature(inputText, sm2PrivateKey);
      setOutputText(signature);
      setOutputError('');
      message.success('SM2 签名成功');
    } catch (error) {
      setOutputError('SM2 签名失败: ' + (error as Error).message);
    }
  };

  const handleSm2Verify = () => {
    if (!inputText) { message.warning('请输入原文'); return; }
    if (!outputText) { message.warning('请在结果框输入签名'); return; }
    if (!sm2PublicKey) { message.warning('请输入公钥'); return; }

    try {
      const isValid = sm2.doVerifySignature(inputText, outputText, sm2PublicKey);
      if (isValid) {
        message.success('SM2 签名验证通过 ✓');
        setOutputError('');
      } else {
        setOutputError('SM2 签名验证失败 ✗');
      }
    } catch (error) {
      setOutputError('SM2 验签失败: ' + (error as Error).message);
    }
  };

  const handleCopyOutput = async () => {
    if (!outputText) {
      message.warning('没有可复制的内容');
      return;
    }
    try {
      await navigator.clipboard.writeText(outputText);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
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
        placeholder="请输入要加密/签名的内容"
        autoSize={{ minRows: 6, maxRows: 20 }}
        style={{ marginBottom: 16, fontFamily: 'monospace' }}
      />

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" style={{ backgroundColor: '#52c41a' }} onClick={handleSm2Encrypt}>
          加密
        </Button>
        <Button type="primary" onClick={handleSm2Decrypt}>
          解密
        </Button>
        <Button style={{ backgroundColor: '#722ed1', borderColor: '#722ed1', color: '#fff' }} onClick={handleSm2Sign}>
          签名
        </Button>
        <Button style={{ backgroundColor: '#13c2c2', borderColor: '#13c2c2', color: '#fff' }} onClick={handleSm2Verify}>
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
              <TextArea value={outputText} readOnly autoSize={{ minRows: 4, maxRows: 20 }} style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 8 }} />
              <Button size="small" onClick={handleCopyOutput}>复制</Button>
            </>
          )}
        </Card>
      )}

      <Card size="small" title="SM2 密钥设置" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px 16px', alignItems: 'center' }}>
          <span>公钥:</span>
          <Space orientation="vertical" style={{ width: '100%' }}>
            <TextArea
              value={sm2PublicKey}
              onChange={(e) => setSm2PublicKey(e.target.value)}
              placeholder="04开头的公钥 (用于加密和验签)"
              autoSize={{ minRows: 2, maxRows: 20 }}
              style={{ fontFamily: 'monospace', fontSize: 11 }}
            />
          </Space>

          <span>私钥:</span>
          <Space orientation="vertical" style={{ width: '100%' }}>
            <TextArea
              value={sm2PrivateKey}
              onChange={(e) => setSm2PrivateKey(e.target.value)}
              placeholder="私钥 (用于解密和签名)"
              autoSize={{ minRows: 2, maxRows: 20 }}
              style={{ fontFamily: 'monospace', fontSize: 11 }}
            />
          </Space>

          <span>密文格式:</span>
          <Space>
            <Select
              value={sm2CipherMode}
              onChange={(v) => setSm2CipherMode(v as 0 | 1)}
              style={{ width: 150 }}
              options={[
                { value: 1, label: 'C1C3C2 (推荐)' },
                { value: 0, label: 'C1C2C3 (旧版)' },
              ]}
            />
            <Button type="primary" onClick={generateSm2KeyPair}>生成密钥对</Button>
          </Space>
        </div>
        <div style={{ marginTop: 12, padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
          ℹ️ SM2 是中国国家密码管理局发布的椭圆曲线公钥密码算法，用于数字签名和加密
        </div>
      </Card>
    </>
  );
};

export default SM2Tab;
