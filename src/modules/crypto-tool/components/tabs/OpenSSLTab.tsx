import React, { useState } from 'react';
import { Button, Input, Select, Space, message, Typography, Radio, Form, Card } from 'antd';
import CryptoJS from 'crypto-js';
import { 
  CopyOutlined, 
  DeleteOutlined, 
  LockOutlined, 
  UnlockOutlined 
} from '@ant-design/icons';

const { Title, Text } = Typography;
const { TextArea } = Input;

export const OpenSSLTab: React.FC = () => {
  const [algorithm, setAlgorithm] = useState('AES-256-CBC');
  const [password, setPassword] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [messageApi, contextHolder] = message.useMessage();

  const algorithmOptions = [
    { value: 'AES-128-CBC', label: 'AES-128 CBC' },
    { value: 'AES-192-CBC', label: 'AES-192 CBC' },
    { value: 'AES-256-CBC', label: 'AES-256 CBC' },
    { value: 'DES-CBC', label: 'DES CBC' },
    { value: 'TripleDES-CBC', label: '3DES CBC' },
    { value: 'Rabbit', label: 'Rabbit' },
    { value: 'RC4', label: 'RC4' },
  ];

  const handleEncrypt = () => {
    if (!password) {
      messageApi.error('Please enter a password');
      return;
    }
    if (!input) {
      messageApi.warning('Please enter content to encrypt');
      return;
    }

    try {
      let encrypted;
      // crypto-js format for OpenSSL compatibility (EvpKDF)
      // Note: This matches "openssl enc -[algo] -k [password] -md md5" (OpenSSL < 1.1.0 default)
      // Modern OpenSSL defaults to PBKDF2-SHA256 which requires manual implementation in crypto-js
      
      switch (algorithm) {
        case 'AES-128-CBC':
        case 'AES-192-CBC':
        case 'AES-256-CBC':
          // CryptoJS AES treats string password as OpenSSL compatible
          encrypted = CryptoJS.AES.encrypt(input, password).toString();
          break;
        case 'DES-CBC':
          encrypted = CryptoJS.DES.encrypt(input, password).toString();
          break;
        case 'TripleDES-CBC':
          encrypted = CryptoJS.TripleDES.encrypt(input, password).toString();
          break;
        case 'Rabbit':
          encrypted = CryptoJS.Rabbit.encrypt(input, password).toString();
          break;
        case 'RC4':
          encrypted = CryptoJS.RC4.encrypt(input, password).toString();
          break;
        default:
          encrypted = CryptoJS.AES.encrypt(input, password).toString();
      }
      setOutput(encrypted);
      messageApi.success('Encrypted successfully');
    } catch (error) {
      console.error(error);
      messageApi.error('Encryption failed');
    }
  };

  const handleDecrypt = () => {
    if (!password) {
      messageApi.error('Please enter a password');
      return;
    }
    if (!input) {
      messageApi.warning('Please enter content to decrypt');
      return;
    }

    try {
      let decryptedBytes;
      switch (algorithm) {
        case 'AES-128-CBC':
        case 'AES-192-CBC':
        case 'AES-256-CBC':
          decryptedBytes = CryptoJS.AES.decrypt(input, password);
          break;
        case 'DES-CBC':
          decryptedBytes = CryptoJS.DES.decrypt(input, password);
          break;
        case 'TripleDES-CBC':
          decryptedBytes = CryptoJS.TripleDES.decrypt(input, password);
          break;
        case 'Rabbit':
          decryptedBytes = CryptoJS.Rabbit.decrypt(input, password);
          break;
        case 'RC4':
          decryptedBytes = CryptoJS.RC4.decrypt(input, password);
          break;
        default:
          decryptedBytes = CryptoJS.AES.decrypt(input, password);
      }
      
      const decrypted = decryptedBytes.toString(CryptoJS.enc.Utf8);
      if (!decrypted) {
        throw new Error('Decryption result is empty');
      }
      setOutput(decrypted);
      messageApi.success('Decrypted successfully');
    } catch (error) {
      console.error(error);
      messageApi.error('Decryption failed. Please check your password and input.');
    }
  };

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      messageApi.success('Copied to clipboard');
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setPassword('');
  };

  return (
    <div className="openssl-tab">
      {contextHolder}
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <Card title="OpenSSL Encryption/Decryption" size="small">
          <Form layout="vertical">
            <Space size="large" wrap>
              <Form.Item label="Algorithm">
                <Select
                  value={algorithm}
                  onChange={setAlgorithm}
                  options={algorithmOptions}
                  style={{ width: 200 }}
                />
              </Form.Item>
              <Form.Item label="Password" required>
                <Input.Password
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter secret password"
                  style={{ width: 250 }}
                />
              </Form.Item>
            </Space>

            <div style={{ marginTop: 16 }}>
              <Text strong>Input</Text>
              <TextArea
                rows={4}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Enter text to encrypt or OpenSSL format string to decrypt (e.g., U2FsdGVkX1...)"
                style={{ marginTop: 8, fontFamily: 'monospace' }}
              />
            </div>

            <Space style={{ marginTop: 16 }}>
              <Button type="primary" icon={<LockOutlined />} onClick={handleEncrypt}>
                Encrypt
              </Button>
              <Button icon={<UnlockOutlined />} onClick={handleDecrypt}>
                Decrypt
              </Button>
              <Button icon={<DeleteOutlined />} onClick={handleClear}>
                Clear
              </Button>
            </Space>

            <div style={{ marginTop: 24 }}>
              <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                <Text strong>Output</Text>
                <Button type="text" icon={<CopyOutlined />} onClick={handleCopy}>
                  Copy
                </Button>
              </Space>
              <TextArea
                rows={4}
                value={output}
                readOnly
                placeholder="Result will appear here..."
                style={{ marginTop: 8, fontFamily: 'monospace', backgroundColor: '#f5f5f5' }}
              />
            </div>
            
            <div style={{ marginTop: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                Note: This tool uses CryptoJS default behavior, which is compatible with `openssl enc -[algo] -k [pass] -md md5`. 
                Output format is Base64 encoded string starting with "Salted__".
              </Text>
            </div>
          </Form>
        </Card>
      </Space>
    </div>
  );
};

export default OpenSSLTab;
