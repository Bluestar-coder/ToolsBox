import React, { useState } from 'react';
import { Card, Input, Select, Button, Space, message, Tabs, Row, Col } from 'antd';
import CryptoJS from 'crypto-js';

const { TextArea } = Input;

const modeOptions = [
  { value: 'CBC', label: 'CBC 默认' },
  { value: 'ECB', label: 'ECB' },
  { value: 'CFB', label: 'CFB' },
  { value: 'OFB', label: 'OFB' },
  { value: 'CTR', label: 'CTR' },
];

const paddingOptions = [
  { value: 'Pkcs7', label: 'Pkcs7 默认' },
  { value: 'Pkcs5', label: 'Pkcs5' },
  { value: 'ZeroPadding', label: 'ZeroPadding' },
  { value: 'NoPadding', label: 'NoPadding' },
];

const encodingOptions = [
  { value: 'Utf8', label: 'Utf8' },
  { value: 'Hex', label: 'Hex' },
  { value: 'Base64', label: 'Base64' },
];

const cipherFormatOptions = [
  { value: 'Base64', label: 'Base64' },
  { value: 'Hex', label: 'Hex' },
];

const aesKeyLengthOptions = [
  { value: 16, label: '128位(16字节)' },
  { value: 24, label: '192位(24字节)' },
  { value: 32, label: '256位(32字节)' },
];

type AlgoType = 'aes' | 'des' | '3des' | 'hash';

const CryptoTool: React.FC = () => {
  const [activeAlgo, setActiveAlgo] = useState<string>('aes');
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [mode, setMode] = useState('CBC');
  const [padding, setPadding] = useState('Pkcs7');
  const [key, setKey] = useState('');
  const [keyEncoding, setKeyEncoding] = useState('Utf8');
  const [iv, setIv] = useState('');
  const [ivEncoding, setIvEncoding] = useState('Utf8');
  const [cipherFormat, setCipherFormat] = useState('Base64');
  const [aesKeyLength, setAesKeyLength] = useState(16);
  const [hashInput, setHashInput] = useState('');
  const [hashResults, setHashResults] = useState<Record<string, string>>({});

  const algo = activeAlgo as AlgoType;
  const keyLen = algo === 'des' ? 8 : algo === '3des' ? 24 : aesKeyLength;
  const ivLen = algo === 'des' || algo === '3des' ? 8 : 16;

  const parseValue = (value: string, encoding: string): CryptoJS.lib.WordArray => {
    if (encoding === 'Hex') return CryptoJS.enc.Hex.parse(value);
    if (encoding === 'Base64') return CryptoJS.enc.Base64.parse(value);
    return CryptoJS.enc.Utf8.parse(value);
  };

  const validateKey = (): string | null => {
    if (!key) return '请输入密钥';
    // AES 支持 16/24/32 字节，不强制验证，让用户自由输入
    return null;
  };

  const validateIv = (): string | null => {
    if (mode === 'ECB') return null;
    if (!iv) return '请输入IV';
    // 不强制验证IV长度，让用户自由输入
    return null;
  };

  const getMode = () => {
    const m: Record<string, typeof CryptoJS.mode.CBC> = {
      CBC: CryptoJS.mode.CBC, ECB: CryptoJS.mode.ECB, CFB: CryptoJS.mode.CFB,
      OFB: CryptoJS.mode.OFB, CTR: CryptoJS.mode.CTR,
    };
    return m[mode] || CryptoJS.mode.CBC;
  };

  const getPadding = () => {
    const p: Record<string, typeof CryptoJS.pad.Pkcs7> = {
      Pkcs7: CryptoJS.pad.Pkcs7, Pkcs5: CryptoJS.pad.Pkcs7,
      ZeroPadding: CryptoJS.pad.ZeroPadding, NoPadding: CryptoJS.pad.NoPadding,
    };
    return p[padding] || CryptoJS.pad.Pkcs7;
  };

  const generateRandom = (length: number, encoding: string): string => {
    const arr = CryptoJS.lib.WordArray.random(length);
    if (encoding === 'Hex') return arr.toString(CryptoJS.enc.Hex);
    if (encoding === 'Base64') return arr.toString(CryptoJS.enc.Base64);
    // UTF-8: 生成可打印的ASCII字符
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleEncrypt = () => {
    if (!inputText) { message.warning('请输入明文'); return; }
    const keyErr = validateKey(); if (keyErr) { message.error(keyErr); return; }
    const ivErr = validateIv(); if (ivErr) { message.error(ivErr); return; }
    try {
      const keyWords = parseValue(key, keyEncoding);
      const ivWords = mode !== 'ECB' ? parseValue(iv, ivEncoding) : undefined;
      const inputWords = CryptoJS.enc.Utf8.parse(inputText);
      const cfg = { mode: getMode(), padding: getPadding(), iv: ivWords };
      let encrypted;
      if (algo === 'aes') encrypted = CryptoJS.AES.encrypt(inputWords, keyWords, cfg);
      else if (algo === 'des') encrypted = CryptoJS.DES.encrypt(inputWords, keyWords, cfg);
      else encrypted = CryptoJS.TripleDES.encrypt(inputWords, keyWords, cfg);
      setOutputText(cipherFormat === 'Hex' ? encrypted.ciphertext.toString(CryptoJS.enc.Hex) : encrypted.toString());
      message.success('加密成功');
    } catch (e) { message.error('加密失败: ' + (e instanceof Error ? e.message : '未知错误')); }
  };

  const handleDecrypt = () => {
    if (!inputText) { message.warning('请输入密文'); return; }
    const keyErr = validateKey(); if (keyErr) { message.error(keyErr); return; }
    const ivErr = validateIv(); if (ivErr) { message.error(ivErr); return; }
    try {
      const keyWords = parseValue(key, keyEncoding);
      const ivWords = mode !== 'ECB' ? parseValue(iv, ivEncoding) : undefined;
      const cfg = { mode: getMode(), padding: getPadding(), iv: ivWords };
      const cipherParams = cipherFormat === 'Hex'
        ? CryptoJS.lib.CipherParams.create({ ciphertext: CryptoJS.enc.Hex.parse(inputText) })
        : inputText;
      let decrypted;
      if (algo === 'aes') decrypted = CryptoJS.AES.decrypt(cipherParams, keyWords, cfg);
      else if (algo === 'des') decrypted = CryptoJS.DES.decrypt(cipherParams, keyWords, cfg);
      else decrypted = CryptoJS.TripleDES.decrypt(cipherParams, keyWords, cfg);
      let result = decrypted.toString(CryptoJS.enc.Utf8);
      if (!result && decrypted.sigBytes > 0) result = decrypted.toString(CryptoJS.enc.Hex);
      setOutputText(result);
      message.success('解密成功');
    } catch (e) { message.error('解密失败: ' + (e instanceof Error ? e.message : '未知错误')); }
  };

  const calculateHash = () => {
    if (!hashInput) { message.warning('请输入内容'); return; }
    setHashResults({
      MD5: CryptoJS.MD5(hashInput).toString(),
      'SHA-1': CryptoJS.SHA1(hashInput).toString(),
      'SHA-256': CryptoJS.SHA256(hashInput).toString(),
      'SHA-512': CryptoJS.SHA512(hashInput).toString(),
    });
  };

  const handleCopy = async (text?: string) => {
    const content = text || outputText;
    if (!content) { message.warning('无内容'); return; }
    try { await navigator.clipboard.writeText(content); message.success('已复制'); }
    catch { message.error('复制失败'); }
  };

  const labelStyle: React.CSSProperties = { width: 80, textAlign: 'right', fontSize: 14 };
  const rowStyle: React.CSSProperties = { marginBottom: 12 };

  const renderCryptoPanel = () => (
    <>
      {/* 输入框 */}
      <TextArea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="请输入明文/密文"
        rows={5}
        style={{ marginBottom: 12, fontFamily: 'monospace' }}
      />

      {/* 操作按钮 */}
      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} onClick={handleEncrypt}>加 密</Button>
        <Button type="primary" onClick={handleDecrypt}>解 密</Button>
        <Button style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: '#fff' }} onClick={() => handleCopy()}>复 制</Button>
        <Button danger onClick={() => { setInputText(''); setOutputText(''); }}>清 空</Button>
      </Space>

      {/* 输出框 */}
      <div style={{ backgroundColor: '#f6ffed', border: '1px solid #b7eb8f', borderRadius: 6, padding: 12, marginBottom: 16, minHeight: 100 }}>
        <div style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap', wordBreak: 'break-all' }}>
          {outputText || <span style={{ color: '#999' }}>结果将显示在这里</span>}
        </div>
      </div>

      {/* 选项设置 */}
      <Card size="small" title="选项设置" styles={{ body: { padding: '12px 16px' } }}>
        <Row align="middle" style={rowStyle}>
          <Col style={labelStyle}>加密模式:</Col>
          <Col style={{ paddingLeft: 12 }}>
            <Select value={mode} onChange={setMode} options={modeOptions} style={{ width: 140 }} />
          </Col>
        </Row>

        <Row align="middle" style={rowStyle}>
          <Col style={labelStyle}>填充方式:</Col>
          <Col style={{ paddingLeft: 12 }}>
            <Select value={padding} onChange={setPadding} options={paddingOptions} style={{ width: 140 }} />
          </Col>
        </Row>

        {algo === 'aes' && (
          <Row align="middle" style={rowStyle}>
            <Col style={labelStyle}>密钥长度:</Col>
            <Col style={{ paddingLeft: 12 }}>
              <Select value={aesKeyLength} onChange={(v) => setAesKeyLength(v as number)} options={aesKeyLengthOptions} style={{ width: 140 }} />
            </Col>
          </Row>
        )}

        <Row align="middle" style={rowStyle}>
          <Col style={labelStyle}>密 钥:</Col>
          <Col flex="auto" style={{ paddingLeft: 12 }}>
            <Space.Compact style={{ width: '100%' }}>
              <Input value={key} onChange={(e) => setKey(e.target.value)} placeholder={`请输入${keyLen}字节密钥`} style={{ flex: 1 }} />
              <Select value={keyEncoding} onChange={setKeyEncoding} options={encodingOptions} style={{ width: 80 }} />
              <Button onClick={() => setKey(generateRandom(keyLen, keyEncoding))}>随机{keyLen}B</Button>
            </Space.Compact>
          </Col>
        </Row>

        {mode !== 'ECB' && (
          <Row align="middle" style={rowStyle}>
            <Col style={labelStyle}>偏移量IV:</Col>
            <Col flex="auto" style={{ paddingLeft: 12 }}>
              <Space.Compact style={{ width: '100%' }}>
                <Input value={iv} onChange={(e) => setIv(e.target.value)} placeholder={`请输入${ivLen}字节IV`} style={{ flex: 1 }} />
                <Select value={ivEncoding} onChange={setIvEncoding} options={encodingOptions} style={{ width: 80 }} />
                <Button onClick={() => setIv(generateRandom(ivLen, ivEncoding))}>随机{ivLen}B</Button>
              </Space.Compact>
            </Col>
          </Row>
        )}

        <Row align="middle">
          <Col style={labelStyle}>密文格式:</Col>
          <Col style={{ paddingLeft: 12 }}>
            <Select value={cipherFormat} onChange={setCipherFormat} options={cipherFormatOptions} style={{ width: 100 }} />
          </Col>
        </Row>
      </Card>
    </>
  );

  const renderHashPanel = () => (
    <>
      <TextArea
        value={hashInput}
        onChange={(e) => setHashInput(e.target.value)}
        placeholder="请输入要计算哈希的内容"
        rows={5}
        style={{ marginBottom: 12, fontFamily: 'monospace' }}
      />

      <Space style={{ marginBottom: 12 }}>
        <Button type="primary" style={{ backgroundColor: '#52c41a', borderColor: '#52c41a' }} onClick={calculateHash}>计 算</Button>
        <Button danger onClick={() => { setHashInput(''); setHashResults({}); }}>清 空</Button>
      </Space>

      {Object.keys(hashResults).length > 0 && (
        <Card size="small" title="计算结果" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }} styles={{ body: { padding: '12px 16px' } }}>
          {Object.entries(hashResults).map(([name, value]) => (
            <Row key={name} align="middle" style={{ marginBottom: 8 }}>
              <Col style={{ width: 70, fontWeight: 500 }}>{name}:</Col>
              <Col flex="auto">
                <Space.Compact style={{ width: '100%' }}>
                  <Input value={value} readOnly style={{ fontFamily: 'monospace', fontSize: 12 }} />
                  <Button onClick={() => handleCopy(value)}>复制</Button>
                </Space.Compact>
              </Col>
            </Row>
          ))}
        </Card>
      )}
    </>
  );

  const tabItems = [
    { key: 'aes', label: 'AES' },
    { key: 'des', label: 'DES' },
    { key: '3des', label: '3DES' },
    { key: 'hash', label: 'Hash' },
  ];

  return (
    <Card title="加密/解密工具">
      <Tabs activeKey={activeAlgo} onChange={setActiveAlgo} items={tabItems} style={{ marginBottom: 16 }} />
      {activeAlgo === 'hash' ? renderHashPanel() : renderCryptoPanel()}
    </Card>
  );
};

export default CryptoTool;
