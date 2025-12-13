import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { JsonTab, SqlTab, HttpTab, GeneralTab } from './tabs';

const CodeFormatter: React.FC = () => {
  const [activeTab, setActiveTab] = useState('json');

  const tabItems = [
    {
      key: 'json',
      label: 'JSON',
      children: <JsonTab />,
    },
    {
      key: 'sql',
      label: 'SQL',
      children: <SqlTab />,
    },
    {
      key: 'http',
      label: 'HTTP',
      children: <HttpTab />,
    },
    {
      key: 'general',
      label: '其他语言',
      children: <GeneralTab />,
    },
  ];

  return (
    <Card title="代码格式化/美化" variant="borderless">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </Card>
  );
};

export default CodeFormatter;
