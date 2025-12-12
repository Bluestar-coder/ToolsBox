import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { tabItems } from '../utils/constants';
import {
  SmartParseTab,
  CodeGenTab,
  CalcTab,
  BatchTab,
  TimezoneTab,
  UUIDTab,
} from './tabs';

const TimeTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState('smart');

  const renderContent = () => {
    switch (activeTab) {
      case 'smart':
        return <SmartParseTab />;
      case 'code':
        return <CodeGenTab />;
      case 'calc':
        return <CalcTab />;
      case 'batch':
        return <BatchTab />;
      case 'timezone':
        return <TimezoneTab />;
      case 'uuid':
        return <UUIDTab />;
      default:
        return <SmartParseTab />;
    }
  };

  return (
    <Card title="时间处理工具" bordered={false}>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ marginBottom: 16 }} />
      {renderContent()}
    </Card>
  );
};

export default TimeTool;
