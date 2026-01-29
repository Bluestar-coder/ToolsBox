import React, { useState } from 'react';
import { Card, Input, Select, Button, Space, message } from 'antd';
import { ZUCCipher, zucHexToBytes, zucBytesToHex } from '../../utils/zuc';
import { generateRandomBytes, uint8ArrayToHex } from '../../utils/helpers';
import { encodingOptions } from '../../utils/constants';

const { TextArea } = Input;

const ZUCTab: React.FC = () => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [outputError, setOutputError] = useState('');
  const [key, setKey] = useState('');
  const [keyEncoding, setKeyEncoding] = useState('Utf8');
  const [iv, setIv] = useState('');
  const [ivEncoding, setIvEncoding] = useState('Utf8');
  const [ciphertextEncoding, setCiphertextEncoding] = useState<'Hex' | 'Base64'>('Hex');
  const [outputEncoding, setOutputEncoding] = useState<'Hex' | 'Base64'>('Hex');

  const hexToBase64 = (hex: string): string => {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < hex.length; i += 2) bytes[i / 2] = parseInt(hex.slice(i, i + 2), 16);
    return btoa(String.fromCharCode(...bytes));
  };

  const base64ToHex = (b64: string): string => {
    const binary = atob(b64);
    return Array.from(binary).map(c => c.charCodeAt(0).toString(16).padStart(2, '0')).join('');
  };

  const handleZucEncrypt = () => {
    if (!inputText) { message.warning('请输入要加密的内容'); return; }
    if (!key) { message.warning('请输入密钥 (16字节/32位Hex)'); return; }
    if (!iv) { message.warning('请输入 IV (16字节/32位Hex)'); return; }

    try {
      let keyHex = key;
      if (keyEncoding === 'Utf8') {
        keyHex = Array.from(new TextEncoder().encode(key)).map(b => b.toString(16).padStart(2, '0')).join('');
      } else if (keyEncoding === 'Base64') {
        const bytes = atob(key);
        keyHex = Array.from(bytes).map((_, i) => bytes.charCodeAt(i).toString(16).padStart(2, '0')).join('');
      }

      let ivHex = iv;
      if (ivEncoding === 'Utf8') {
        ivHex = Array.from(new TextEncoder().encode(iv)).map(b => b.toString(16).padStart(2, '0')).join('');
      } else if (ivEncoding === 'Base64') {
        const bytes = atob(iv);
        ivHex = Array.from(bytes).map((_, i) => bytes.charCodeAt(i).toString(16).padStart(2, '0')).join('');
      }

      if (keyHex.length !== 32) {
        message.error('ZUC 密钥必须是 16 字节 (32位Hex)');
        return;
      }
      if (ivHex.length !== 32) {
        message.error('ZUC IV 必须是 16 字节 (32位Hex)');
        return;
      }

      const keyBytes = zucHexToBytes(keyHex);
      const ivBytes = zucHexToBytes(ivHex);
      const zuc = new ZUCCipher(keyBytes, ivBytes);
      const plaintextBytes = new TextEncoder().encode(inputText);
      const encrypted = zuc.encrypt(plaintextBytes);
      const resultHex = zucBytesToHex(encrypted);
      setOutputText(outputEncoding === 'Base64' ? hexToBase64(resultHex) : resultHex);
      setOutputError('');
      message.success('ZUC 加密成功');
    } catch (error) {
      setOutputError('ZUC 加密失败: ' + (error as Error).message);
    }
  };

  const handleZucDecrypt = () => {
    if (!inputText) { message.warning('请输入要解密的密文 (Hex格式)'); return; }
    if (!key) { message.warning('请输入密钥 (16字节/32位Hex)'); return; }
    if (!iv) { message.warning('请输入 IV (16字节/32位Hex)'); return; }

    try {
      let keyHex = key;
      if (keyEncoding === 'Utf8') {
        keyHex = Array.from(new TextEncoder().encode(key)).map(b => b.toString(16).padStart(2, '0')).join('');
      } else if (keyEncoding === 'Base64') {
        const bytes = atob(key);
        keyHex = Array.from(bytes).map((_, i) => bytes.charCodeAt(i).toString(16).padStart(2, '0')).join('');
      }

      let ivHex = iv;
      if (ivEncoding === 'Utf8') {
        ivHex = Array.from(new TextEncoder().encode(iv)).map(b => b.toString(16).padStart(2, '0')).join('');
      } else if (ivEncoding === 'Base64') {
        const bytes = atob(iv);
        ivHex = Array.from(bytes).map((_, i) => bytes.charCodeAt(i).toString(16).padStart(2, '0')).join('');
      }

      if (keyHex.length !== 32) {
        message.error('ZUC 密钥必须是 16 字节 (32位Hex)');
        return;
      }
      if (ivHex.length !== 32) {
        message.error('ZUC IV 必须是 16 字节 (32位Hex)');
        return;
      }

      const keyBytes = zucHexToBytes(keyHex);
      const ivBytes = zucHexToBytes(ivHex);
      const zuc = new ZUCCipher(keyBytes, ivBytes);
      const cipherHex = ciphertextEncoding === 'Base64' ? base64ToHex(inputText) : inputText;
      const ciphertextBytes = zucHexToBytes(cipherHex);
      const decrypted = zuc.decrypt(ciphertextBytes);
      const decryptedText = new TextDecoder().decode(decrypted);
      if (!decryptedText) {
        setOutputError('ZUC 解密失败，请检查密文和密钥');
        return;
      }
      setOutputText(decryptedText);
      setOutputError('');
      message.success('ZUC 解密成功');
    } catch (error) {
      setOutputError('ZUC 解密失败: ' + (error as Error).message);
    }
  };

  const generateZucKey = () => {
    const randomBytes = generateRandomBytes(16);
    setKey(uint8ArrayToHex(randomBytes));
    setKeyEncoding('Hex');
  };

  const generateZucIv = () => {
    const randomBytes = generateRandomBytes(16);
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
  };

  return (
    <>
      <TextArea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="请输入要加密/解密的内容"
        autoSize={{ minRows: 6, maxRows: 20 }}
        style={{ marginBottom: 16, fontFamily: 'monospace' }}
      />

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" style={{ backgroundColor: '#52c41a' }} onClick={handleZucEncrypt}>
          加密
        </Button>
        <Button type="primary" onClick={handleZucDecrypt}>
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
              <TextArea value={outputText} readOnly autoSize={{ minRows: 4, maxRows: 20 }} style={{ fontFamily: 'monospace', fontSize: 12, marginBottom: 8 }} />
              <Button size="small" onClick={handleCopyOutput}>复制</Button>
            </>
          )}
        </Card>
      )}

      <Card size="small" title="ZUC 选项设置" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px 16px', alignItems: 'center' }}>
          <span>密钥:</span>
          <Space>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="16字节 (32位Hex)"
              style={{ width: 300 }}
            />
            <Select value={keyEncoding} onChange={setKeyEncoding} options={encodingOptions} style={{ width: 80 }} />
            <Button onClick={generateZucKey}>随机生成</Button>
          </Space>

          <span>偏移量IV:</span>
          <Space>
            <Input
              value={iv}
              onChange={(e) => setIv(e.target.value)}
              placeholder="16字节 (32位Hex)"
              style={{ width: 300 }}
            />
            <Select value={ivEncoding} onChange={setIvEncoding} options={encodingOptions} style={{ width: 80 }} />
            <Button onClick={generateZucIv}>随机生成</Button>
          </Space>

          <span>密文格式:</span>
          <Space>
            <Select value={ciphertextEncoding} onChange={setCiphertextEncoding} style={{ width: 160 }}
              options={[{ value: 'Hex', label: 'Hex (解密用)' }, { value: 'Base64', label: 'Base64 (解密用)' }]} />
            <Select value={outputEncoding} onChange={setOutputEncoding} style={{ width: 170 }}
              options={[{ value: 'Hex', label: 'Hex (加密输出)' }, { value: 'Base64', label: 'Base64 (加密输出)' }]} />
          </Space>
        </div>
        <div style={{ marginTop: 12, padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
          ℹ️ ZUC（祖冲之算法）是中国国家密码管理局发布的流密码算法，用于 3GPP LTE 加密（EEA3）和完整性保护（EIA3）
        </div>
      </Card>
    </>
  );
};

export default ZUCTab;
