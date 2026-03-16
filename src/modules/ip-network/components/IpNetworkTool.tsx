import React, { Suspense, useState } from 'react';
import { Card, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';

export type IpNetworkTabKey =
  | 'converter'
  | 'cidr'
  | 'subnet'
  | 'subnetMask'
  | 'geolocation'
  | 'port';

const ipNetworkTabComponents: Record<IpNetworkTabKey, React.ComponentType<Record<string, never>>> = {
  converter: React.lazy(() => import('./tabs/IpConverterTab')),
  cidr: React.lazy(() => import('./tabs/CidrCalculatorTab')),
  subnet: React.lazy(() => import('./tabs/SubnetDividerTab')),
  subnetMask: React.lazy(() => import('./tabs/SubnetMaskConverterTab')),
  geolocation: React.lazy(() => import('./tabs/GeolocationTab')),
  port: React.lazy(() => import('./tabs/PortReferenceTab')),
};

const IpNetworkTool: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<IpNetworkTabKey>('converter');

  const tabItems = [
    {
      key: 'converter',
      label: t('modules.ipNetwork.tabs.converter'),
    },
    {
      key: 'cidr',
      label: t('modules.ipNetwork.tabs.cidr'),
    },
    {
      key: 'subnet',
      label: t('modules.ipNetwork.tabs.subnet'),
    },
    {
      key: 'subnetMask',
      label: t('modules.ipNetwork.tabs.subnetMask'),
    },
    {
      key: 'geolocation',
      label: t('modules.ipNetwork.tabs.geolocation'),
    },
    {
      key: 'port',
      label: t('modules.ipNetwork.tabs.port'),
    },
  ];

  const ActiveTabComponent = ipNetworkTabComponents[activeTab];

  return (
    <Card title={t('modules.ipNetwork.title')} variant="borderless">
      <Tabs
        activeKey={activeTab}
        onChange={(value) => setActiveTab(value as IpNetworkTabKey)}
        items={tabItems}
      />
      <Suspense fallback={null}>
        <ActiveTabComponent />
      </Suspense>
    </Card>
  );
};

export default IpNetworkTool;
