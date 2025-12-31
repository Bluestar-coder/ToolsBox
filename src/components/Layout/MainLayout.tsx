import React, { Suspense, useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Layout, theme, Button, Space, Spin } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import SideMenu from './SideMenu';
import LanguageSwitcher from '../LanguageSwitcher';
import { pathToModuleId } from '../../router';
import { useTheme } from '../../hooks/useTheme';
import styles from '../styles/MainLayout.module.css';

const { Header, Content, Sider } = Layout;

// 懒加载组件的加载状态
const LoadingFallback: React.FC = React.memo(() => (
  <div className={styles.loadingContainer}>
    <Spin size="large" tip="加载中..." />
  </div>
));

LoadingFallback.displayName = 'LoadingFallback';

const MainLayout: React.FC = React.memo(() => {
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const location = useLocation();

  // 根据当前路径确定当前模块ID
  const currentModuleId = useMemo(() => {
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
      <Header className={headerClass} style={{ background: colorBgContainer }}>
        <div className={styles.headerSpacer} />
        <h1 className={styles.headerTitle}>
          {t('app.title')}
        </h1>
        <Space>
          <LanguageSwitcher />
          <Button type="text" icon={isDark ? <SunOutlined /> : <MoonOutlined />} size="large" onClick={toggleTheme} title={isDark ? t('app.switchToLight') : t('app.switchToDark')} />
        </Space>
      </Header>

      <Layout className={contentLayoutClass}>
        {/* 左侧导航菜单 */}
        <Sider width={200} className={styles.sider} style={{ background: colorBgContainer }}>
          <SideMenu currentModuleId={currentModuleId} />
        </Sider>

        {/* 主内容区 - 使用Outlet渲染子路由 */}
        <Content className={styles.mainContent} style={{ background: colorBgContainer, borderRadius: borderRadiusLG }}>
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
