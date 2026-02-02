import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';

// 懒加载布局和页面组件
const MainLayout = lazy(() => import('../components/Layout/MainLayout'));
const EncoderPage = lazy(() => import('../pages/EncoderPage'));
const CryptoPage = lazy(() => import('../pages/CryptoPage'));
const TimePage = lazy(() => import('../pages/TimePage'));
const FormatterPage = lazy(() => import('../pages/FormatterPage'));
const RegexPage = lazy(() => import('../pages/RegexPage'));
const QRCodePage = lazy(() => import('../pages/QRCodePage'));
const SettingsPage = lazy(() => import('../pages/SettingsPage'));

// 路由配置
export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/encoder" replace />,
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
      // 设置
      {
        path: 'settings',
        element: <SettingsPage />,
      },
      // 404页面
      {
        path: '*',
        element: <Navigate to="/encoder" replace />,
      },
    ],
  },
];

export default routes;
