import React, { Suspense, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Layout, Button, Space, Spin } from 'antd';
import { useTranslation } from 'react-i18next';
import { AppIcon } from '../icons/AppIcon';
import SideMenu from './SideMenu';
import LanguageSwitcher from '../LanguageSwitcher';
import { pathToModuleId } from '../../router/constants';
import { useTheme } from '../../hooks/useTheme';
import styles from '../styles/MainLayout.module.css';

const { Header, Content, Sider } = Layout;

// 懒加载组件的加载状态
const LoadingFallback: React.FC = React.memo(() => (
  <div className={styles.loadingContainer}>
    <Spin size="large" />
  </div>
));

LoadingFallback.displayName = 'LoadingFallback';

const MainLayout: React.FC = React.memo(() => {
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();
  const [siderCollapsed, setSiderCollapsed] = React.useState(false);

  // 根据当前路径确定当前模块ID
  const currentModuleId = useMemo(() => {
    if (location.pathname === '/') {
      return 'dashboard';
    }

    // 尝试完整路径匹配
    if (pathToModuleId[location.pathname]) {
      return pathToModuleId[location.pathname];
    }

    // 尝试路径前缀匹配
    const pathSegments = location.pathname.split('/');
    if (pathSegments.length > 1) {
      const basePath = `/${pathSegments[1]}`;
      if (pathToModuleId[basePath]) {
        return pathToModuleId[basePath];
      }
    }

    // 默认返回编码工具
    return 'encoder-decoder';
  }, [location.pathname]);

  // 动态类名
  const layoutClass = `${styles.mainLayout} ${isDark ? styles.mainLayoutDark : styles.mainLayoutLight}`;
  const headerClass = `${styles.header} ${isDark ? styles.headerShadowDark : styles.headerShadowLight}`;
  const contentLayoutClass = isDark ? styles.contentLayoutDark : styles.contentLayout;

  return (
    <Layout className={layoutClass}>
      {/* 顶部导航栏 */}
      <Header className={headerClass}>
        <div className={styles.brandZone}>
          <span className={styles.brandSignal} aria-hidden="true" />
          <h1 className={styles.headerTitle}>
            {t('app.title')}
          </h1>
        </div>
        <Space size={8} className={styles.headerActions}>
          <div className={styles.languageSlot}>
            <LanguageSwitcher />
          </div>
          <Button
            type="text"
            icon={<AppIcon name={isDark ? 'sun' : 'moon'} size={18} />}
            size="large"
            className={styles.headerAction}
            onClick={toggleTheme}
            title={isDark ? t('app.switchToLight') : t('app.switchToDark')}
          />
        </Space>
      </Header>

      <Layout className={contentLayoutClass}>
        {/* 左侧导航菜单 */}
        <Sider
          width={200}
          collapsedWidth={60}
          collapsed={siderCollapsed}
          onCollapse={setSiderCollapsed}
          breakpoint="md"
          className={styles.sider}
          trigger={null}
        >
          <div className={styles.siderGlow} aria-hidden="true" />
          <div className={styles.siderMenuWrap}>
            <SideMenu currentModuleId={currentModuleId} />
          </div>
          <Button
            type="text"
            className={styles.siderFloatTrigger}
            icon={<AppIcon name={siderCollapsed ? 'menuUnfold' : 'menuFold'} size={18} />}
            onClick={() => setSiderCollapsed(prev => !prev)}
            title={siderCollapsed ? t('common.expand', '展开侧边栏') : t('common.collapse', '收起侧边栏')}
            aria-label={siderCollapsed ? t('common.expand', '展开侧边栏') : t('common.collapse', '收起侧边栏')}
          />
        </Sider>

        {/* 主内容区 - 使用Outlet渲染子路由 */}
        <Content className={styles.mainContent}>
          <Suspense fallback={<LoadingFallback />}>
            <Outlet />
          </Suspense>
        </Content>
      </Layout>
    </Layout>
  );
});

MainLayout.displayName = 'MainLayout';

export default MainLayout;
