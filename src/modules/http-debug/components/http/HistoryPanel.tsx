import React from 'react';
import { Button, List, Tag, Empty, Popconfirm, Typography } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { HistoryEntry } from '../../utils/types';

const { Text } = Typography;

interface HistoryPanelProps {
  history: HistoryEntry[];
  onSelect: (entry: HistoryEntry) => void;
  onClear: () => void;
}

const METHOD_COLORS: Record<string, string> = {
  GET: 'green',
  POST: 'blue',
  PUT: 'orange',
  DELETE: 'red',
  PATCH: 'purple',
  HEAD: 'cyan',
  OPTIONS: 'default',
};

function formatTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 60) return `${seconds}s ago`;
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleString();
}

function truncateUrl(url: string, maxLen = 60): string {
  return url.length > maxLen ? url.slice(0, maxLen) + '…' : url;
}

const HistoryPanel: React.FC<HistoryPanelProps> = ({ history, onSelect, onClear }) => {
  const { t } = useTranslation();

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong>{t('modules.httpDebug.history', '历史记录')}</Text>
        <Popconfirm
          title={t('modules.httpDebug.clearHistoryConfirm', '确定清空所有历史记录？')}
          onConfirm={onClear}
          okText={t('modules.httpDebug.confirm', '确定')}
          cancelText={t('modules.httpDebug.cancel', '取消')}
        >
          <Button type="text" danger icon={<DeleteOutlined />} size="small" disabled={history.length === 0}>
            {t('modules.httpDebug.clearAll', '清空')}
          </Button>
        </Popconfirm>
      </div>
      {history.length === 0 ? (
        <Empty description={t('modules.httpDebug.noHistory', '暂无历史记录')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          size="small"
          dataSource={history}
          renderItem={(entry) => (
            <List.Item
              key={entry.id}
              onClick={() => onSelect(entry)}
              style={{ cursor: 'pointer', padding: '6px 8px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, width: '100%', minWidth: 0 }}>
                <Tag color={METHOD_COLORS[entry.request.method] || 'default'} style={{ flexShrink: 0 }}>
                  {entry.request.method}
                </Tag>
                <Text ellipsis style={{ flex: 1, minWidth: 0 }} title={entry.request.url}>
                  {truncateUrl(entry.request.url)}
                </Text>
                <Text type="secondary" style={{ flexShrink: 0, fontSize: 12 }}>
                  {formatTime(entry.timestamp)}
                </Text>
              </div>
            </List.Item>
          )}
        />
      )}
    </div>
  );
};

export default HistoryPanel;
