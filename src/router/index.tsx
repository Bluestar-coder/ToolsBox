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
    <Spin size="large" tip="加载中..." />
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

/**
 * 导出导航辅助函数
 */
export const createNavigation = {
  /**
   * 编码工具路径
   */
  encoder: (type?: string) => `/encoder${type ? `/${type}` : ''}`,

  /**
   * 加密工具路径
   */
  crypto: (type?: string) => `/crypto${type ? `/${type}` : ''}`,

  /**
   * 时间工具路径
   */
  time: (type?: string) => `/time${type ? `/${type}` : ''}`,

  /**
   * 代码格式化路径
   */
  formatter: (type?: string) => `/formatter${type ? `/${type}` : ''}`,

  /**
   * 正则工具路径
   */
  regex: (type?: string) => `/regex${type ? `/${type}` : ''}`,

  /**
   * 二维码工具路径
   */
  qrcode: (type?: string) => `/qrcode${type ? `/${type}` : ''}`,
};

/**
 * 模块ID到路由路径的映射
 */
export const moduleIdToPath: Record<string, string> = {
  'encoder-decoder': '/encoder',
  'crypto-tool': '/crypto',
  'time-tool': '/time',
  'code-formatter': '/formatter',
  'regex-tool': '/regex',
  'qrcode-tool': '/qrcode',
};

/**
 * 路由路径到模块ID的映射
 */
export const pathToModuleId: Record<string, string> = {
  '/encoder': 'encoder-decoder',
  '/crypto': 'crypto-tool',
  '/time': 'time-tool',
  '/formatter': 'code-formatter',
  '/regex': 'regex-tool',
  '/qrcode': 'qrcode-tool',
};
