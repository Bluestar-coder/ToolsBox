import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import HttpTab from './tabs/HttpTab';
import WebSocketTab from './tabs/WebSocketTab';

const HttpDebugTool: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('http');

  const tabItems = [
    {
      key: 'http',
      label: t('modules.httpDebug.tabs.http', 'HTTP'),
      children: <HttpTab />,
    },
    {
      key: 'websocket',
      label: t('modules.httpDebug.tabs.websocket', 'WebSocket'),
      children: <WebSocketTab />,
    },
  ];

  return (
    <Card title={t('modules.httpDebug.title', '网络调试')} variant="borderless">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </Card>
  );
};

export default HttpDebugTool;
