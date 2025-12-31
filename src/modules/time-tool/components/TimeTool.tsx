import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  SmartParseTab,
  CodeGenTab,
  CalcTab,
  BatchTab,
  TimezoneTab,
  UUIDTab,
} from './tabs';

const TimeTool: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('smart');

  const tabItems = [
    { key: 'smart', label: t('modules.time.tabs.smart') },
    { key: 'code', label: t('modules.time.tabs.code') },
    { key: 'calc', label: t('modules.time.tabs.calc') },
    { key: 'batch', label: t('modules.time.tabs.batch') },
    { key: 'timezone', label: t('modules.time.tabs.timezone') },
    { key: 'uuid', label: t('modules.time.tabs.uuid') },
  ];

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
    <Card title={t('modules.time.title')} variant="borderless">
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ marginBottom: 16 }} />
      {renderContent()}
    </Card>
  );
};

export default TimeTool;
