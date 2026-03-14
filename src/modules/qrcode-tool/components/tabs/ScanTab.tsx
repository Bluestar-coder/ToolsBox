import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Button, Space, Row, Col, Card, message, Upload, Input, Alert } from 'antd';
import { CameraOutlined, UploadOutlined, CopyOutlined, StopOutlined, SnippetsOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { logger } from '../../../../utils/logger';
import {
  canUseNativeBarcodeDetector,
  detectQrCodeFromBlob,
  startNativeCameraQrScan,
} from '../../utils/barcode-detector';

const { TextArea } = Input;
type JsQrScannerInstance = {
  start: (onDetected: (decodedText: string) => void, onError?: (error: Error) => void) => Promise<void>;
  stop: () => Promise<void>;
};

let jsQrFallbackPromise:
  | Promise<{
      createJsQrScanner: (videoElement: HTMLVideoElement) => JsQrScannerInstance;
      scanQrCodeFileWithJsQr: (file: Blob) => Promise<string>;
    }>
  | null = null;

async function loadJsQrFallback() {
  if (!jsQrFallbackPromise) {
    jsQrFallbackPromise = import('../../utils/jsqr-fallback');
  }
  return jsQrFallbackPromise;
}

const ScanTab: React.FC = () => {
  const { t } = useTranslation();
  const [result, setResult] = useState('');
  const [scanning, setScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [pasteLoading, setPasteLoading] = useState(false);
  const jsQrScannerRef = useRef<JsQrScannerInstance | null>(null);
  const nativeSessionRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const stopScanning = useCallback(async () => {
    if (nativeSessionRef.current) {
      try {
        await nativeSessionRef.current.stop();
      } catch {
        // ignore
      }
      nativeSessionRef.current = null;
    }
    if (jsQrScannerRef.current) {
      try {
        await jsQrScannerRef.current.stop();
      } catch {
        // ignore
      }
      jsQrScannerRef.current = null;
    }
    setScanning(false);
  }, []);

  const detectWithFallback = useCallback(async (file: Blob): Promise<string> => {
    if (canUseNativeBarcodeDetector()) {
      const nativeResult = await detectQrCodeFromBlob(file);
      if (nativeResult) {
        return nativeResult;
      }
    }

    const { scanQrCodeFileWithJsQr } = await loadJsQrFallback();
    return scanQrCodeFileWithJsQr(file);
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
          const scanResult = await detectWithFallback(file);
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
  }, [detectWithFallback, t]);

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
              const scanResult = await detectWithFallback(file);
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
  }, [detectWithFallback, t]);

  useEffect(() => {
    return () => {
      stopScanning();
    };
  }, [stopScanning]);

  const startScanning = async () => {
    setCameraError('');
    try {
      const nativeVideo = videoRef.current;
      if (nativeVideo && canUseNativeBarcodeDetector()) {
        const nativeSession = await startNativeCameraQrScan(nativeVideo, (decodedText) => {
          setResult(decodedText);
          message.success(t('modules.qrcode.scanSuccess'));
          void stopScanning();
        });

        if (nativeSession) {
          nativeSessionRef.current = nativeSession;
          setScanning(true);
          return;
        }
      }

      if (!nativeVideo) {
        throw new Error('Video element missing');
      }

      const { createJsQrScanner } = await loadJsQrFallback();
      const scanner = createJsQrScanner(nativeVideo);
      jsQrScannerRef.current = scanner;

      await scanner.start(
        (decodedText) => {
          setResult(decodedText);
          message.success(t('modules.qrcode.scanSuccess'));
          void stopScanning();
        },
        (error) => {
          logger.warn('Fallback QR scan warning:', error);
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
      const scanResult = await detectWithFallback(file);
      setResult(scanResult);
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
          <Space orientation="vertical" style={{ width: '100%' }} size="middle">
            {cameraError && (
              <Alert title={cameraError} type="error" showIcon closable />
            )}
            <video
              ref={videoRef}
              style={{
                width: '100%',
                minHeight: scanning ? 300 : 0,
                display: scanning ? 'block' : 'none',
                borderRadius: 12,
                background: '#000',
              }}
            />

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
              title={t('modules.qrcode.scanTipWithPaste')}
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
