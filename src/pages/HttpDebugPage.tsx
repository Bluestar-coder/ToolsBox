import React from 'react';
import HttpDebugTool from '../modules/http-debug/components/HttpDebugTool';
import ModulePageShell from '../components/ModulePageShell';

/**
 * HTTP 调试工具页面组件
 */
const HttpDebugPage: React.FC = () => {
  return (
    <ModulePageShell moduleId="http-debug">
      <HttpDebugTool />
    </ModulePageShell>
  );
};

export default HttpDebugPage;
