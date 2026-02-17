import React, { useState, useCallback } from 'react';
import { Input, Card, Descriptions, Alert, Space, Button, Divider } from 'antd';
import { useTranslation } from 'react-i18next';
import { calculateCidr, calculateMinimumCidr, isValidCidr } from '../../utils/cidr-calculator';
import type { CidrInfo } from '../../utils/types';

const CidrCalculatorTab: React.FC = () => {
  const { t } = useTranslation();
  const [cidrInput, setCidrInput] = useState<string>('');
  const [result, setResult] = useState<CidrInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [ip1, setIp1] = useState<string>('');
  const [ip2, setIp2] = useState<string>('');
  const [minCidrResult, setMinCidrResult] = useState<string | null>(null);
  const [minCidrError, setMinCidrError] = useState<string | null>(null);

  const handleCidrChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const value = e.target.value;
      setCidrInput(value);

      const trimmed = value.trim();
      if (!trimmed) {
        setResult(null);
        setError(null);
        return;
      }

      if (!isValidCidr(trimmed)) {
        setResult(null);
        setError(t('modules.ipNetwork.cidr.errorInvalidCidr'));
        return;
      }

      try {
        setResult(calculateCidr(trimmed));
        setError(null);
      } catch (err) {
        setResult(null);
        setError(err instanceof Error ? err.message : t('modules.ipNetwork.cidr.errorUnknown'));
      }
    },
    [t],
  );

  const handleCalculateMinCidr = useCallback(() => {
    const trimmedIp1 = ip1.trim();
    const trimmedIp2 = ip2.trim();

    if (!trimmedIp1 || !trimmedIp2) {
      setMinCidrResult(null);
      setMinCidrError(t('modules.ipNetwork.cidr.errorBothIpsRequired'));
      return;
    }

    try {
      setMinCidrResult(calculateMinimumCidr(trimmedIp1, trimmedIp2));
      setMinCidrError(null);
    } catch (err) {
      setMinCidrResult(null);
      setMinCidrError(err instanceof Error ? err.message : t('modules.ipNetwork.cidr.errorUnknown'));
    }
  }, [ip1, ip2, t]);

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
      <Card size="small" title={t('modules.ipNetwork.cidr.inputTitle')}>
        <Input
          value={cidrInput}
          onChange={handleCidrChange}
          placeholder={t('modules.ipNetwork.cidr.placeholder')}
          allowClear
          style={{ fontFamily: 'monospace' }}
        />
      </Card>

      {error && (
        <Alert
          type="error"
          showIcon
          title={t('modules.ipNetwork.cidr.errorTitle')}
          description={error}
        />
      )}

      {result && (
        <Card size="small" title={t('modules.ipNetwork.cidr.resultTitle')}>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label={t('modules.ipNetwork.cidr.networkAddress')}>
              <code>{result.networkAddress}</code>
            </Descriptions.Item>
            <Descriptions.Item label={t('modules.ipNetwork.cidr.broadcastAddress')}>
              <code>{result.broadcastAddress}</code>
            </Descriptions.Item>
            <Descriptions.Item label={t('modules.ipNetwork.cidr.subnetMask')}>
              <code>{result.subnetMask}</code>
            </Descriptions.Item>
            <Descriptions.Item label={t('modules.ipNetwork.cidr.subnetMaskBinary')}>
              <code>{result.subnetMaskBinary}</code>
            </Descriptions.Item>
            <Descriptions.Item label={t('modules.ipNetwork.cidr.wildcardMask')}>
              <code>{result.wildcardMask}</code>
            </Descriptions.Item>
            <Descriptions.Item label={t('modules.ipNetwork.cidr.firstHost')}>
              <code>{result.firstHost}</code>
            </Descriptions.Item>
            <Descriptions.Item label={t('modules.ipNetwork.cidr.lastHost')}>
              <code>{result.lastHost}</code>
            </Descriptions.Item>
            <Descriptions.Item label={t('modules.ipNetwork.cidr.totalHosts')}>
              <code>{result.totalHosts.toLocaleString()}</code>
            </Descriptions.Item>
            <Descriptions.Item label={t('modules.ipNetwork.cidr.usableHosts')}>
              <code>{result.usableHosts.toLocaleString()}</code>
            </Descriptions.Item>
            <Descriptions.Item label={t('modules.ipNetwork.cidr.prefixLength')}>
              <code>/{result.prefixLength}</code>
            </Descriptions.Item>
          </Descriptions>
        </Card>
      )}

      <Divider />

      <Card size="small" title={t('modules.ipNetwork.cidr.minCidrTitle')}>
        <Space orientation="vertical" style={{ width: '100%' }} size="small">
          <Input
            value={ip1}
            onChange={(e) => setIp1(e.target.value)}
            placeholder={t('modules.ipNetwork.cidr.ip1Placeholder')}
            allowClear
            style={{ fontFamily: 'monospace' }}
          />
          <Input
            value={ip2}
            onChange={(e) => setIp2(e.target.value)}
            placeholder={t('modules.ipNetwork.cidr.ip2Placeholder')}
            allowClear
            style={{ fontFamily: 'monospace' }}
          />
          <Button type="primary" onClick={handleCalculateMinCidr}>
            {t('modules.ipNetwork.cidr.calculateMinCidr')}
          </Button>
        </Space>

        {minCidrError && (
          <Alert
            type="error"
            showIcon
            title={minCidrError}
            style={{ marginTop: 12 }}
          />
        )}

        {minCidrResult && (
          <Alert
            type="success"
            showIcon
            title={t('modules.ipNetwork.cidr.minCidrResult')}
            description={<code>{minCidrResult}</code>}
            style={{ marginTop: 12 }}
          />
        )}
      </Card>
    </Space>
  );
};

export default CidrCalculatorTab;
