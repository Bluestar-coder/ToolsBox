import React, { Suspense, lazy, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../icons/AppIcon';
import SideMenu from './SideMenu';
import LanguageSwitcher from '../LanguageSwitcher';
import { pathToModuleId } from '../../router/constants';
import { useTheme } from '../../hooks/useTheme';
import styles from '../styles/MainLayout.module.css';

const LazyAntdThemeProvider = lazy(() => import('../AntdThemeProvider'));
const LazyErrorDisplay = lazy(() => import('../ErrorDisplayNew'));

const LoadingFallback: React.FC = React.memo(() => (
  <div className={styles.loadingContainer}>
    <div className={styles.loadingOrb} />
  </div>
));

LoadingFallback.displayName = 'LoadingFallback';

const MainLayout: React.FC = React.memo(() => {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();
  const [siderCollapsed, setSiderCollapsed] = React.useState(false);

  const currentModuleId = useMemo(() => {
    if (location.pathname === '/') {
      return 'dashboard';
    }

    if (pathToModuleId[location.pathname]) {
      return pathToModuleId[location.pathname];
    }

    const pathSegments = location.pathname.split('/');
    if (pathSegments.length > 1) {
      const basePath = `/${pathSegments[1]}`;
      if (pathToModuleId[basePath]) {
        return pathToModuleId[basePath];
      }
    }

    return 'encoder-decoder';
  }, [location.pathname]);

  const layoutClass = `${styles.mainLayout} ${isDark ? styles.mainLayoutDark : styles.mainLayoutLight}`;
  const headerClass = `${styles.header} ${isDark ? styles.headerShadowDark : styles.headerShadowLight}`;
  const contentLayoutClass = isDark ? styles.contentLayoutDark : styles.contentLayout;
  const renderDashboard = currentModuleId === 'dashboard';

  return (
    <div className={layoutClass}>
      <header className={headerClass} role="banner">
        <div className={styles.brandZone}>
          <span className={styles.brandSignal} aria-hidden="true" />
          <h1 className={styles.headerTitle}>
            {t('app.title')}
          </h1>
        </div>
        <div className={styles.headerActions}>
          <div className={styles.languageSlot}>
            <LanguageSwitcher />
          </div>
          <button
            type="button"
            className={styles.headerAction}
            onClick={toggleTheme}
            title={isDark ? t('app.switchToLight') : t('app.switchToDark')}
          >
            <AppIcon name={isDark ? 'sun' : 'moon'} size={18} />
          </button>
        </div>
      </header>

      <div className={contentLayoutClass}>
        <aside
          className={`${styles.sider} ${siderCollapsed ? styles.siderCollapsed : ''}`}
          aria-label="Primary navigation"
        >
          <div className={styles.siderGlow} aria-hidden="true" />
          <div className={styles.siderMenuWrap}>
            <SideMenu currentModuleId={currentModuleId} />
          </div>
          <button
            type="button"
            className={styles.siderFloatTrigger}
            onClick={() => setSiderCollapsed(prev => !prev)}
            title={siderCollapsed ? t('common.expand', '展开侧边栏') : t('common.collapse', '收起侧边栏')}
            aria-label={siderCollapsed ? t('common.expand', '展开侧边栏') : t('common.collapse', '收起侧边栏')}
          >
            <AppIcon name={siderCollapsed ? 'menuUnfold' : 'menuFold'} size={18} />
          </button>
        </aside>

        <main className={styles.mainContent} role="main">
          <Suspense fallback={<LoadingFallback />}>
            {renderDashboard ? (
              <Outlet />
            ) : (
              <LazyAntdThemeProvider>
                <Outlet />
                <LazyErrorDisplay />
              </LazyAntdThemeProvider>
            )}
          </Suspense>
        </main>
      </div>
    </div>
  );
});

MainLayout.displayName = 'MainLayout';

export default MainLayout;
