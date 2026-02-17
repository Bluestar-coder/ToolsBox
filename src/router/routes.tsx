import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';

// 懒加载布局和页面组件
const MainLayout = lazy(() => import('../components/Layout/MainLayout'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));
const EncoderPage = lazy(() => import('../pages/EncoderPage'));
const CryptoPage = lazy(() => import('../pages/CryptoPage'));
const TimePage = lazy(() => import('../pages/TimePage'));
const FormatterPage = lazy(() => import('../pages/FormatterPage'));
const RegexPage = lazy(() => import('../pages/RegexPage'));
const QRCodePage = lazy(() => import('../pages/QRCodePage'));
const DiffPage = lazy(() => import('../pages/DiffPage'));
const HttpDebugPage = lazy(() => import('../pages/HttpDebugPage'));
const IpNetworkPage = lazy(() => import('../pages/IpNetworkPage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));

// 路由配置
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      // 编码/解码工具
      {
        path: 'encoder',
        element: <EncoderPage />,
      },
      {
        path: 'encoder/:type',
        element: <EncoderPage />,
      },
      // 加密工具
      {
        path: 'crypto',
        element: <CryptoPage />,
      },
      {
        path: 'crypto/:type',
        element: <CryptoPage />,
      },
      // 时间工具
      {
        path: 'time',
        element: <TimePage />,
      },
      {
        path: 'time/:type',
        element: <TimePage />,
      },
      // 代码格式化
      {
        path: 'formatter',
        element: <FormatterPage />,
      },
      {
        path: 'formatter/:type',
        element: <FormatterPage />,
      },
      // 正则工具
      {
        path: 'regex',
        element: <RegexPage />,
      },
      {
        path: 'regex/:type',
        element: <RegexPage />,
      },
      // 二维码工具
      {
        path: 'qrcode',
        element: <QRCodePage />,
      },
      {
        path: 'qrcode/:type',
        element: <QRCodePage />,
      },
      // 差异对比工具
      {
        path: 'diff',
        element: <DiffPage />,
      },
      // HTTP 调试工具
      {
        path: 'http-debug',
        element: <HttpDebugPage />,
      },
      // IP/网络工具
      {
        path: 'ip-network',
        element: <IpNetworkPage />,
      },
      // 设置
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      // 404页面
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
];

export default routes;
