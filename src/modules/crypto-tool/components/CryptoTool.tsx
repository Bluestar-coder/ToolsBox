import React, { useState } from 'react';
import { Card, Input, Select, Button, Space, message, Tabs } from 'antd';
import CryptoJS from 'crypto-js';

const { TextArea } = Input;

// 加密模式选项
const modeOptions = [
  { value: 'CBC', label: 'CBC 默认' },
  { value: 'CFB', label: 'CFB' },
  { value: 'CTR', label: 'CTR' },
  { value: 'OFB', label: 'OFB' },
  { value: 'ECB', label: 'ECB' },
];

// 填充方式选项
const paddingOptions = [
  { value: 'Pkcs7', label: 'Pkcs7 默认' },
  { value: 'Iso97971', label: 'Iso97971' },
  { value: 'AnsiX923', label: 'AnsiX923' },
  { value: 'Iso10126', label: 'Iso10126' },
  { value: 'ZeroPadding', label: 'ZeroPadding' },
  { value: 'NoPadding', label: 'NoPadding' },
];

// 编码格式选项
const encodingOptions = [
  { value: 'Hex', label: 'Hex' },
  { value: 'Base64', label: 'Base64' },
  { value: 'Utf8', label: 'Utf8' },
];

// 密钥长度选项
const keyLengthOptions = [
  { value: 16, label: '随机16B' },
  { value: 24, label: '随机24B' },
  { value: 32, label: '随机32B' },
];

const CryptoTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState('aes');
  
  // 通用状态
  const [inputText, setInputText] = useState('');
  const [mode, setMode] = useState('CBC');
  const [padding, setPadding] = useState('Pkcs7');
  const [key, setKey] = useState('');
  const [keyEncoding, setKeyEncoding] = useState('Hex');
  const [iv, setIv] = useState('');
  const [ivEncoding, setIvEncoding] = useState('Utf8');
  const [ciphertextEncoding, setCiphertextEncoding] = useState('Hex'); // 密文格式
  const [outputEncoding, setOutputEncoding] = useState('Hex'); // 输出格式
  
  // 结果状态
  const [outputText, setOutputText] = useState('');
  const [outputError, setOutputError] = useState('');

  // 获取 CryptoJS 模式
  const getCryptoMode = (m: string) => {
    const modes: Record<string, typeof CryptoJS.mode.CBC> = {
      CBC: CryptoJS.mode.CBC,
      CFB: CryptoJS.mode.CFB,
      CTR: CryptoJS.mode.CTR,
      OFB: CryptoJS.mode.OFB,
      ECB: CryptoJS.mode.ECB,
    };
    return modes[m] || CryptoJS.mode.CBC;
  };

  // 获取 CryptoJS 填充方式
  const getCryptoPadding = (p: string) => {
    const paddings: Record<string, typeof CryptoJS.pad.Pkcs7> = {
      Pkcs7: CryptoJS.pad.Pkcs7,
      Iso97971: CryptoJS.pad.Iso97971,
      AnsiX923: CryptoJS.pad.AnsiX923,
      Iso10126: CryptoJS.pad.Iso10126,
      ZeroPadding: CryptoJS.pad.ZeroPadding,
      NoPadding: CryptoJS.pad.NoPadding,
    };
    return paddings[p] || CryptoJS.pad.Pkcs7;
  };

  // 解析密钥/IV
  const parseValue = (value: string, encoding: string): CryptoJS.lib.WordArray => {
    if (encoding === 'Hex') {
      return CryptoJS.enc.Hex.parse(value);
    } else if (encoding === 'Base64') {
      return CryptoJS.enc.Base64.parse(value);
    }
    return CryptoJS.enc.Utf8.parse(value);
  };



  // 生成随机密钥
  const generateRandomKey = (length: number) => {
    const randomBytes = CryptoJS.lib.WordArray.random(length);
    setKey(randomBytes.toString(CryptoJS.enc.Hex));
    setKeyEncoding('Hex');
  };

  // 生成随机 IV
  const generateRandomIv = (length: number = 16) => {
    const randomBytes = CryptoJS.lib.WordArray.random(length);
    setIv(randomBytes.toString(CryptoJS.enc.Hex));
    setIvEncoding('Hex');
  };

  // 一键生成密钥和 IV
  const generateKeyAndIv = () => {
    generateRandomKey(16);
    generateRandomIv(16);
  };

  // 加密
  const handleEncrypt = () => {
    if (!inputText) {
      message.warning('请输入要加密的内容');
      return;
    }
    if (!key) {
      message.warning('请输入密钥');
      return;
    }

    try {
      const keyWordArray = parseValue(key, keyEncoding);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const options: any = {
        mode: getCryptoMode(mode),
        padding: getCryptoPadding(padding),
      };

      if (mode !== 'ECB') {
        if (!iv) {
          message.warning('请输入偏移量IV');
          return;
        }
        options.iv = parseValue(iv, ivEncoding);
      }

      let encrypted;
      if (activeTab === 'aes') {
        encrypted = CryptoJS.AES.encrypt(inputText, keyWordArray, options);
      } else if (activeTab === 'des') {
        encrypted = CryptoJS.DES.encrypt(inputText, keyWordArray, options);
      } else if (activeTab === '3des') {
        encrypted = CryptoJS.TripleDES.encrypt(inputText, keyWordArray, options);
      }

      if (encrypted) {
        let result: string;
        if (outputEncoding === 'Base64') {
          result = encrypted.ciphertext.toString(CryptoJS.enc.Base64);
        } else {
          result = encrypted.ciphertext.toString(CryptoJS.enc.Hex);
        }
        setOutputText(result);
        setOutputError('');
        message.success('加密成功');
      }
    } catch (error) {
      setOutputText('');
      setOutputError('加密失败: ' + (error as Error).message);
    }
  };

  // 解密
  const handleDecrypt = () => {
    if (!inputText) {
      message.warning('请输入要解密的内容');
      return;
    }
    if (!key) {
      message.warning('请输入密钥');
      return;
    }

    try {
      const keyWordArray = parseValue(key, keyEncoding);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const options: any = {
        mode: getCryptoMode(mode),
        padding: getCryptoPadding(padding),
      };

      if (mode !== 'ECB') {
        if (!iv) {
          message.warning('请输入偏移量IV');
          return;
        }
        options.iv = parseValue(iv, ivEncoding);
      }

      // 根据密文格式解析
      let ciphertextWordArray: CryptoJS.lib.WordArray;
      if (ciphertextEncoding === 'Base64') {
        ciphertextWordArray = CryptoJS.enc.Base64.parse(inputText);
      } else {
        ciphertextWordArray = CryptoJS.enc.Hex.parse(inputText);
      }
      
      const cipherParams = CryptoJS.lib.CipherParams.create({
        ciphertext: ciphertextWordArray,
      });

      let decrypted;
      if (activeTab === 'aes') {
        decrypted = CryptoJS.AES.decrypt(cipherParams, keyWordArray, options);
      } else if (activeTab === 'des') {
        decrypted = CryptoJS.DES.decrypt(cipherParams, keyWordArray, options);
      } else if (activeTab === '3des') {
        decrypted = CryptoJS.TripleDES.decrypt(cipherParams, keyWordArray, options);
      }

      if (decrypted) {
        const plaintext = decrypted.toString(CryptoJS.enc.Utf8);
        if (!plaintext) {
          setOutputText('');
          setOutputError('解密失败，请检查原文、密匙及模式是否正确');
          return;
        }
        setOutputText(plaintext);
        setOutputError('');
        message.success('解密成功');
      }
    } catch (error) {
      setOutputText('');
      setOutputError('解密失败，请检查原文、密匙及模式是否正确');
    }
  };

  // JSON格式化
  const handleJsonFormat = () => {
    if (!outputText) return;
    try {
      const parsed = JSON.parse(outputText);
      setOutputText(JSON.stringify(parsed, null, 2));
    } catch {
      message.error('不是有效的JSON格式');
    }
  };

  // Unicode转中文
  const handleUnicodeToChinese = () => {
    if (!outputText) return;
    try {
      const result = outputText.replace(/\\u([0-9a-fA-F]{4})/g, (_, code) => 
        String.fromCharCode(parseInt(code, 16))
      );
      setOutputText(result);
    } catch {
      message.error('转换失败');
    }
  };

  // 复制结果
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

  // 复制
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

  // 清空
  const handleClear = () => {
    setInputText('');
    setOutputText('');
    setOutputError('');
    setKey('');
    setIv('');
  };

  // 哈希计算
  const [hashInput, setHashInput] = useState('');
  const [hashResults, setHashResults] = useState<Record<string, string>>({});

  const calculateHash = () => {
    if (!hashInput) {
      message.warning('请输入要计算哈希的内容');
      return;
    }
    const results: Record<string, string> = {
      MD5: CryptoJS.MD5(hashInput).toString(),
      SHA1: CryptoJS.SHA1(hashInput).toString(),
      SHA224: CryptoJS.SHA224(hashInput).toString(),
      SHA256: CryptoJS.SHA256(hashInput).toString(),
      SHA384: CryptoJS.SHA384(hashInput).toString(),
      SHA512: CryptoJS.SHA512(hashInput).toString(),
    };
    setHashResults(results);
    message.success('哈希计算完成');
  };

  const copyHashResult = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  // 标签页配置
  const tabItems = [
    { key: 'aes', label: 'AES' },
    { key: 'des', label: 'DES' },
    { key: '3des', label: '3DES' },
    { key: 'hash', label: '哈希加密' },
  ];

  return (
    <Card title="加密/解密工具" bordered={false}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />

      {/* 哈希加密界面 */}
      {activeTab === 'hash' ? (
        <>
          <TextArea
            value={hashInput}
            onChange={(e) => setHashInput(e.target.value)}
            placeholder="请输入要计算哈希的内容"
            rows={6}
            style={{ marginBottom: 16, fontFamily: 'monospace' }}
          />
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" style={{ backgroundColor: '#52c41a' }} onClick={calculateHash}>
              计算哈希
            </Button>
            <Button danger onClick={() => { setHashInput(''); setHashResults({}); }}>
              清空
            </Button>
          </Space>
          {Object.keys(hashResults).length > 0 && (
            <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
              {Object.entries(hashResults).map(([algo, value]) => (
                <div key={algo} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, width: 70 }}>{algo}:</span>
                    <Button size="small" onClick={() => copyHashResult(value)}>复制</Button>
                  </div>
                  <Input value={value} readOnly style={{ fontFamily: 'monospace', fontSize: 12 }} />
                </div>
              ))}
            </Card>
          )}
        </>
      ) : (
        <>
          {/* 输入区域 */}
          <TextArea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="请在这里填写原文/密文"
            rows={8}
            style={{ marginBottom: 16, fontFamily: 'monospace' }}
          />

      {/* 操作按钮 */}
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" style={{ backgroundColor: '#52c41a' }} onClick={handleEncrypt}>
          加密
        </Button>
        <Button type="primary" onClick={handleDecrypt}>
          解密
        </Button>
        <Button style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: '#fff' }} onClick={handleCopy}>
          复制
        </Button>
        <Button danger onClick={handleClear}>
          清空
        </Button>
      </Space>

      {/* 结果显示区域 */}
      {(outputText || outputError) && (
        <Card 
          size="small" 
          style={{ 
            marginBottom: 16,
            backgroundColor: outputError ? '#fff2f0' : '#f6ffed',
            borderColor: outputError ? '#ffccc7' : '#b7eb8f'
          }}
        >
          {outputError ? (
            <div style={{ color: '#ff4d4f' }}>{outputError}</div>
          ) : (
            <>
              <TextArea
                value={outputText}
                readOnly
                rows={6}
                style={{ 
                  marginBottom: 8, 
                  fontFamily: 'monospace',
                  backgroundColor: 'transparent',
                  border: 'none'
                }}
              />
              <Space>
                <Button size="small" onClick={handleJsonFormat}>JSON格式化</Button>
                <Button size="small" onClick={handleUnicodeToChinese}>Unicode转中文</Button>
                <Button size="small" onClick={handleCopyOutput}>复制</Button>
              </Space>
            </>
          )}
        </Card>
      )}

      {/* 选项设置 */}
      <Card size="small" title="选项设置" style={{ marginBottom: 16 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr', gap: '12px 16px', alignItems: 'center' }}>
          {/* 加密模式 */}
          <span>加密模式:</span>
          <Select
            value={mode}
            onChange={setMode}
            options={modeOptions}
            style={{ width: 140 }}
          />

          {/* 填充方式 */}
          <span>填充方式:</span>
          <Select
            value={padding}
            onChange={setPadding}
            options={paddingOptions}
            style={{ width: 140 }}
          />

          {/* 密钥 */}
          <span>密　钥:</span>
          <Space>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="请输入密钥"
              style={{ width: 240 }}
            />
            <Select
              value={keyEncoding}
              onChange={setKeyEncoding}
              options={encodingOptions}
              style={{ width: 80 }}
            />
            <Select
              placeholder="随机"
              onChange={(value) => generateRandomKey(value)}
              options={keyLengthOptions}
              style={{ width: 100 }}
              allowClear
            />
            <Button onClick={generateKeyAndIv}>一键生成</Button>
          </Space>

          {/* 偏移量IV */}
          <span>偏移量IV:</span>
          <Space>
            <Input
              value={iv}
              onChange={(e) => setIv(e.target.value)}
              placeholder="请输入IV"
              style={{ width: 240 }}
              disabled={mode === 'ECB'}
            />
            <Select
              value={ivEncoding}
              onChange={setIvEncoding}
              options={encodingOptions}
              style={{ width: 80 }}
              disabled={mode === 'ECB'}
            />
            <Button onClick={() => generateRandomIv(16)} disabled={mode === 'ECB'}>
              随机16B
            </Button>
          </Space>

          {/* 密文格式 */}
          <span>密文格式:</span>
          <Space>
            <Select
              value={ciphertextEncoding}
              onChange={setCiphertextEncoding}
              style={{ width: 140 }}
              options={[
                { value: 'Hex', label: 'Hex（解密用）' },
                { value: 'Base64', label: 'Base64（解密用）' },
              ]}
            />
            <Select
              value={outputEncoding}
              onChange={setOutputEncoding}
              style={{ width: 140 }}
              options={[
                { value: 'Hex', label: 'Hex（加密输出）' },
                { value: 'Base64', label: 'Base64（加密输出）' },
              ]}
            />
          </Space>
        </div>
      </Card>
        </>
      )}
    </Card>
  );
};

export default CryptoTool;
