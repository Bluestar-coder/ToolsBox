import React, { Suspense, lazy } from 'react';
import ModulePageShell from '../components/ModulePageShell';

const LazyIpNetworkTool = lazy(() => import('../modules/ip-network/components/IpNetworkTool'));

/**
 * IP/网络工具页面组件
 */
const IpNetworkPage: React.FC = () => {
  return (
    <ModulePageShell moduleId="ip-network">
      <Suspense fallback={null}>
        <LazyIpNetworkTool />
      </Suspense>
    </ModulePageShell>
  );
};

export default IpNetworkPage;
