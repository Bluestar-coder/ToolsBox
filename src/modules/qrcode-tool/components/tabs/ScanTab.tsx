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
type Html5QrcodeInstance = {
  start: (
    cameraConfig: { facingMode: string },
    config: { fps: number; qrbox: { width: number; height: number } },
    onSuccess: (decodedText: string) => void,
    onError: (errorMessage: string) => void
  ) => Promise<void>;
  stop: () => Promise<void>;
  scanFile: (file: File, showImage?: boolean) => Promise<string>;
};

let html5QrcodeCtorPromise: Promise<new (elementId: string) => Html5QrcodeInstance> | null = null;

async function getHtml5QrcodeCtor(): Promise<new (elementId: string) => Html5QrcodeInstance> {
  if (!html5QrcodeCtorPromise) {
    html5QrcodeCtorPromise = import('html5-qrcode').then((mod) => mod.Html5Qrcode);
  }
  return html5QrcodeCtorPromise;
}

const ScanTab: React.FC = () => {
  const { t } = useTranslation();
  const [result, setResult] = useState('');
  const [scanning, setScanning] = useState(false);
  const [nativeScanning, setNativeScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string>('');
  const [pasteLoading, setPasteLoading] = useState(false);
  const html5QrCodeRef = useRef<Html5QrcodeInstance | null>(null);
  const nativeSessionRef = useRef<{ stop: () => Promise<void> } | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const scannerContainerId = 'qr-scanner-container';

  const stopScanning = useCallback(async () => {
    if (nativeSessionRef.current) {
      try {
        await nativeSessionRef.current.stop();
      } catch {
        // ignore
      }
      nativeSessionRef.current = null;
    }
    if (html5QrCodeRef.current) {
      try {
        await html5QrCodeRef.current.stop();
      } catch {
        // ignore
      }
      html5QrCodeRef.current = null;
    }
    setNativeScanning(false);
    setScanning(false);
  }, []);

  const detectWithFallback = useCallback(async (file: Blob): Promise<string> => {
    if (canUseNativeBarcodeDetector()) {
      const nativeResult = await detectQrCodeFromBlob(file);
      if (nativeResult) {
        return nativeResult;
      }
    }

    const Html5Qrcode = await getHtml5QrcodeCtor();
    const html5QrCode = new Html5Qrcode('qr-file-scanner');
    return html5QrCode.scanFile(file as File, true);
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
          setNativeScanning(true);
          setScanning(true);
          return;
        }
      }

      const Html5Qrcode = await getHtml5QrcodeCtor();
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
            
            <div
              id={scannerContainerId}
              style={{
                width: '100%',
                minHeight: scanning ? 300 : 0,
                display: scanning && !nativeScanning ? 'block' : 'none',
              }}
            />
            <video
              ref={videoRef}
              style={{
                width: '100%',
                minHeight: nativeScanning ? 300 : 0,
                display: nativeScanning ? 'block' : 'none',
                borderRadius: 12,
                background: '#000',
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
