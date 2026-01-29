import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Space, Row, Col, Card, message, Upload, Input, Alert } from 'antd';
import { CameraOutlined, UploadOutlined, CopyOutlined, StopOutlined, SnippetsOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Html5Qrcode } from 'html5-qrcode';
import { logger } from '../../../../utils/logger';

const { TextArea } = Input;

const ScanTab: React.FC = () => {
  const { t } = useTranslation();
  const [result, setResult] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [pasteLoading, setPasteLoading] = useState(false);
  const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerId = 'qr-scanner-container';

  const stopScanning = useCallback(async () => {
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch {
        // ignore
      }
      html5QrCodeRef.current = null;
    }
    setScanning(false);
  }, []);

  // 从剪贴板粘贴图片识别
  const handlePasteFromClipboard = useCallback(async () => {
    setPasteLoading(true);
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], 'clipboard-image.png', { type: imageType });
          const html5QrCode = new Html5Qrcode('qr-file-scanner');
          const scanResult = await html5QrCode.scanFile(file, true);
          setResult(scanResult);
          message.success(t('modules.qrcode.scanSuccess'));
          return;
        }
      }
      message.warning(t('modules.qrcode.noImageInClipboard'));
    } catch (error) {
      logger.error('Paste error:', error);
      message.error(t('modules.qrcode.pasteFailed'));
    } finally {
      setPasteLoading(false);
    }
  }, [t]);

  // 监听全局粘贴事件
  useEffect(() => {
    const handlePaste = async (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (const item of items) {
        if (item.type.startsWith('image/')) {
          e.preventDefault();
          const file = item.getAsFile();
          if (file) {
            try {
              const html5QrCode = new Html5Qrcode('qr-file-scanner');
              const scanResult = await html5QrCode.scanFile(file, true);
              setResult(scanResult);
              message.success(t('modules.qrcode.scanSuccess'));
            } catch {
              message.error(t('modules.qrcode.scanFailed'));
            }
          }
          break;
        }
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [t]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  const startScanning = async () => {
    setCameraError('');
    try {
      const html5QrCode = new Html5Qrcode(scannerContainerId);
      html5QrCodeRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
        },
        (decodedText) => {
          setResult(decodedText);
          message.success(t('modules.qrcode.scanSuccess'));
          stopScanning();
        },
        () => {
          // ignore scan errors
        }
      );
      setScanning(true);
    } catch (error) {
      logger.error('Camera error:', error);
      setCameraError(t('modules.qrcode.cameraError'));
      setScanning(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const html5QrCode = new Html5Qrcode('qr-file-scanner');
      const result = await html5QrCode.scanFile(file, true);
      setResult(result);
      message.success(t('modules.qrcode.scanSuccess'));
    } catch {
      message.error(t('modules.qrcode.scanFailed'));
    }
    return false;
  };

  const handleCopy = async () => {
    if (!result) return;
    try {
      await navigator.clipboard.writeText(result);
      message.success(t('common.copied'));
    } catch {
      message.error(t('common.copyFailed'));
    }
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Card title={t('modules.qrcode.scanMethods')}>
          <Space direction="vertical" style={{ width: '100%' }} size="middle">
            {cameraError && (
              <Alert message={cameraError} type="error" showIcon closable />
            )}
            
            <div
              id={scannerContainerId}
              style={{
                width: '100%',
                minHeight: scanning ? 300 : 0,
                display: scanning ? 'block' : 'none',
              }}
            />
            <div id="qr-file-scanner" style={{ display: 'none' }} />
            
            <Space wrap>
              {!scanning ? (
                <Button
                  type="primary"
                  icon={<CameraOutlined />}
                  onClick={startScanning}
                >
                  {t('modules.qrcode.startCamera')}
                </Button>
              ) : (
                <Button
                  danger
                  icon={<StopOutlined />}
                  onClick={stopScanning}
                >
                  {t('modules.qrcode.stopCamera')}
                </Button>
              )}
              
              <Upload
                accept="image/*"
                showUploadList={false}
                beforeUpload={handleFileUpload}
              >
                <Button icon={<UploadOutlined />}>
                  {t('modules.qrcode.uploadImage')}
                </Button>
              </Upload>

              <Button
                icon={<SnippetsOutlined />}
                onClick={handlePasteFromClipboard}
                loading={pasteLoading}
              >
                {t('modules.qrcode.pasteImage')}
              </Button>
            </Space>
            
            <Alert
              message={t('modules.qrcode.scanTipWithPaste')}
              type="info"
              showIcon
            />
          </Space>
        </Card>
      </Col>
      
      <Col xs={24} lg={12}>
        <Card
          title={t('modules.qrcode.scanResult')}
          extra={
            <Button
              icon={<CopyOutlined />}
              onClick={handleCopy}
              disabled={!result}
            >
              {t('common.copy')}
            </Button>
          }
        >
          <TextArea
            autoSize={{ minRows: 10, maxRows: 20 }}
            value={result}
            onChange={(e) => setResult(e.target.value)}
            placeholder={t('modules.qrcode.resultPlaceholder')}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default ScanTab;
