import React from 'react';
import DiffTool from '../modules/diff-tool/components/DiffTool';
import ModulePageShell from '../components/ModulePageShell';

/**
 * 差异对比工具页面组件
 */
const DiffPage: React.FC = () => {
  return (
    <ModulePageShell moduleId="diff-tool">
      <DiffTool />
    </ModulePageShell>
  );
};

export default DiffPage;
