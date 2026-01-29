import React, { useState } from 'react';
import { Card, Input, Select, Button, Space, message } from 'antd';
import { nobleAesGcmEncrypt, nobleAesGcmDecrypt, aesSivEncrypt, aesSivDecrypt, chacha20Encrypt, chacha20Decrypt } from '../../utils/aead';
import { generateRandomBytes, uint8ArrayToHex, parseKeyToUint8Array } from '../../utils/helpers';
import { encodingOptions, aeadKeyLengthOptions } from '../../utils/constants';

const { TextArea } = Input;

interface AEADTabProps {
  activeTab: string;
}

const AEADTab: React.FC<AEADTabProps> = ({ activeTab }) => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [outputError, setOutputError] = useState('');
  const [key, setKey] = useState('');
  const [keyEncoding, setKeyEncoding] = useState('Utf8');
  const [iv, setIv] = useState('');
  const [ivEncoding, setIvEncoding] = useState('Utf8');
  const [aeadTag, setAeadTag] = useState('');
  const [ciphertextEncoding, setCiphertextEncoding] = useState<'Hex' | 'Base64'>('Hex');
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

  const formatOutput = (hex: string): string => outputEncoding === 'Base64' ? hexToBase64(hex) : hex;
  const parseInput = (input: string): string => ciphertextEncoding === 'Base64' ? base64ToHex(input) : input;

  const handleAesGcmEncrypt = () => {
    if (!inputText) { message.warning('请输入要加密的内容'); return; }
    if (!key) { message.warning('请输入密钥'); return; }
    if (!iv) { message.warning('请输入 IV/Nonce (推荐12字节)'); return; }

    try {
      const keyBytes = parseKeyToUint8Array(key, keyEncoding);
      const ivBytes = parseKeyToUint8Array(iv, ivEncoding);
      
      if (![16, 24, 32].includes(keyBytes.length)) {
        message.error('AES-GCM 密钥长度必须是 16/24/32 字节');
        return;
      }

      const result = nobleAesGcmEncrypt(inputText, keyBytes, ivBytes);
      setOutputText(formatOutput(result.ciphertext));
      setAeadTag(formatOutput(result.tag));
      setOutputError('');
      message.success('AES-GCM 加密成功');
    } catch (error) {
      setOutputError('加密失败: ' + (error as Error).message);
    }
  };

  const handleAesGcmDecrypt = () => {
    if (!inputText) { message.warning('请输入要解密的密文'); return; }
    if (!key) { message.warning('请输入密钥'); return; }
    if (!iv) { message.warning('请输入 IV/Nonce'); return; }
    if (!aeadTag) { message.warning('请输入认证标签 (Tag)'); return; }

    try {
      const keyBytes = parseKeyToUint8Array(key, keyEncoding);
      const ivBytes = parseKeyToUint8Array(iv, ivEncoding);

      const plaintext = nobleAesGcmDecrypt(parseInput(inputText), parseInput(aeadTag), keyBytes, ivBytes);
      setOutputText(plaintext);
      setOutputError('');
      message.success('AES-GCM 解密成功');
    } catch {
      setOutputError('解密失败: 认证标签验证失败或密钥/IV 错误');
    }
  };

  const handleAesSivEncrypt = () => {
    if (!inputText) { message.warning('请输入要加密的内容'); return; }
    if (!key) { message.warning('请输入密钥'); return; }
    if (!iv) { message.warning('请输入 Nonce'); return; }

    try {
      const keyBytes = parseKeyToUint8Array(key, keyEncoding);
      const ivBytes = parseKeyToUint8Array(iv, ivEncoding);
      
      if (![16, 32].includes(keyBytes.length)) {
        message.error('AES-SIV 密钥长度必须是 16 或 32 字节');
        return;
      }

      const result = aesSivEncrypt(inputText, keyBytes, ivBytes);
      setOutputText(formatOutput(result.ciphertext));
      setAeadTag(formatOutput(result.tag));
      setOutputError('');
      message.success('AES-SIV 加密成功');
    } catch (error) {
      setOutputError('加密失败: ' + (error as Error).message);
    }
  };

  const handleAesSivDecrypt = () => {
    if (!inputText) { message.warning('请输入要解密的密文'); return; }
    if (!key) { message.warning('请输入密钥'); return; }
    if (!iv) { message.warning('请输入 Nonce'); return; }
    if (!aeadTag) { message.warning('请输入认证标签 (Tag)'); return; }

    try {
      const keyBytes = parseKeyToUint8Array(key, keyEncoding);
      const ivBytes = parseKeyToUint8Array(iv, ivEncoding);

      const plaintext = aesSivDecrypt(parseInput(inputText), parseInput(aeadTag), keyBytes, ivBytes);
      setOutputText(plaintext);
      setOutputError('');
      message.success('AES-SIV 解密成功');
    } catch {
      setOutputError('解密失败: 认证标签验证失败或密钥/Nonce 错误');
    }
  };

  const handleChaCha20Encrypt = () => {
    if (!inputText) { message.warning('请输入要加密的内容'); return; }
    if (!key) { message.warning('请输入密钥 (32字节)'); return; }
    if (!iv) { message.warning('请输入 Nonce (12字节)'); return; }

    try {
      const keyBytes = parseKeyToUint8Array(key, keyEncoding);
      const ivBytes = parseKeyToUint8Array(iv, ivEncoding);
      
      if (keyBytes.length !== 32) {
        message.error('ChaCha20-Poly1305 密钥必须是 32 字节');
        return;
      }
      if (ivBytes.length !== 12) {
        message.error('ChaCha20-Poly1305 Nonce 必须是 12 字节');
        return;
      }

      const result = chacha20Encrypt(inputText, keyBytes, ivBytes);
      setOutputText(formatOutput(result.ciphertext));
      setAeadTag(formatOutput(result.tag));
      setOutputError('');
      message.success('ChaCha20-Poly1305 加密成功');
    } catch (error) {
      setOutputError('加密失败: ' + (error as Error).message);
    }
  };

  const handleChaCha20Decrypt = () => {
    if (!inputText) { message.warning('请输入要解密的密文'); return; }
    if (!key) { message.warning('请输入密钥 (32字节)'); return; }
    if (!iv) { message.warning('请输入 Nonce (12字节)'); return; }
    if (!aeadTag) { message.warning('请输入认证标签 (Tag)'); return; }

    try {
      const keyBytes = parseKeyToUint8Array(key, keyEncoding);
      const ivBytes = parseKeyToUint8Array(iv, ivEncoding);

      const plaintext = chacha20Decrypt(parseInput(inputText), parseInput(aeadTag), keyBytes, ivBytes);
      setOutputText(plaintext);
      setOutputError('');
      message.success('ChaCha20-Poly1305 解密成功');
    } catch {
      setOutputError('解密失败: 认证标签验证失败或密钥/Nonce 错误');
    }
  };

  const getEncryptHandler = () => {
    if (activeTab === 'aes-gcm') return handleAesGcmEncrypt;
    if (activeTab === 'aes-siv') return handleAesSivEncrypt;
    if (activeTab === 'chacha20') return handleChaCha20Encrypt;
    return handleAesGcmEncrypt;
  };

  const getDecryptHandler = () => {
    if (activeTab === 'aes-gcm') return handleAesGcmDecrypt;
    if (activeTab === 'aes-siv') return handleAesSivDecrypt;
    if (activeTab === 'chacha20') return handleChaCha20Decrypt;
    return handleAesGcmDecrypt;
  };

  const generateAeadKey = (length: number) => {
    const randomBytes = generateRandomBytes(length);
    setKey(uint8ArrayToHex(randomBytes));
    setKeyEncoding('Hex');
  };

  const generateAeadIv = () => {
    const randomBytes = generateRandomBytes(12);
    setIv(uint8ArrayToHex(randomBytes));
    setIvEncoding('Hex');
  };

  const handleCopy = async () => {
    if (!inputText) {
      message.warning('没有可复制的内容');
      return;
    }
    try {
      await navigator.clipboard.writeText(inputText);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
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
    setKey('');
    setIv('');
    setAeadTag('');
  };

  return (
    <>
      <TextArea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="请在这里填写原文/密文"
        autoSize={{ minRows: 6, maxRows: 20 }}
        style={{ marginBottom: 16, fontFamily: 'monospace' }}
      />

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" style={{ backgroundColor: '#52c41a' }} onClick={getEncryptHandler()}>
          加密
        </Button>
        <Button type="primary" onClick={getDecryptHandler()}>
          解密
        </Button>
        <Button style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: '#fff' }} onClick={handleCopy}>
          复制
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
              <div style={{ marginBottom: 8 }}>
                <div style={{ fontWeight: 500, marginBottom: 4 }}>密文:</div>
                <TextArea value={outputText} readOnly autoSize={{ minRows: 3, maxRows: 20 }} style={{ fontFamily: 'monospace', fontSize: 12 }} />
              </div>
              {aeadTag && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>认证标签 (Tag):</div>
                  <Input value={aeadTag} readOnly style={{ fontFamily: 'monospace', fontSize: 12 }} />
                </div>
              )}
              <Button size="small" onClick={handleCopyOutput}>复制密文</Button>
            </>
          )}
        </Card>
      )}

      <Card size="small" title={`${activeTab.toUpperCase()} 选项设置`} style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px 16px', alignItems: 'center' }}>
          <span>密钥:</span>
          <Space>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="16或32字节"
              style={{ width: 280 }}
            />
            <Select value={keyEncoding} onChange={setKeyEncoding} options={encodingOptions} style={{ width: 80 }} />
            <Select
              placeholder="随机生成"
              onChange={(value) => generateAeadKey(value)}
              options={aeadKeyLengthOptions}
              style={{ width: 120 }}
              allowClear
            />
          </Space>

          <span>IV/Nonce:</span>
          <Space>
            <Input
              value={iv}
              onChange={(e) => setIv(e.target.value)}
              placeholder="推荐12字节"
              style={{ width: 280 }}
            />
            <Select value={ivEncoding} onChange={setIvEncoding} options={encodingOptions} style={{ width: 80 }} />
            <Button onClick={generateAeadIv}>随机12B</Button>
          </Space>

          <span>认证标签:</span>
          <Input
            value={aeadTag}
            onChange={(e) => setAeadTag(e.target.value)}
            placeholder="解密时需要输入加密生成的Tag"
            style={{ width: 400 }}
          />

          <span>密文格式:</span>
          <Space>
            <Select value={ciphertextEncoding} onChange={setCiphertextEncoding} style={{ width: 160 }}
              options={[{ value: 'Hex', label: 'Hex (解密用)' }, { value: 'Base64', label: 'Base64 (解密用)' }]} />
            <Select value={outputEncoding} onChange={setOutputEncoding} style={{ width: 170 }}
              options={[{ value: 'Hex', label: 'Hex (加密输出)' }, { value: 'Base64', label: 'Base64 (加密输出)' }]} />
          </Space>
        </div>
        
        {activeTab === 'aes-siv' && (
          <div style={{ marginTop: 12, padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
            ℹ️ AES-SIV (Synthetic IV) 是一种确定性 AEAD 模式，提供抗重放攻击保护
          </div>
        )}
        {activeTab === 'chacha20' && (
          <div style={{ marginTop: 12, padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
            ℹ️ ChaCha20-Poly1305 是现代流密码，密钥必须 32 字节，Nonce 必须 12 字节
          </div>
        )}
      </Card>
    </>
  );
};

export default AEADTab;
