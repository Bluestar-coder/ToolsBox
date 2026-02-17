import React, { useState, useCallback } from 'react';
import { Input, Card, Descriptions, Alert, Tag, Space } from 'antd';
import { useTranslation } from 'react-i18next';
import { convertIPv4, convertIPv6 } from '../../utils/ip-converter';
import { detectIpFormat } from '../../utils/ip-utils';
import type { IPv4Formats, IPv6Formats, IpInputFormat } from '../../utils/types';

const formatLabelKey: Record<IpInputFormat, string> = {
  dotted: 'modules.ipNetwork.converter.formatDotted',
  hex: 'modules.ipNetwork.converter.formatHex',
  binary: 'modules.ipNetwork.converter.formatBinary',
  integer: 'modules.ipNetwork.converter.formatInteger',
  ipv6: 'modules.ipNetwork.converter.formatIpv6',
  unknown: 'modules.ipNetwork.converter.formatUnknown',
};

const formatTagColor: Record<IpInputFormat, string> = {
  dotted: 'blue',
  hex: 'purple',
  binary: 'cyan',
  integer: 'orange',
  ipv6: 'green',
  unknown: 'default',
};

const IpConverterTab: React.FC = () => {
  const { t } = useTranslation();
  const [input, setInput] = useState<string>('');
  const [detectedFormat, setDetectedFormat] = useState<IpInputFormat>('unknown');
  const [ipv4Result, setIpv4Result] = useState<IPv4Formats | null>(null);
  const [ipv6Result, setIpv6Result] = useState<IPv6Formats | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setInput(value);

      const trimmed = value.trim();
      if (!trimmed) {
        setDetectedFormat('unknown');
        setIpv4Result(null);
        setIpv6Result(null);
        setError(null);
        return;
      }

      const format = detectIpFormat(trimmed);
      setDetectedFormat(format);

      if (format === 'unknown') {
        setIpv4Result(null);
        setIpv6Result(null);
        setError(t('modules.ipNetwork.converter.errorInvalid'));
        return;
      }

      try {
        if (format === 'ipv6') {
          setIpv6Result(convertIPv6(trimmed));
          setIpv4Result(null);
        } else {
          setIpv4Result(convertIPv4(trimmed));
          setIpv6Result(null);
        }
        setError(null);
      } catch (err) {
        setIpv4Result(null);
        setIpv6Result(null);
        setError(err instanceof Error ? err.message : t('modules.ipNetwork.converter.errorUnknown'));
      }
    },
    [t],
  );

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Card size="small" title={t('modules.ipNetwork.converter.inputTitle')}>
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder={t('modules.ipNetwork.converter.placeholder')}
            allowClear
            style={{ fontFamily: 'monospace' }}
          />
          {input.trim() && (
            <div>
              <span style={{ marginRight: 8 }}>{t('modules.ipNetwork.converter.detectedFormat')}:</span>
              <Tag color={formatTagColor[detectedFormat]}>
                {t(formatLabelKey[detectedFormat])}
              </Tag>
            </div>
          )}
        </Space>
      </Card>

      {error && (
        <Alert
          type="error"
          showIcon
          title={t('modules.ipNetwork.converter.errorTitle')}
          description={error}
        />
      )}

      {ipv4Result && (
        <Card size="small" title={t('modules.ipNetwork.converter.ipv4ResultTitle')}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label={t('modules.ipNetwork.converter.dotted')}>
              <code>{ipv4Result.dotted}</code>
            </Descriptions.Item>
            <Descriptions.Item label={t('modules.ipNetwork.converter.hex')}>
              <code>{ipv4Result.hex}</code>
            </Descriptions.Item>
            <Descriptions.Item label={t('modules.ipNetwork.converter.hexDotted')}>
              <code>{ipv4Result.hexDotted}</code>
            </Descriptions.Item>
            <Descriptions.Item label={t('modules.ipNetwork.converter.binary')}>
              <code>{ipv4Result.binary}</code>
            </Descriptions.Item>
            <Descriptions.Item label={t('modules.ipNetwork.converter.integer')}>
              <code>{ipv4Result.integer}</code>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      {ipv6Result && (
        <Card size="small" title={t('modules.ipNetwork.converter.ipv6ResultTitle')}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label={t('modules.ipNetwork.converter.full')}>
              <code>{ipv6Result.full}</code>
            </Descriptions.Item>
            <Descriptions.Item label={t('modules.ipNetwork.converter.compressed')}>
              <code>{ipv6Result.compressed}</code>
            </Descriptions.Item>
            <Descriptions.Item label={t('modules.ipNetwork.converter.binaryIpv6')}>
              <code style={{ wordBreak: 'break-all' }}>{ipv6Result.binary}</code>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}
    </Space>
  );
};

export default IpConverterTab;
