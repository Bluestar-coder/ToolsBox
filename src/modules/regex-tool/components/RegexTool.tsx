import React, { Suspense, lazy, useState } from 'react';
import { Card, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';

const TestTab = lazy(() => import('./tabs/TestTab'));
const ReplaceTab = lazy(() => import('./tabs/ReplaceTab'));
const SplitTab = lazy(() => import('./tabs/SplitTab'));

export type RegexToolTabKey = 'test' | 'replace' | 'split';

interface RegexToolProps {
  initialTab?: RegexToolTabKey;
}

const RegexTool: React.FC<RegexToolProps> = ({ initialTab = 'test' }) => {
  const [activeTab, setActiveTab] = useState<RegexToolTabKey>(initialTab);
  const { t } = useTranslation();

  const tabItems = [
    { key: 'test', label: t('modules.regex.tabs.test') },
    { key: 'replace', label: t('modules.regex.tabs.replace') },
    { key: 'split', label: t('modules.regex.tabs.split') },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'replace':
        return <ReplaceTab />;
      case 'split':
        return <SplitTab />;
      case 'test':
      default:
        return <TestTab />;
    }
  };

  return (
    <Card title={t('modules.regex.title')} variant="borderless">
      <Tabs
        activeKey={activeTab}
        onChange={(value) => setActiveTab(value as RegexToolTabKey)}
        items={tabItems}
        style={{ marginBottom: 8 }}
      />
      <Suspense fallback={null}>
        {renderContent()}
      </Suspense>
    </Card>
  );
};

export default RegexTool;
