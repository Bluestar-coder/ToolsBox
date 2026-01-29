import React, { useState, useCallback } from 'react';
import { Input, Button, Space, Row, Col, Card, Checkbox, message, Tag, Collapse, Typography } from 'antd';
import { ThunderboltOutlined, CopyOutlined, ClearOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { smartDecode, supportedDecodeTypes, type DecodeMatch } from '../../utils/smart-decoder';

const { TextArea } = Input;
const { Text } = Typography;

const SmartDecodeTab: React.FC = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [matches, setMatches] = useState<DecodeMatch[]>([]);
  const [options, setOptions] = useState({
    decodeUrl: true,
    decodeBase64: true,
    decodeUnicode: true,
    decodeHtml: true,
    decodeHex: true,
  });

  const handleDecode = useCallback(() => {
    if (!input.trim()) {
      message.warning(t('common.invalidInput'));
      return;
    }

    const result = smartDecode(input, options);
    if (result.success) {
      setOutput(result.result);
      setMatches(result.matches);
      if (result.matches.length > 0) {
        message.success(t('modules.encoder.smart.decodeSuccess', { count: result.matches.length }));
      } else {
        message.info(t('modules.encoder.smart.noEncodingFound'));
      }
    } else {
      message.error(result.error || t('errors.decodeFailed'));
    }
  }, [input, options, t]);

  const handleCopy = async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      message.success(t('common.copied'));
    } catch {
      message.error(t('common.copyFailed'));
    }
  };

  const handleClear = () => {
    setInput('');
    setOutput('');
    setMatches([]);
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      URL: 'blue',
      Base64: 'green',
      Unicode: 'purple',
      HTML: 'orange',
      Hex: 'cyan',
    };
    return colors[type] || 'default';
  };

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} lg={12}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card size="small" title={t('modules.encoder.smart.options')}>
            <Space wrap>
              {supportedDecodeTypes.map((type) => (
                <Checkbox
                  key={type.key}
                  checked={options[`decode${type.key.charAt(0).toUpperCase() + type.key.slice(1)}` as keyof typeof options]}
                  onChange={(e) =>
                    setOptions({
                      ...options,
                      [`decode${type.key.charAt(0).toUpperCase() + type.key.slice(1)}`]: e.target.checked,
                    })
                  }
                >
                  {type.label}
                </Checkbox>
              ))}
            </Space>
          </Card>

          <TextArea
            autoSize={{ minRows: 12, maxRows: 20 }}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={t('modules.encoder.smart.inputPlaceholder')}
          />

          <Space>
            <Button
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={handleDecode}
            >
              {t('modules.encoder.smart.decode')}
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleClear}>
              {t('common.clear')}
            </Button>
          </Space>
        </Space>
      </Col>

      <Col xs={24} lg={12}>
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card
            size="small"
            title={t('modules.encoder.smart.result')}
            extra={
              <Button
                icon={<CopyOutlined />}
                onClick={handleCopy}
                disabled={!output}
                size="small"
              >
                {t('common.copy')}
              </Button>
            }
          >
            <TextArea
              autoSize={{ minRows: 8, maxRows: 20 }}
              value={output}
              readOnly
              placeholder={t('modules.encoder.smart.resultPlaceholder')}
            />
          </Card>

          {matches.length > 0 && (
            <Card size="small" title={t('modules.encoder.smart.details')}>
              <Collapse
                size="small"
                items={matches.map((match, index) => ({
                  key: index,
                  label: (
                    <Space>
                      <Tag color={getTypeColor(match.type)}>{match.type}</Tag>
                      <Text ellipsis style={{ maxWidth: 200 }}>
                        {match.original.substring(0, 30)}
                        {match.original.length > 30 ? '...' : ''}
                      </Text>
                    </Space>
                  ),
                  children: (
                    <Space direction="vertical" style={{ width: '100%' }}>
                      <div>
                        <Text type="secondary">{t('modules.encoder.smart.original')}:</Text>
                        <div style={{ 
                          background: '#f5f5f5', 
                          padding: 8, 
                          borderRadius: 4,
                          wordBreak: 'break-all',
                          maxHeight: 100,
                          overflow: 'auto'
                        }}>
                          <code>{match.original}</code>
                        </div>
                      </div>
                      <div>
                        <Text type="secondary">{t('modules.encoder.smart.decoded')}:</Text>
                        <div style={{ 
                          background: '#f0fff0', 
                          padding: 8, 
                          borderRadius: 4,
                          wordBreak: 'break-all',
                          maxHeight: 100,
                          overflow: 'auto'
                        }}>
                          <code>{match.decoded}</code>
                        </div>
                      </div>
                    </Space>
                  ),
                }))}
              />
            </Card>
          )}
        </Space>
      </Col>
    </Row>
  );
};

export default SmartDecodeTab;
