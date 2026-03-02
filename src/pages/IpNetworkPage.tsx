import React from 'react';
import IpNetworkTool from '../modules/ip-network/components/IpNetworkTool';
import ModulePageShell from '../components/ModulePageShell';

/**
 * IP/网络工具页面组件
 */
const IpNetworkPage: React.FC = () => {
  return (
    <ModulePageShell moduleId="ip-network">
      <IpNetworkTool />
    </ModulePageShell>
  );
};

export default IpNetworkPage;
