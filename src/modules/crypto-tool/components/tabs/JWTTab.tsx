import React, { useState, useCallback } from 'react';
import { Input, Button, Space, Row, Col, Card, Select, message, Tag, Descriptions, Switch, Tooltip, Tabs } from 'antd';
import { SafetyOutlined, KeyOutlined, CopyOutlined, ReloadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  decodeJWT,
  verifyJWTWithSecret,
  verifyJWTWithPublicKey,
  generateJWTWithSecret,
  generateJWTWithPrivateKey,
  generateRSAKeyPair,
  generateECKeyPair,
  jwtAlgorithms,
  formatTimestamp,
  isExpired,
  payloadFieldDescriptions,
  type JWTAlgorithm,
  type DecodeResult,
} from '../../utils/jwt';

const { TextArea } = Input;

const JWTTab: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('decode');
  
  // 解码/验证状态
  const [token, setToken] = useState('');
  const [secret, setSecret] = useState('');
  const [publicKey, setPublicKey] = useState('');
  const [decodeResult, setDecodeResult] = useState<DecodeResult | null>(null);
  const [verifySignature, setVerifySignature] = useState(false);
  
  // 生成状态
  const [genAlgorithm, setGenAlgorithm] = useState<JWTAlgorithm>('HS256');
  const [genSecret, setGenSecret] = useState('your-256-bit-secret');
  const [genPrivateKey, setGenPrivateKey] = useState('');
  const [genPublicKey, setGenPublicKey] = useState('');
  const [genPayload, setGenPayload] = useState('{\n  "sub": "1234567890",\n  "name": "John Doe",\n  "admin": true\n}');
  const [genExpiresIn, setGenExpiresIn] = useState('1h');
  const [generatedToken, setGeneratedToken] = useState('');

  const isSymmetric = (alg: JWTAlgorithm) => jwtAlgorithms.find(a => a.value === alg)?.type === 'symmetric';

  // 解码 JWT
  const handleDecode = useCallback(async () => {
    if (!token.trim()) {
      message.warning(t('common.invalidInput'));
      return;
    }

    try {
      let result: DecodeResult;
      
      if (verifySignature) {
        const alg = decodeJWT(token).header.alg;
        const isSymAlg = isSymmetric(alg as JWTAlgorithm);
        
        if (isSymAlg) {
          if (!secret.trim()) {
            message.warning(t('modules.crypto.jwt.secretRequired'));
            return;
          }
          result = await verifyJWTWithSecret(token, secret);
        } else {
          if (!publicKey.trim()) {
            message.warning(t('modules.crypto.jwt.publicKeyRequired'));
            return;
          }
          result = await verifyJWTWithPublicKey(token, publicKey);
        }
      } else {
        result = decodeJWT(token);
      }
      
      setDecodeResult(result);
      message.success(t('modules.crypto.jwt.decodeSuccess'));
    } catch (error) {
      message.error(error instanceof Error ? error.message : t('errors.decodeFailed'));
    }
  }, [token, secret, publicKey, verifySignature, t]);

  // 生成 JWT
  const handleGenerate = useCallback(async () => {
    try {
      const payload = JSON.parse(genPayload);
      let jwt: string;
      
      if (isSymmetric(genAlgorithm)) {
        if (!genSecret.trim()) {
          message.warning(t('modules.crypto.jwt.secretRequired'));
          return;
        }
        jwt = await generateJWTWithSecret(payload, genSecret, genAlgorithm, genExpiresIn || undefined);
      } else {
        if (!genPrivateKey.trim()) {
          message.warning(t('modules.crypto.jwt.privateKeyRequired'));
          return;
        }
        jwt = await generateJWTWithPrivateKey(payload, genPrivateKey, genAlgorithm, genExpiresIn || undefined);
      }
      
      setGeneratedToken(jwt);
      message.success(t('modules.crypto.jwt.generateSuccess'));
    } catch (error) {
      message.error(error instanceof Error ? error.message : t('errors.encryptFailed'));
    }
  }, [genPayload, genSecret, genPrivateKey, genAlgorithm, genExpiresIn, t]);

  // 生成密钥对
  const handleGenerateKeyPair = useCallback(async () => {
    try {
      let keyPair;
      if (genAlgorithm.startsWith('ES')) {
        keyPair = await generateECKeyPair(genAlgorithm as 'ES256' | 'ES384' | 'ES512');
      } else {
        keyPair = await generateRSAKeyPair();
      }
      setGenPrivateKey(keyPair.privateKey);
      setGenPublicKey(keyPair.publicKey);
      message.success(t('modules.crypto.jwt.keyPairGenerated'));
    } catch (error) {
      message.error(error instanceof Error ? error.message : t('errors.unknownError'));
    }
  }, [genAlgorithm, t]);

  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      message.success(t('common.copied'));
    } catch {
      message.error(t('common.copyFailed'));
    }
  };

  const renderDecodeTab = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <TextArea
            autoSize={{ minRows: 6, maxRows: 20 }}
            value={token}
            onChange={(e) => setToken(e.target.value)}
            placeholder={t('modules.crypto.jwt.tokenPlaceholder')}
            style={{ fontFamily: 'monospace' }}
          />
          
          <Card size="small" title={t('modules.crypto.jwt.verifyOptions')}>
            <Space direction="vertical" style={{ width: '100%' }}>
              <Space>
                <span>{t('modules.crypto.jwt.verifySignature')}:</span>
                <Switch checked={verifySignature} onChange={setVerifySignature} />
              </Space>
              
              {verifySignature && (
                <>
                  <Input
                    placeholder={t('modules.crypto.jwt.secretPlaceholder')}
                    value={secret}
                    onChange={(e) => setSecret(e.target.value)}
                    prefix={<KeyOutlined />}
                  />
                  <TextArea
                    autoSize={{ minRows: 4, maxRows: 20 }}
                    placeholder={t('modules.crypto.jwt.publicKeyPlaceholder')}
                    value={publicKey}
                    onChange={(e) => setPublicKey(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: 12 }}
                  />
                </>
              )}
            </Space>
          </Card>
          
          <Button type="primary" icon={<SafetyOutlined />} onClick={handleDecode}>
            {verifySignature ? t('modules.crypto.jwt.decodeAndVerify') : t('modules.crypto.jwt.decode')}
          </Button>
        </Space>
      </Col>
      
      <Col xs={24} lg={12}>
        {decodeResult && (
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {decodeResult.isValid !== undefined && (
              <Tag
                icon={decodeResult.isValid ? <CheckCircleOutlined /> : <CloseCircleOutlined />}
                color={decodeResult.isValid ? 'success' : 'error'}
                style={{ fontSize: 14, padding: '4px 12px' }}
              >
                {decodeResult.isValid ? t('modules.crypto.jwt.signatureValid') : t('modules.crypto.jwt.signatureInvalid')}
              </Tag>
            )}
            
            <Card
              size="small"
              title={<span style={{ color: '#e74c3c' }}>Header</span>}
              extra={<Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(JSON.stringify(decodeResult.header, null, 2))} />}
            >
              <pre style={{ margin: 0, fontSize: 12, overflow: 'auto' }}>
                {JSON.stringify(decodeResult.header, null, 2)}
              </pre>
            </Card>
            
            <Card
              size="small"
              title={<span style={{ color: '#9b59b6' }}>Payload</span>}
              extra={<Button size="small" icon={<CopyOutlined />} onClick={() => handleCopy(JSON.stringify(decodeResult.payload, null, 2))} />}
            >
              <pre style={{ margin: 0, fontSize: 12, overflow: 'auto', maxHeight: 200 }}>
                {JSON.stringify(decodeResult.payload, null, 2)}
              </pre>
              
              {(decodeResult.payload.exp || decodeResult.payload.iat || decodeResult.payload.nbf) && (
                <Descriptions size="small" column={1} style={{ marginTop: 12 }}>
                  {decodeResult.payload.iat && (
                    <Descriptions.Item label={payloadFieldDescriptions.iat}>
                      {formatTimestamp(decodeResult.payload.iat)}
                    </Descriptions.Item>
                  )}
                  {decodeResult.payload.exp && (
                    <Descriptions.Item label={payloadFieldDescriptions.exp}>
                      <Space>
                        {formatTimestamp(decodeResult.payload.exp)}
                        {isExpired(decodeResult.payload.exp) ? (
                          <Tag color="error">{t('modules.crypto.jwt.expired')}</Tag>
                        ) : (
                          <Tag color="success">{t('modules.crypto.jwt.valid')}</Tag>
                        )}
                      </Space>
                    </Descriptions.Item>
                  )}
                  {decodeResult.payload.nbf && (
                    <Descriptions.Item label={payloadFieldDescriptions.nbf}>
                      {formatTimestamp(decodeResult.payload.nbf)}
                    </Descriptions.Item>
                  )}
                </Descriptions>
              )}
            </Card>
            
            <Card size="small" title={<span style={{ color: '#3498db' }}>Signature</span>}>
              <div style={{ wordBreak: 'break-all', fontSize: 12, fontFamily: 'monospace' }}>
                {decodeResult.signature}
              </div>
            </Card>
          </Space>
        )}
      </Col>
    </Row>
  );

  const renderGenerateTab = () => (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card size="small" title={t('modules.crypto.jwt.algorithm')}>
            <Select
              style={{ width: '100%' }}
              value={genAlgorithm}
              onChange={setGenAlgorithm}
              options={jwtAlgorithms.map(a => ({ value: a.value, label: a.label }))}
            />
          </Card>
          
          {isSymmetric(genAlgorithm) ? (
            <Card size="small" title={t('modules.crypto.jwt.secret')}>
              <Input
                value={genSecret}
                onChange={(e) => setGenSecret(e.target.value)}
                prefix={<KeyOutlined />}
              />
            </Card>
          ) : (
            <Card
              size="small"
              title={t('modules.crypto.jwt.keyPair')}
              extra={
                <Button size="small" icon={<ReloadOutlined />} onClick={handleGenerateKeyPair}>
                  {t('modules.crypto.jwt.generateKeyPair')}
                </Button>
              }
            >
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <div style={{ marginBottom: 4 }}>{t('modules.crypto.jwt.privateKey')}:</div>
                  <TextArea
                    autoSize={{ minRows: 4, maxRows: 20 }}
                    value={genPrivateKey}
                    onChange={(e) => setGenPrivateKey(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: 11 }}
                  />
                </div>
                <div>
                  <div style={{ marginBottom: 4 }}>{t('modules.crypto.jwt.publicKey')}:</div>
                  <TextArea
                    autoSize={{ minRows: 4, maxRows: 20 }}
                    value={genPublicKey}
                    onChange={(e) => setGenPublicKey(e.target.value)}
                    style={{ fontFamily: 'monospace', fontSize: 11 }}
                  />
                </div>
              </Space>
            </Card>
          )}
          
          <Card size="small" title="Payload (JSON)">
            <TextArea
              autoSize={{ minRows: 6, maxRows: 20 }}
              value={genPayload}
              onChange={(e) => setGenPayload(e.target.value)}
              style={{ fontFamily: 'monospace' }}
            />
          </Card>
          
          <Space>
            <Tooltip title={t('modules.crypto.jwt.expiresInTip')}>
              <Input
                style={{ width: 120 }}
                placeholder="1h, 7d, 30m"
                value={genExpiresIn}
                onChange={(e) => setGenExpiresIn(e.target.value)}
                addonBefore="exp"
              />
            </Tooltip>
            <Button type="primary" icon={<SafetyOutlined />} onClick={handleGenerate}>
              {t('modules.crypto.jwt.generate')}
            </Button>
          </Space>
        </Space>
      </Col>
      
      <Col xs={24} lg={12}>
        <Card
          title={t('modules.crypto.jwt.generatedToken')}
          extra={
            <Button
              icon={<CopyOutlined />}
              onClick={() => handleCopy(generatedToken)}
              disabled={!generatedToken}
            >
              {t('common.copy')}
            </Button>
          }
        >
          <TextArea
            autoSize={{ minRows: 10, maxRows: 20 }}
            value={generatedToken}
            readOnly
            style={{ fontFamily: 'monospace', wordBreak: 'break-all' }}
            placeholder={t('modules.crypto.jwt.generatedTokenPlaceholder')}
          />
        </Card>
      </Col>
    </Row>
  );

  return (
    <>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={[
          { key: 'decode', label: t('modules.crypto.jwt.tabs.decode') },
          { key: 'generate', label: t('modules.crypto.jwt.tabs.generate') },
        ]}
      />
      {activeTab === 'decode' ? renderDecodeTab() : renderGenerateTab()}
    </>
  );
};

export default JWTTab;
