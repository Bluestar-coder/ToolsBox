import React, { useState, useCallback, useMemo } from 'react';
import { Input, Select, Button, Table, Space, Tag, InputNumber } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';
import {
  searchByPort,
  searchByService,
  filterByPortRange,
  getHighFrequencyPorts,
} from '../../utils/port-database';
import type { PortEntry } from '../../utils/types';

type SearchMode = 'port' | 'service' | 'range';

const PortReferenceTab: React.FC = () => {
  const { t } = useTranslation();
  const [searchMode, setSearchMode] = useState<SearchMode>('port');
  const [searchInput, setSearchInput] = useState<string>('');
  const [rangeStart, setRangeStart] = useState<number>(1);
  const [rangeEnd, setRangeEnd] = useState<number>(1024);
  const [results, setResults] = useState<PortEntry[]>([]);

  const handleSearch = useCallback(() => {
    let searchResults: PortEntry[] = [];

    if (searchMode === 'port') {
      const portNum = parseInt(searchInput, 10);
      if (!isNaN(portNum) && portNum >= 0 && portNum <= 65535) {
        searchResults = searchByPort(portNum);
      }
    } else if (searchMode === 'service') {
      if (searchInput.trim()) {
        searchResults = searchByService(searchInput.trim());
      }
    } else if (searchMode === 'range') {
      if (rangeStart >= 0 && rangeEnd <= 65535 && rangeStart <= rangeEnd) {
        searchResults = filterByPortRange(rangeStart, rangeEnd);
      }
    }

    setResults(searchResults);
  }, [searchMode, searchInput, rangeStart, rangeEnd]);

  const handleShowHighFrequency = useCallback(() => {
    setResults(getHighFrequencyPorts());
  }, []);

  const highFrequencyPorts = useMemo(() => {
    const ports = getHighFrequencyPorts();
    return new Set(ports.map((p) => p.port));
  }, []);

  const getRiskLevelColor = (level: PortEntry['riskLevel']): string => {
    switch (level) {
      case 'high':
        return 'red';
      case 'medium':
        return 'orange';
      case 'low':
        return 'blue';
      case 'info':
        return 'default';
      default:
        return 'default';
    }
  };

  const getRiskLevelText = (level: PortEntry['riskLevel']): string => {
    return t(`modules.ipNetwork.portReference.riskLevel.${level}`);
  };

  const columns: ColumnsType<PortEntry> = [
    {
      title: t('modules.ipNetwork.portReference.colPort'),
      dataIndex: 'port',
      key: 'port',
      width: 100,
      render: (port: number) => {
        const isHighFreq = highFrequencyPorts.has(port);
        return (
          <code style={{ fontWeight: isHighFreq ? 'bold' : 'normal', color: isHighFreq ? '#ff4d4f' : 'inherit' }}>
            {port}
          </code>
        );
      },
      sorter: (a, b) => a.port - b.port,
    },
    {
      title: t('modules.ipNetwork.portReference.colProtocol'),
      dataIndex: 'protocol',
      key: 'protocol',
      width: 100,
      filters: [
        { text: 'TCP', value: 'TCP' },
        { text: 'UDP', value: 'UDP' },
        { text: 'TCP/UDP', value: 'TCP/UDP' },
      ],
      onFilter: (value, record) => record.protocol === value,
    },
    {
      title: t('modules.ipNetwork.portReference.colService'),
      dataIndex: 'service',
      key: 'service',
      width: 150,
      render: (service: string) => <strong>{service}</strong>,
    },
    {
      title: t('modules.ipNetwork.portReference.colDescription'),
      dataIndex: 'description',
      key: 'description',
    },
    {
      title: t('modules.ipNetwork.portReference.colRiskLevel'),
      dataIndex: 'riskLevel',
      key: 'riskLevel',
      width: 120,
      render: (level: PortEntry['riskLevel']) => (
        <Tag color={getRiskLevelColor(level)}>{getRiskLevelText(level)}</Tag>
      ),
      filters: [
        { text: t('modules.ipNetwork.portReference.riskLevel.high'), value: 'high' },
        { text: t('modules.ipNetwork.portReference.riskLevel.medium'), value: 'medium' },
        { text: t('modules.ipNetwork.portReference.riskLevel.low'), value: 'low' },
        { text: t('modules.ipNetwork.portReference.riskLevel.info'), value: 'info' },
      ],
      onFilter: (value, record) => record.riskLevel === value,
    },
  ];

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        <Space wrap>
          <Select
            value={searchMode}
            onChange={setSearchMode}
            style={{ width: 150 }}
            options={[
              { label: t('modules.ipNetwork.portReference.modePort'), value: 'port' },
              { label: t('modules.ipNetwork.portReference.modeService'), value: 'service' },
              { label: t('modules.ipNetwork.portReference.modeRange'), value: 'range' },
            ]}
          />

          {searchMode === 'port' && (
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('modules.ipNetwork.portReference.placeholderPort')}
              style={{ width: 200 }}
              onPressEnter={handleSearch}
            />
          )}

          {searchMode === 'service' && (
            <Input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder={t('modules.ipNetwork.portReference.placeholderService')}
              style={{ width: 200 }}
              onPressEnter={handleSearch}
            />
          )}

          {searchMode === 'range' && (
            <>
              <InputNumber
                value={rangeStart}
                onChange={(val) => setRangeStart(val ?? 1)}
                min={0}
                max={65535}
                style={{ width: 100 }}
                placeholder={t('modules.ipNetwork.portReference.rangeStart')}
              />
              <span>-</span>
              <InputNumber
                value={rangeEnd}
                onChange={(val) => setRangeEnd(val ?? 1024)}
                min={0}
                max={65535}
                style={{ width: 100 }}
                placeholder={t('modules.ipNetwork.portReference.rangeEnd')}
              />
            </>
          )}

          <Button type="primary" onClick={handleSearch}>
            {t('common.search')}
          </Button>
          <Button onClick={handleShowHighFrequency}>
            {t('modules.ipNetwork.portReference.showHighFrequency')}
          </Button>
        </Space>
      </Space>

      {results.length > 0 && (
        <Table<PortEntry>
          columns={columns}
          dataSource={results}
          rowKey={(record) => `${record.port}-${record.protocol}`}
          size="small"
          pagination={results.length > 50 ? { pageSize: 50, showSizeChanger: true } : false}
          scroll={{ x: 'max-content' }}
        />
      )}

      {results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '20px', color: '#999' }}>
          {t('modules.ipNetwork.portReference.noResults')}
        </div>
      )}
    </Space>
  );
};

export default PortReferenceTab;
