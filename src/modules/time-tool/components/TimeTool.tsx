import React, { Suspense, lazy, useState } from 'react';
import { Card, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';

const SmartParseTab = lazy(() => import('./tabs/SmartParseTab'));
const CodeGenTab = lazy(() => import('./tabs/CodeGenTab'));
const CalcTab = lazy(() => import('./tabs/CalcTab'));
const BatchTab = lazy(() => import('./tabs/BatchTab'));
const TimezoneTab = lazy(() => import('./tabs/TimezoneTab'));
const UUIDTab = lazy(() => import('./tabs/UUIDTab'));

export type TimeToolTabKey = 'smart' | 'code' | 'calc' | 'batch' | 'timezone' | 'uuid';

interface TimeToolProps {
  initialTab?: TimeToolTabKey;
}

const TimeTool: React.FC<TimeToolProps> = ({ initialTab = 'smart' }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<TimeToolTabKey>(initialTab);

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
      <Tabs
        activeKey={activeTab}
        onChange={(value) => setActiveTab(value as TimeToolTabKey)}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />
      <Suspense fallback={null}>
        {renderContent()}
      </Suspense>
    </Card>
  );
};

export default TimeTool;
