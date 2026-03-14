import React, { Suspense, lazy, useState } from 'react';
import { Card, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import type { TabsProps } from 'antd';

const JsonTab = lazy(() => import('./tabs/JsonTab'));
const SqlTab = lazy(() => import('./tabs/SqlTab'));
const HttpTab = lazy(() => import('./tabs/HttpTab'));
const GeneralTab = lazy(() => import('./tabs/GeneralTab'));

export type CodeFormatterTabKey = 'json' | 'sql' | 'http' | 'general';

interface CodeFormatterProps {
  initialTab?: CodeFormatterTabKey;
}

const CodeFormatter: React.FC<CodeFormatterProps> = ({ initialTab = 'json' }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<CodeFormatterTabKey>(initialTab);

  const tabItems: TabsProps['items'] = [
    {
      key: 'json',
      label: t('modules.formatter.tabs.json'),
      children: <JsonTab />,
    },
    {
      key: 'sql',
      label: t('modules.formatter.tabs.sql'),
      children: <SqlTab />,
    },
    {
      key: 'http',
      label: t('modules.formatter.tabs.http'),
      children: <HttpTab />,
    },
    {
      key: 'general',
      label: t('modules.formatter.tabs.general'),
      children: <GeneralTab />,
    },
  ];

  return (
    <Card title={t('modules.formatter.title')} variant="borderless">
      <Suspense fallback={null}>
        <Tabs
          activeKey={activeTab}
          onChange={(value) => setActiveTab(value as CodeFormatterTabKey)}
          items={tabItems}
        />
      </Suspense>
    </Card>
  );
};

export default CodeFormatter;
