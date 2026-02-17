import React, { useState, useCallback } from 'react';
import { Input, Button, Table, Alert, Space, Spin } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import { queryGeolocation, batchQueryGeolocation, queryMyIp } from '../../utils/geolocation-api';
import type { GeolocationInfo } from '../../utils/types';

const BATCH_MAX = 20;

const GeolocationTab: React.FC = () => {
  const { t } = useTranslation();
  const [ipInput, setIpInput] = useState<string>('');
  const [results, setResults] = useState<GeolocationInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleQuery = useCallback(async () => {
    const trimmed = ipInput.trim();
    if (!trimmed) {
      setError(t('modules.ipNetwork.geolocation.errorEmptyInput'));
      return;
    }

    const ips = trimmed
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0);

    if (ips.length === 0) {
      setError(t('modules.ipNetwork.geolocation.errorEmptyInput'));
      return;
    }

    if (ips.length > BATCH_MAX) {
      setError(t('modules.ipNetwork.geolocation.errorTooMany', { max: BATCH_MAX }));
      return;
    }

    setError(null);
    setLoading(true);
    try {
      let data: GeolocationInfo[];
      if (ips.length === 1) {
        data = [await queryGeolocation(ips[0])];
      } else {
        data = await batchQueryGeolocation(ips);
      }
      setResults(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('modules.ipNetwork.geolocation.errorUnknown'));
    } finally {
      setLoading(false);
    }
  }, [ipInput, t]);

  const handleQueryMyIp = useCallback(async () => {
    setError(null);
    setLoading(true);
    try {
      const data = await queryMyIp();
      setIpInput(data.ip);
      setResults([data]);
    } catch (err) {
      setError(err instanceof Error ? err.message : t('modules.ipNetwork.geolocation.errorUnknown'));
    } finally {
      setLoading(false);
    }
  }, [t]);

  const columns: ColumnsType<GeolocationInfo> = [
    {
      title: t('modules.ipNetwork.geolocation.colIp'),
      dataIndex: 'ip',
      key: 'ip',
      render: (text: string) => <code>{text}</code>,
    },
    {
      title: t('modules.ipNetwork.geolocation.colCountry'),
      dataIndex: 'country',
      key: 'country',
    },
    {
      title: t('modules.ipNetwork.geolocation.colRegion'),
      dataIndex: 'region',
      key: 'region',
    },
    {
      title: t('modules.ipNetwork.geolocation.colCity'),
      dataIndex: 'city',
      key: 'city',
    },
    {
      title: t('modules.ipNetwork.geolocation.colIsp'),
      dataIndex: 'isp',
      key: 'isp',
    },
    {
      title: t('modules.ipNetwork.geolocation.colAs'),
      dataIndex: 'asNumber',
      key: 'asNumber',
    },
    {
      title: t('modules.ipNetwork.geolocation.colStatus'),
      dataIndex: 'status',
      key: 'status',
      render: (_: string, record: GeolocationInfo) =>
        record.status === 'fail' ? (
          <Alert type="warning" showIcon title={record.message ?? t('modules.ipNetwork.geolocation.queryFailed')} />
        ) : (
          t('modules.ipNetwork.geolocation.statusSuccess')
        ),
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <Input.TextArea
          value={ipInput}
          onChange={(e) => setIpInput(e.target.value)}
          placeholder={t('modules.ipNetwork.geolocation.placeholder')}
          rows={4}
          style={{ fontFamily: 'monospace' }}
        />
        <Space>
          <Button type="primary" onClick={handleQuery} loading={loading}>
            {t('modules.ipNetwork.geolocation.query')}
          </Button>
          <Button onClick={handleQueryMyIp} loading={loading}>
            {t('modules.ipNetwork.geolocation.queryMyIp')}
          </Button>
        </Space>
      </Space>

      {error && (
        <Alert
          type="error"
          showIcon
          title={t('modules.ipNetwork.geolocation.errorTitle')}
          description={error}
        />
      )}

      {loading && <Spin />}

      {results.length > 0 && !loading && (
        <Table<GeolocationInfo>
          columns={columns}
          dataSource={results}
          rowKey="ip"
          size="small"
          pagination={results.length > 20 ? { pageSize: 20 } : false}
          scroll={{ x: 'max-content' }}
        />
      )}
    </Space>
  );
};

export default GeolocationTab;
