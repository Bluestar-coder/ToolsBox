import React, { useState, useCallback, useEffect } from 'react';
import { Input, Button, Space, Row, Col, Slider, Select, ColorPicker, message, Card, Tooltip } from 'antd';
import { DownloadOutlined, CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import {
  generateQRCodeDataURL,
  downloadQRCode,
  errorCorrectionLevels,
  type QRCodeOptions,
} from '../../utils/qrcode';
import { logger } from '../../../../utils/logger';

const { TextArea } = Input;

const GenerateTab: React.FC = () => {
  const { t } = useTranslation();
  const [text, setText] = useState('');
  const [qrCodeDataURL, setQrCodeDataURL] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [options, setOptions] = useState<QRCodeOptions>({
    width: 256,
    margin: 2,
    errorCorrectionLevel: 'M',
    color: {
      dark: '#000000',
      light: '#ffffff',
    },
  });

  const generateQRCode = useCallback(async () => {
    if (!text.trim()) {
      setQrCodeDataURL('');
      return;
    }
    setLoading(true);
    try {
      const dataURL = await generateQRCodeDataURL(text, options);
      setQrCodeDataURL(dataURL);
    } catch (error) {
      message.error(t('modules.qrcode.generateFailed'));
      logger.error(error);
    } finally {
      setLoading(false);
    }
  }, [text, options, t]);

  // 自动生成二维码
  useEffect(() => {
    const timer = setTimeout(() => {
      generateQRCode();
    }, 300);
    return () => clearTimeout(timer);
  }, [text, options, generateQRCode]);

  const handleDownload = () => {
    if (qrCodeDataURL) {
      downloadQRCode(qrCodeDataURL, `qrcode-${Date.now()}.png`);
      message.success(t('common.success'));
    }
  };

  const handleCopy = async () => {
    if (!qrCodeDataURL) return;
    try {
      const response = await fetch(qrCodeDataURL);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': blob }),
      ]);
      message.success(t('common.copied'));
    } catch {
      message.error(t('common.copyFailed'));
    }
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <TextArea
            rows={6}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={t('modules.qrcode.inputPlaceholder')}
            showCount
            maxLength={2000}
          />
          
          <Card size="small" title={t('modules.qrcode.options')}>
            <Space direction="vertical" style={{ width: '100%' }} size="small">
              <div>
                <span>{t('modules.qrcode.size')}: {options.width}px</span>
                <Slider
                  min={128}
                  max={512}
                  step={32}
                  value={options.width}
                  onChange={(value) => setOptions({ ...options, width: value })}
                />
              </div>
              
              <div>
                <span>{t('modules.qrcode.margin')}: {options.margin}</span>
                <Slider
                  min={0}
                  max={10}
                  value={options.margin}
                  onChange={(value) => setOptions({ ...options, margin: value })}
                />
              </div>
              
              <div>
                <span>{t('modules.qrcode.errorCorrection')}:</span>
                <Select
                  style={{ width: '100%', marginTop: 4 }}
                  value={options.errorCorrectionLevel}
                  onChange={(value) => setOptions({ ...options, errorCorrectionLevel: value })}
                  options={errorCorrectionLevels.map((level) => ({
                    value: level.value,
                    label: (
                      <Tooltip title={level.description}>
                        {level.label}
                      </Tooltip>
                    ),
                  }))}
                />
              </div>
              
              <Row gutter={16}>
                <Col span={12}>
                  <span>{t('modules.qrcode.foreground')}:</span>
                  <ColorPicker
                    value={options.color.dark}
                    onChange={(color) =>
                      setOptions({
                        ...options,
                        color: { ...options.color, dark: color.toHexString() },
                      })
                    }
                    showText
                  />
                </Col>
                <Col span={12}>
                  <span>{t('modules.qrcode.background')}:</span>
                  <ColorPicker
                    value={options.color.light}
                    onChange={(color) =>
                      setOptions({
                        ...options,
                        color: { ...options.color, light: color.toHexString() },
                      })
                    }
                    showText
                  />
                </Col>
              </Row>
            </Space>
          </Card>
        </Space>
      </Col>
      
      <Col xs={24} lg={12}>
        <Card
          title={t('modules.qrcode.preview')}
          extra={
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={generateQRCode}
                loading={loading}
              >
                {t('common.refresh')}
              </Button>
              <Button
                icon={<CopyOutlined />}
                onClick={handleCopy}
                disabled={!qrCodeDataURL}
              >
                {t('common.copy')}
              </Button>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={handleDownload}
                disabled={!qrCodeDataURL}
              >
                {t('common.download')}
              </Button>
            </Space>
          }
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              minHeight: 280,
              background: '#f5f5f5',
              borderRadius: 8,
            }}
          >
            {qrCodeDataURL ? (
              <img
                src={qrCodeDataURL}
                alt="QR Code"
                style={{ maxWidth: '100%', maxHeight: 280 }}
              />
            ) : (
              <span style={{ color: '#999' }}>{t('modules.qrcode.noPreview')}</span>
            )}
          </div>
        </Card>
      </Col>
    </Row>
  );
};

export default GenerateTab;
