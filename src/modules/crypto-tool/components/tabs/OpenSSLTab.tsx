import React, { useState, useEffect, useRef } from 'react';
import { Button, Input, Select, Space, message, Typography, Form, Card, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import CryptoWorker from '../../utils/crypto.worker?worker';
import { 
  CopyOutlined, 
  DeleteOutlined, 
  LockOutlined, 
  UnlockOutlined 
} from '@ant-design/icons';

const { Text } = Typography;
const { TextArea } = Input;

export const OpenSSLTab: React.FC = () => {
  const { t } = useTranslation();
  const [algorithm, setAlgorithm] = useState('AES-256-CBC');
  const [password, setPassword] = useState('');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [messageApi, contextHolder] = message.useMessage();
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new CryptoWorker();
    
    workerRef.current.onmessage = (e) => {
      const { success, result, error } = e.data;
      setLoading(false);
      
      if (success) {
        setOutput(result);
        messageApi.success(t('modules.crypto.openssl.encryptSuccess')); // Message might need context
      } else {
        console.error(error);
        messageApi.error(t('modules.crypto.openssl.encryptFailed'));
      }
    };

    return () => {
      workerRef.current?.terminate();
    };
  }, [messageApi, t]);

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
      messageApi.error(t('modules.crypto.openssl.passwordRequired'));
      return;
    }
    if (!input) {
      messageApi.warning(t('modules.crypto.openssl.contentRequired'));
      return;
    }

    setLoading(true);
    workerRef.current?.postMessage({
      id: Date.now().toString(),
      type: 'encrypt',
      algorithm,
      input,
      password
    });
  };

  const handleDecrypt = () => {
    if (!password) {
      messageApi.error(t('modules.crypto.openssl.passwordRequired'));
      return;
    }
    if (!input) {
      messageApi.warning(t('modules.crypto.openssl.decryptContentRequired'));
      return;
    }

    setLoading(true);
    workerRef.current?.postMessage({
      id: Date.now().toString(),
      type: 'decrypt',
      algorithm,
      input,
      password
    });
  };

  const handleCopy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      messageApi.success(t('modules.crypto.openssl.copySuccess'));
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
        <Card title={t('modules.crypto.openssl.title')} size="small">
          <Form layout="vertical">
            <Space size="large" wrap>
              <Form.Item label={t('modules.crypto.openssl.algorithm')}>
                <Select
                  value={algorithm}
                  onChange={setAlgorithm}
                  options={algorithmOptions}
                  style={{ width: 200 }}
                />
              </Form.Item>
              <Form.Item label={t('modules.crypto.openssl.password')} required>
                <Input.Password
                  id="openssl-password"
                  name="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={t('modules.crypto.openssl.passwordPlaceholder')}
                  style={{ width: 250 }}
                />
              </Form.Item>
            </Space>

            <div style={{ marginTop: 16 }}>
              <Text strong>{t('modules.crypto.openssl.input')}</Text>
              <TextArea
                id="openssl-input"
                name="input"
                rows={4}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={t('modules.crypto.openssl.inputPlaceholder')}
                style={{ marginTop: 8, fontFamily: 'monospace' }}
              />
            </div>

            <Space style={{ marginTop: 16 }}>
              <Button type="primary" icon={<LockOutlined />} onClick={handleEncrypt}>
                {t('modules.crypto.openssl.encrypt')}
              </Button>
              <Button icon={<UnlockOutlined />} onClick={handleDecrypt}>
                {t('modules.crypto.openssl.decrypt')}
              </Button>
              <Button icon={<DeleteOutlined />} onClick={handleClear}>
                {t('modules.crypto.openssl.clear')}
              </Button>
            </Space>

            <div style={{ marginTop: 24 }}>
              <Spin spinning={loading}>
                <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                  <Text strong>{t('modules.crypto.openssl.output')}</Text>
                  <Button type="text" icon={<CopyOutlined />} onClick={handleCopy}>
                    {t('modules.crypto.openssl.copy')}
                  </Button>
                </Space>
                <TextArea
                  id="openssl-output"
                  name="output"
                  rows={4}
                  value={output}
                  readOnly
                  placeholder={t('modules.crypto.openssl.resultPlaceholder')}
                  style={{ marginTop: 8, fontFamily: 'monospace', backgroundColor: '#f5f5f5' }}
                />
              </Spin>
            </div>
            
            <div style={{ marginTop: 16 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                {t('modules.crypto.openssl.note')}
              </Text>
            </div>
          </Form>
        </Card>
      </Space>
    </div>
  );
};

export default OpenSSLTab;
