import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { TestTab, ReplaceTab, SplitTab } from './tabs';

export type RegexToolTabKey = 'test' | 'replace' | 'split';

interface RegexToolProps {
  initialTab?: RegexToolTabKey;
}

const RegexTool: React.FC<RegexToolProps> = ({ initialTab = 'test' }) => {
  const [activeTab, setActiveTab] = useState<RegexToolTabKey>(initialTab);
  const { t } = useTranslation();

  const tabItems = [
    { key: 'test', label: t('modules.regex.tabs.test'), children: <TestTab /> },
    { key: 'replace', label: t('modules.regex.tabs.replace'), children: <ReplaceTab /> },
    { key: 'split', label: t('modules.regex.tabs.split'), children: <SplitTab /> },
  ];

  return (
    <Card title={t('modules.regex.title')} variant="borderless">
      <Tabs
        activeKey={activeTab}
        onChange={(value) => setActiveTab(value as RegexToolTabKey)}
        items={tabItems}
        style={{ marginBottom: 8 }}
      />
    </Card>
  );
};

export default RegexTool;
