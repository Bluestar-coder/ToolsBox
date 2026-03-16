import React, { Suspense, lazy, useState } from 'react';
import { Card, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';

const HttpTab = lazy(() => import('./tabs/HttpTab'));
const WebSocketTab = lazy(() => import('./tabs/WebSocketTab'));

const HttpDebugTool: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('http');

  const tabItems = [
    {
      key: 'http',
      label: t('modules.httpDebug.tabs.http', 'HTTP'),
    },
    {
      key: 'websocket',
      label: t('modules.httpDebug.tabs.websocket', 'WebSocket'),
    },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'websocket':
        return <WebSocketTab />;
      case 'http':
      default:
        return <HttpTab />;
    }
  };

  return (
    <Card title={t('modules.httpDebug.title', '网络调试')} variant="borderless">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
      <Suspense fallback={null}>
        {renderContent()}
      </Suspense>
    </Card>
  );
};

export default HttpDebugTool;
