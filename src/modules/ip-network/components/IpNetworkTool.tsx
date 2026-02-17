import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import IpConverterTab from './tabs/IpConverterTab';
import CidrCalculatorTab from './tabs/CidrCalculatorTab';
import SubnetDividerTab from './tabs/SubnetDividerTab';
import GeolocationTab from './tabs/GeolocationTab';
import PortReferenceTab from './tabs/PortReferenceTab';

const IpNetworkTool: React.FC = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('converter');

  const tabItems = [
    {
      key: 'converter',
      label: t('modules.ipNetwork.tabs.converter'),
      children: <IpConverterTab />,
    },
    {
      key: 'cidr',
      label: t('modules.ipNetwork.tabs.cidr'),
      children: <CidrCalculatorTab />,
    },
    {
      key: 'subnet',
      label: t('modules.ipNetwork.tabs.subnet'),
      children: <SubnetDividerTab />,
    },
    {
      key: 'geolocation',
      label: t('modules.ipNetwork.tabs.geolocation'),
      children: <GeolocationTab />,
    },
    {
      key: 'port',
      label: t('modules.ipNetwork.tabs.port'),
      children: <PortReferenceTab />,
    },
  ];

  return (
    <Card title={t('modules.ipNetwork.title')} variant="borderless">
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
      />
    </Card>
  );
};

export default IpNetworkTool;
