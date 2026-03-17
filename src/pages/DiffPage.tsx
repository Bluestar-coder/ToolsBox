import React, { Suspense, lazy } from 'react';
import ModulePageShell from '../components/ModulePageShell';

const LazyDiffTool = lazy(() => import('../modules/diff-tool/components/DiffTool'));

/**
 * 差异对比工具页面组件
 */
const DiffPage: React.FC = () => {
  return (
    <ModulePageShell moduleId="diff-tool">
      <Suspense fallback={null}>
        <LazyDiffTool />
      </Suspense>
    </ModulePageShell>
  );
};

export default DiffPage;
