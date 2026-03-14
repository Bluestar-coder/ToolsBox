import React, { Suspense, memo } from 'react';
import { useRoutes } from 'react-router-dom';
import routes from './routes';

interface AppRouterProps {
  basename?: string;
}

const LoadingFallback: React.FC = memo(() => (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      gap: 12,
      minHeight: '100vh',
      color: 'var(--text-secondary)',
    }}
  >
    <div
      style={{
        width: 28,
        height: 28,
        borderRadius: '999px',
        border: '2px solid color-mix(in srgb, var(--primary-color) 18%, transparent)',
        borderTopColor: 'var(--primary-color)',
        animation: 'spinFallback 1s linear infinite',
      }}
    />
    <span>Loading…</span>
  </div>
));

LoadingFallback.displayName = 'LoadingFallback';

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
