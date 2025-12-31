import React, { useState } from 'react';
import { Layout, theme, Button, Space } from 'antd';
import { SunOutlined, MoonOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import SideMenu from './SideMenu';
import LanguageSwitcher from '../LanguageSwitcher';
import { moduleManager } from '../../modules';
import { useTheme } from '../../hooks/useTheme';

const { Header, Content, Sider } = Layout;

interface MainLayoutProps {
  initialModuleId?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ initialModuleId = 'encoder-decoder' }) => {
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const [currentModuleId, setCurrentModuleId] = useState<string>(initialModuleId);
  const { isDark, toggleTheme } = useTheme();
  const { t } = useTranslation();

  // 获取当前选中的模块
  const currentModule = moduleManager.getModuleById(currentModuleId);
  const ModuleComponent = currentModule?.component;

  // 处理模块切换
  const handleModuleChange = (moduleId: string) => {
    setCurrentModuleId(moduleId);
  };

  return (
    <Layout style={{ minHeight: '100vh', background: isDark ? '#141414' : '#f0f2f5' }}>
      {/* 顶部导航栏 */}
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: colorBgContainer, boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.45)' : '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ width: 100 }} />
        <h1 style={{ margin: 0, color: '#1890ff', fontSize: '24px', fontWeight: 600 }}>
          {t('app.title')}
        </h1>
        <Space>
          <LanguageSwitcher />
          <Button type="text" icon={isDark ? <SunOutlined /> : <MoonOutlined />} size="large" onClick={toggleTheme} title={isDark ? t('app.switchToLight') : t('app.switchToDark')} />
        </Space>
      </Header>

      <Layout style={{ background: isDark ? '#141414' : '#f0f2f5' }}>
        {/* 左侧导航菜单 */}
        <Sider width={200} style={{ background: colorBgContainer, boxShadow: '2px 0 8px rgba(0, 0, 0, 0.06)' }}>
          <SideMenu currentModuleId={currentModuleId} onModuleChange={handleModuleChange} />
        </Sider>

        {/* 主内容区 */}
        <Content style={{ margin: '24px 16px', padding: 24, background: colorBgContainer, borderRadius: borderRadiusLG, overflow: 'auto' }}>
          {ModuleComponent ? <ModuleComponent /> : <div>{t('errors.unknownError')}</div>}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
