import React, { useState } from 'react';
import { Card, Input, Select, Button, Space, message } from 'antd';
import CryptoJS from 'crypto-js';
import { parseValue, getCryptoMode, getCryptoPadding } from '../../utils/helpers';
import styles from './SymmetricTab.module.css';

// Local interface for cipher options to avoid using 'any'
interface CipherOptions {
  mode: unknown;
  padding: unknown;
  iv?: CryptoJS.lib.WordArray;
}
import {
  aesModeOptions,
  desModeOptions,
  paddingOptions,
  encodingOptions,
  aesKeyLengthOptions,
  desKeyLengthOptions,
  tripleDesKeyLengthOptions,
} from '../../utils/constants';

const { TextArea } = Input;

interface SymmetricTabProps {
  activeTab: string;
}

const SymmetricTab: React.FC<SymmetricTabProps> = ({ activeTab }) => {
  const [inputText, setInputText] = useState('');
  const [outputText, setOutputText] = useState('');
  const [outputError, setOutputError] = useState('');
  const [mode, setMode] = useState('CBC');
  const [padding, setPadding] = useState('Pkcs7');
  const [key, setKey] = useState('');
  const [keyEncoding, setKeyEncoding] = useState('Utf8');
  const [iv, setIv] = useState('');
  const [ivEncoding, setIvEncoding] = useState('Utf8');
  const [ciphertextEncoding, setCiphertextEncoding] = useState('Base64');
  const [outputEncoding, setOutputEncoding] = useState('Base64');

  const validateKeyLength = (keyBytes: number): boolean => {
    if (activeTab === 'aes') {
      if (![16, 24, 32].includes(keyBytes)) {
        message.error(`AES 密钥长度必须是 16/24/32 字节，当前: ${keyBytes} 字节`);
        return false;
      }
    } else if (activeTab === 'des') {
      if (keyBytes !== 8) {
        message.error(`DES 密钥长度必须是 8 字节，当前: ${keyBytes} 字节`);
        return false;
      }
    } else if (activeTab === '3des') {
      if (keyBytes !== 24) {
        message.error(`3DES 密钥长度必须是 24 字节，当前: ${keyBytes} 字节`);
        return false;
      }
    }
    return true;
  };

  const validateIvLength = (ivBytes: number): boolean => {
    const requiredLength = activeTab === 'aes' ? 16 : 8;
    if (ivBytes !== requiredLength) {
      message.error(`${activeTab.toUpperCase()} IV 长度必须是 ${requiredLength} 字节，当前: ${ivBytes} 字节`);
      return false;
    }
    return true;
  };

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
      if (!validateKeyLength(keyWordArray.sigBytes)) return;

      const options: CipherOptions = {
        mode: getCryptoMode(mode),
        padding: getCryptoPadding(padding),
      };

      if (mode !== 'ECB') {
        if (!iv) {
          message.warning('请输入偏移量IV');
          return;
        }
        const ivWordArray = parseValue(iv, ivEncoding);
        if (!validateIvLength(ivWordArray.sigBytes)) return;
        options.iv = ivWordArray;
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
      if (!validateKeyLength(keyWordArray.sigBytes)) return;

      const options: CipherOptions = {
        mode: getCryptoMode(mode),
        padding: getCryptoPadding(padding),
      };

      if (mode !== 'ECB') {
        if (!iv) {
          message.warning('请输入偏移量IV');
          return;
        }
        const ivWordArray = parseValue(iv, ivEncoding);
        if (!validateIvLength(ivWordArray.sigBytes)) return;
        options.iv = ivWordArray;
      }

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
    } catch {
      setOutputText('');
      setOutputError('解密失败，请检查原文、密匙及模式是否正确');
    }
  };

  const generateRandomKey = (length: number) => {
    const randomBytes = CryptoJS.lib.WordArray.random(length);
    setKey(randomBytes.toString(CryptoJS.enc.Hex));
    setKeyEncoding('Hex');
  };

  const generateRandomIv = (length: number = 16) => {
    const randomBytes = CryptoJS.lib.WordArray.random(length);
    setIv(randomBytes.toString(CryptoJS.enc.Hex));
    setIvEncoding('Hex');
  };

  const generateKeyAndIv = () => {
    if (activeTab === 'aes') {
      generateRandomKey(16);
      generateRandomIv(16);
    } else if (activeTab === 'des') {
      generateRandomKey(8);
      generateRandomIv(8);
    } else if (activeTab === '3des') {
      generateRandomKey(24);
      generateRandomIv(8);
    }
  };

  const handleJsonFormat = () => {
    if (!outputText) return;
    try {
      const parsed = JSON.parse(outputText);
      setOutputText(JSON.stringify(parsed, null, 2));
    } catch {
      message.error('不是有效的JSON格式');
    }
  };

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

  const getModeOptions = () => {
    return activeTab === 'aes' ? aesModeOptions : desModeOptions;
  };

  const getKeyLengthOptions = () => {
    if (activeTab === 'aes') return aesKeyLengthOptions;
    if (activeTab === 'des') return desKeyLengthOptions;
    return tripleDesKeyLengthOptions;
  };

  return (
    <>
      <TextArea
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
        placeholder="请在这里填写原文/密文"
        rows={8}
        className={styles.inputWrapper}
      />

      <Space className={styles.buttonGroup}>
        <Button type="primary" className={styles.encryptButton} onClick={handleEncrypt}>
          加密
        </Button>
        <Button type="primary" onClick={handleDecrypt}>
          解密
        </Button>
        <Button className={styles.copyButton} onClick={handleCopy}>
          复制
        </Button>
        <Button danger onClick={handleClear}>
          清空
        </Button>
      </Space>

      {(outputText || outputError) && (
        <Card
          size="small"
          className={outputError ? styles.outputCardError : styles.outputCardSuccess}
        >
          {outputError ? (
            <div className={styles.errorMessage}>{outputError}</div>
          ) : (
            <>
              <TextArea
                value={outputText}
                readOnly
                rows={6}
                className={styles.outputWrapper}
                style={{
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

      <Card size="small" title="选项设置" className={styles.optionsCard}>
        <div className={styles.optionsGrid}>
          <span>加密模式:</span>
          <Select
            value={mode}
            onChange={setMode}
            options={getModeOptions()}
            className={styles.selectWidth}
          />

          <span>填充方式:</span>
          <Select
            value={padding}
            onChange={setPadding}
            options={paddingOptions}
            className={styles.selectMedium}
          />

          <span>密钥:</span>
          <Space>
            <Input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={activeTab === 'aes' ? '16/24/32字节' : activeTab === 'des' ? '8字节' : '24字节'}
              className={styles.selectLarge}
            />
            <Select
              value={keyEncoding}
              onChange={setKeyEncoding}
              options={encodingOptions}
              className={styles.selectSmall}
            />
            <Select
              placeholder="随机生成"
              onChange={(value) => generateRandomKey(value)}
              options={getKeyLengthOptions()}
              className={styles.selectExtraLarge}
              allowClear
            />
            <Button onClick={generateKeyAndIv}>一键生成</Button>
          </Space>

          <span>偏移量IV:</span>
          <Space>
            <Input
              value={iv}
              onChange={(e) => setIv(e.target.value)}
              placeholder={activeTab === 'aes' ? '16字节' : '8字节'}
              className={styles.selectLarge}
              disabled={mode === 'ECB'}
            />
            <Select
              value={ivEncoding}
              onChange={setIvEncoding}
              options={encodingOptions}
              className={styles.selectSmall}
              disabled={mode === 'ECB'}
            />
            <Button onClick={() => generateRandomIv(activeTab === 'aes' ? 16 : 8)} disabled={mode === 'ECB'}>
              随机{activeTab === 'aes' ? '16' : '8'}B
            </Button>
          </Space>

          <span>密文格式:</span>
          <Space>
            <Select
              value={ciphertextEncoding}
              onChange={setCiphertextEncoding}
              className={styles.selectWidth}
              options={[
                { value: 'Hex', label: 'Hex (解密用)' },
                { value: 'Base64', label: 'Base64 (解密用)' },
              ]}
            />
            <Select
              value={outputEncoding}
              onChange={setOutputEncoding}
              style={{ width: 170 }}
              options={[
                { value: 'Hex', label: 'Hex (加密输出)' },
                { value: 'Base64', label: 'Base64 (加密输出)' },
              ]}
            />
          </Space>
        </div>
      </Card>
    </>
  );
};

export default SymmetricTab;
