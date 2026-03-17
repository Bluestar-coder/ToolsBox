import React, { Suspense, lazy } from 'react';
import ModulePageShell from '../components/ModulePageShell';

const LazyHttpDebugTool = lazy(() => import('../modules/http-debug/components/HttpDebugTool'));

/**
 * HTTP 调试工具页面组件
 */
const HttpDebugPage: React.FC = () => {
  return (
    <ModulePageShell moduleId="http-debug">
      <Suspense fallback={null}>
        <LazyHttpDebugTool />
      </Suspense>
    </ModulePageShell>
  );
};

export default HttpDebugPage;
