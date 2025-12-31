import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { JsonTab, SqlTab, HttpTab, GeneralTab } from './tabs';

const CodeFormatter: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('json');

  const tabItems = [
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
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </Card>
  );
};

export default CodeFormatter;
