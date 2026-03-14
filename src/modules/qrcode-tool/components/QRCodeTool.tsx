import React, { Suspense, lazy, useState } from 'react';
import { Card, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import type { TabsProps } from 'antd';

const GenerateTab = lazy(() => import('./tabs/GenerateTab'));
const ScanTab = lazy(() => import('./tabs/ScanTab'));

export type QRCodeToolTabKey = 'generate' | 'scan';

interface QRCodeToolProps {
  initialTab?: QRCodeToolTabKey;
}

const QRCodeTool: React.FC<QRCodeToolProps> = ({ initialTab = 'generate' }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<QRCodeToolTabKey>(initialTab);

  const tabItems: TabsProps['items'] = [
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
      <Suspense fallback={null}>
        <Tabs
          activeKey={activeTab}
          onChange={(value) => setActiveTab(value as QRCodeToolTabKey)}
          items={tabItems}
          style={{ marginBottom: 8 }}
        />
        {renderContent()}
      </Suspense>
    </Card>
  );
};

export default QRCodeTool;
