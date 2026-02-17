import React from 'react';
import { Tag, Tabs, Spin, Alert, Empty, Typography } from 'antd';
import {
  ClockCircleOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { HttpResponse } from '../../utils/types';

const { Text } = Typography;

interface ResponseViewerProps {
  response: HttpResponse | null;
  loading: boolean;
  error: string | null;
}

function getStatusColor(status: number): string {
  if (status >= 200 && status < 300) return 'green';
  if (status >= 300 && status < 400) return 'orange';
  return 'red';
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

function formatBody(body: string, contentType: string): string {
  if (contentType.includes('json')) {
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }
  return body;
}

const ResponseViewer: React.FC<ResponseViewerProps> = ({
  response,
  loading,
  error,
}) => {
  const { t } = useTranslation();

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: 40 }}>
        <Spin tip={t('modules.httpDebug.sending', '请求发送中...')} />
      </div>
    );
  }

  if (error && !response) {
    return <Alert type="error" showIcon message={t('modules.httpDebug.requestError', '请求错误')} description={error} />;
  }

  if (!response) {
    return <Empty description={t('modules.httpDebug.noResponse', '发送请求以查看响应')} />;
  }

  const headersData = Object.entries(response.headers).map(([key, value]) => ({
    key,
    name: key,
    value,
  }));

  const tabItems = [
    {
      key: 'body',
      label: t('modules.httpDebug.responseBody', 'Body'),
      children: (
        <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 13, maxHeight: 500, overflow: 'auto' }}>
          <code>{formatBody(response.body, response.contentType)}</code>
        </pre>
      ),
    },
    {
      key: 'headers',
      label: t('modules.httpDebug.responseHeaders', 'Headers'),
      children: (
        <div>
          {headersData.map((h) => (
            <div key={h.name} style={{ display: 'flex', gap: 8, padding: '4px 0', borderBottom: '1px solid var(--ant-color-border-secondary, #f0f0f0)' }}>
              <Text strong style={{ minWidth: 180 }}>{h.name}</Text>
              <Text copyable style={{ wordBreak: 'break-all' }}>{h.value}</Text>
            </div>
          ))}
          {headersData.length === 0 && (
            <Empty description={t('modules.httpDebug.noHeaders', '无响应头')} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <Tag color={getStatusColor(response.status)}>
          {response.status} {response.statusText}
        </Tag>
        <Tag icon={<ClockCircleOutlined />}>{response.duration} ms</Tag>
        <Tag icon={<DatabaseOutlined />}>{formatSize(response.size)}</Tag>
      </div>
      {error && (
        <Alert type="warning" showIcon message={error} style={{ marginBottom: 12 }} />
      )}
      <Tabs items={tabItems} size="small" />
    </div>
  );
};

export default ResponseViewer;
