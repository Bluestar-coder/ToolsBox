import { lazy } from 'react';
import { Navigate } from 'react-router-dom';
import type { RouteObject } from 'react-router-dom';
import { toolModules } from '../modules/catalog';
import { getToolModulePageImport } from '../modules/loaders';

const MainLayout = lazy(() => import('../components/Layout/MainLayout'));
const DashboardPage = lazy(() => import('../pages/DashboardPage'));

const toolRoutes: RouteObject[] = toolModules.flatMap((module) => {
  const PageComponent = lazy(getToolModulePageImport(module.id));
  const basePath = module.routePath.replace(/^\//, '');
  const routes: RouteObject[] = [
    {
      path: basePath,
      element: <PageComponent />,
    },
  ];

  if (module.supportsTypeParam) {
    routes.push({
      path: `${basePath}/:type`,
      element: <PageComponent />,
    });
  }

  return routes;
});

export const routes: RouteObject[] = [
  {
    path: '/',
    element: <MainLayout />,
    children: [
      {
        index: true,
        element: <DashboardPage />,
      },
      ...toolRoutes,
      {
        path: '*',
        element: <Navigate to="/" replace />,
      },
    ],
  },
];

export default routes;
