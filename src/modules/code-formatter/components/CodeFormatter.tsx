import React, { Suspense, useState } from 'react';
import { Card, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import type { TabsProps } from 'antd';

export type CodeFormatterTabKey = 'json' | 'sql' | 'http' | 'general';

interface CodeFormatterProps {
  initialTab?: CodeFormatterTabKey;
}

type FormatterTabComponent = React.ComponentType<Record<string, never>>;

const tabComponents: Record<CodeFormatterTabKey, FormatterTabComponent> = {
  json: React.lazy(() => import('./tabs/JsonTab')),
  sql: React.lazy(() => import('./tabs/SqlTab')),
  http: React.lazy(() => import('./tabs/HttpTab')),
  general: React.lazy(() => import('./tabs/GeneralTab')),
};

const CodeFormatter: React.FC<CodeFormatterProps> = ({ initialTab = 'json' }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CodeFormatterTabKey>(initialTab);

  const tabItems: TabsProps['items'] = [
    { key: 'json', label: t('modules.formatter.tabs.json') },
    { key: 'sql', label: t('modules.formatter.tabs.sql') },
    { key: 'http', label: t('modules.formatter.tabs.http') },
    { key: 'general', label: t('modules.formatter.tabs.general') },
  ];

  const ActiveTabComponent = tabComponents[activeTab];

  return (
    <Card title={t('modules.formatter.title')} variant="borderless">
      <Tabs
        activeKey={activeTab}
        onChange={(value) => setActiveTab(value as CodeFormatterTabKey)}
        items={tabItems}
      />
      <Suspense fallback={null}>
        <ActiveTabComponent />
      </Suspense>
    </Card>
  );
};

export default CodeFormatter;
