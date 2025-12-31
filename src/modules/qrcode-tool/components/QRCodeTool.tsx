import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { GenerateTab, ScanTab } from './tabs';

const QRCodeTool: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('generate');

  const tabItems = [
    { key: 'generate', label: t('modules.qrcode.tabs.generate') },
    { key: 'scan', label: t('modules.qrcode.tabs.scan') },
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'generate':
        return <GenerateTab />;
      case 'scan':
        return <ScanTab />;
      default:
        return <GenerateTab />;
    }
  };

  return (
    <Card title={t('modules.qrcode.title')} variant="borderless">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginBottom: 8 }}
      />
      {renderContent()}
    </Card>
  );
};

export default QRCodeTool;
