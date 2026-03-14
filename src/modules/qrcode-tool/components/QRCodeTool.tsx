import React, { Suspense, useState } from 'react';
import { Card, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import type { TabsProps } from 'antd';

export type QRCodeToolTabKey = 'generate' | 'scan';

interface QRCodeToolProps {
  initialTab?: QRCodeToolTabKey;
}

type QRCodeTabComponent = React.ComponentType<Record<string, never>>;

const qrTabComponents: Record<QRCodeToolTabKey, QRCodeTabComponent> = {
  generate: React.lazy(() => import('./tabs/GenerateTab')),
  scan: React.lazy(() => import('./tabs/ScanTab')),
};

const QRCodeTool: React.FC<QRCodeToolProps> = ({ initialTab = 'generate' }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<QRCodeToolTabKey>(initialTab);

  const tabItems: TabsProps['items'] = [
    { key: 'generate', label: t('modules.qrcode.tabs.generate') },
    { key: 'scan', label: t('modules.qrcode.tabs.scan') },
  ];

  const ActiveTabComponent = qrTabComponents[activeTab];

  return (
    <Card title={t('modules.qrcode.title')} variant="borderless">
      <Tabs
        activeKey={activeTab}
        onChange={(value) => setActiveTab(value as QRCodeToolTabKey)}
        items={tabItems}
        style={{ marginBottom: 8 }}
      />
      <Suspense fallback={null}>
        <ActiveTabComponent />
      </Suspense>
    </Card>
  );
};

export default QRCodeTool;
