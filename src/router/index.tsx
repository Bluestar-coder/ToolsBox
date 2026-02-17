import React, { Suspense, memo } from 'react';
import { useRoutes } from 'react-router-dom';
import { Spin } from 'antd';
import routes from './routes';

interface AppRouterProps {
  /**
   * 基础路径，用于部署在子目录时
   * @default '/'
   */
  basename?: string;
}

// 加载中组件
const LoadingFallback: React.FC = memo(() => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100vh'
  }}>
    <Spin size="large" />
  </div>
));

LoadingFallback.displayName = 'LoadingFallback';

/**
 * 应用路由器组件
 * 使用react-router-dom的useRoutes钩子创建路由
 */
const AppRouter: React.FC<AppRouterProps> = memo(() => {
  const element = useRoutes(routes);

  return (
    <Suspense fallback={<LoadingFallback />}>
      {element}
    </Suspense>
  );
});

AppRouter.displayName = 'AppRouter';

export default AppRouter;
