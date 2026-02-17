import React, { useState, useCallback } from 'react';
import { Input, Card, Radio, InputNumber, Button, Table, Alert, Space } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { isValidCidr } from '../../utils/validators';
import {
  divideBySubnetCount,
  divideByHostCount,
  getMaxSubnetCount,
  getMaxHostCount,
} from '../../utils/subnet-divider';
import type { SubnetDivisionResult, SubnetEntry } from '../../utils/types';

type DivideMode = 'byCount' | 'byHosts';

const SubnetDividerTab: React.FC = () => {
  const { t } = useTranslation();
  const [cidrInput, setCidrInput] = useState<string>('');
  const [divideMode, setDivideMode] = useState<DivideMode>('byCount');
  const [subnetCount, setSubnetCount] = useState<number>(2);
  const [hostsPerSubnet, setHostsPerSubnet] = useState<number>(2);
  const [result, setResult] = useState<SubnetDivisionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = useCallback(() => {
    setResult(null);
    setError(null);

    const trimmed = cidrInput.trim();
    if (!trimmed) {
      setError(t('modules.ipNetwork.subnet.errorEmptyInput'));
      return;
    }

    if (!isValidCidr(trimmed)) {
      setError(t('modules.ipNetwork.subnet.errorInvalidCidr'));
      return;
    }

    try {
      if (divideMode === 'byCount') {
        const max = getMaxSubnetCount(trimmed);
        if (subnetCount > max) {
          setError(t('modules.ipNetwork.subnet.errorMaxSubnets', { max }));
          return;
        }
        setResult(divideBySubnetCount(trimmed, subnetCount));
      } else {
        const max = getMaxHostCount(trimmed);
        if (hostsPerSubnet > max) {
          setError(t('modules.ipNetwork.subnet.errorMaxHosts', { max }));
          return;
        }
        setResult(divideByHostCount(trimmed, hostsPerSubnet));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('modules.ipNetwork.subnet.errorUnknown'));
    }
  }, [cidrInput, divideMode, subnetCount, hostsPerSubnet, t]);

  const columns: ColumnsType<SubnetEntry> = [
    {
      title: t('modules.ipNetwork.subnet.colIndex'),
      dataIndex: 'index',
      key: 'index',
      width: 70,
    },
    {
      title: t('modules.ipNetwork.subnet.colCidr'),
      dataIndex: 'cidr',
      key: 'cidr',
      render: (text: string) => <code>{text}</code>,
    },
    {
      title: t('modules.ipNetwork.subnet.colFirstHost'),
      dataIndex: 'firstHost',
      key: 'firstHost',
      render: (text: string) => <code>{text}</code>,
    },
    {
      title: t('modules.ipNetwork.subnet.colLastHost'),
      dataIndex: 'lastHost',
      key: 'lastHost',
      render: (text: string) => <code>{text}</code>,
    },
    {
      title: t('modules.ipNetwork.subnet.colUsableHosts'),
      dataIndex: 'usableHosts',
      key: 'usableHosts',
      render: (val: number) => <code>{val.toLocaleString()}</code>,
    },
    {
      title: t('modules.ipNetwork.subnet.colBroadcast'),
      dataIndex: 'broadcastAddress',
      key: 'broadcastAddress',
      render: (text: string) => <code>{text}</code>,
    },
  ];

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
      <Card size="small" title={t('modules.ipNetwork.subnet.inputTitle')}>
        <Space orientation="vertical" style={{ width: '100%' }} size="small">
          <Input
            value={cidrInput}
            onChange={(e) => setCidrInput(e.target.value)}
            placeholder={t('modules.ipNetwork.subnet.cidrPlaceholder')}
            allowClear
            style={{ fontFamily: 'monospace' }}
          />

          <Radio.Group
            value={divideMode}
            onChange={(e) => setDivideMode(e.target.value)}
          >
            <Radio value="byCount">{t('modules.ipNetwork.subnet.modeByCount')}</Radio>
            <Radio value="byHosts">{t('modules.ipNetwork.subnet.modeByHosts')}</Radio>
          </Radio.Group>

          {divideMode === 'byCount' ? (
            <InputNumber
              min={1}
              value={subnetCount}
              onChange={(val) => setSubnetCount(val ?? 2)}
              style={{ width: '100%' }}
              placeholder={t('modules.ipNetwork.subnet.countPlaceholder')}
            />
          ) : (
            <InputNumber
              min={1}
              value={hostsPerSubnet}
              onChange={(val) => setHostsPerSubnet(val ?? 2)}
              style={{ width: '100%' }}
              placeholder={t('modules.ipNetwork.subnet.hostsPlaceholder')}
            />
          )}

          <Button type="primary" onClick={handleCalculate}>
            {t('modules.ipNetwork.subnet.calculate')}
          </Button>
        </Space>
      </Card>

      {error && (
        <Alert
          type="error"
          showIcon
          title={t('modules.ipNetwork.subnet.errorTitle')}
          description={error}
        />
      )}

      {result && (
        <Card
          size="small"
          title={t('modules.ipNetwork.subnet.resultTitle', {
            count: result.subnets.length,
            prefix: result.newPrefixLength,
          })}
        >
          <Table<SubnetEntry>
            columns={columns}
            dataSource={result.subnets}
            rowKey="index"
            size="small"
            pagination={result.subnets.length > 20 ? { pageSize: 20 } : false}
            scroll={{ x: 'max-content' }}
          />
        </Card>
      )}
    </Space>
  );
};

export default SubnetDividerTab;
