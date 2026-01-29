import React from 'react';

/**
 * 模块加载器组件
 * 负责 Suspense 包裹懒加载组件
 */
const ModuleLoader: React.FC<{ Component: React.ComponentType }> = ({ Component }) => {
  return (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component />
    </React.Suspense>
  );
};

export default ModuleLoader;
