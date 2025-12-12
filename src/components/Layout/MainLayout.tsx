import React, { useState } from 'react';
import { Layout, theme, Button, Dropdown } from 'antd';
import { SunOutlined, MoonOutlined, DesktopOutlined } from '@ant-design/icons';
import SideMenu from './SideMenu';
import { moduleManager } from '../../modules';
import { useTheme } from '../../hooks/useTheme';
import type { ThemeMode } from '../../context/ThemeContext';

const { Header, Content, Sider } = Layout;

interface MainLayoutProps {
  initialModuleId?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ initialModuleId = 'encoder-decoder' }) => {
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const [currentModuleId, setCurrentModuleId] = useState<string>(initialModuleId);
  const { theme: currentTheme, isDark, setTheme } = useTheme();

  // 获取当前选中的模块
  const currentModule = moduleManager.getModuleById(currentModuleId);
  const ModuleComponent = currentModule?.component;

  // 处理模块切换
  const handleModuleChange = (moduleId: string) => {
    setCurrentModuleId(moduleId);
  };

  // 主题菜单项
  const themeMenuItems = [
    { key: 'light', label: '☀️ 浅色模式', onClick: () => setTheme('light' as ThemeMode) },
    { key: 'dark', label: '🌙 深色模式', onClick: () => setTheme('dark' as ThemeMode) },
    { key: 'system', label: '💻 跟随系统', onClick: () => setTheme('system' as ThemeMode) },
  ];

  const getThemeIcon = () => {
    if (currentTheme === 'system') return <DesktopOutlined />;
    return isDark ? <MoonOutlined /> : <SunOutlined />;
  };

  return (
    <Layout style={{ minHeight: '100vh', background: isDark ? '#141414' : '#f0f2f5' }}>
      {/* 顶部导航栏 */}
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 24px', background: colorBgContainer, boxShadow: isDark ? '0 2px 8px rgba(0, 0, 0, 0.45)' : '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
        <div style={{ width: 100 }} />
        <h1 style={{ margin: 0, color: '#1890ff', fontSize: '24px', fontWeight: 600 }}>
          🔧 效率工具箱
        </h1>
        <Dropdown menu={{ items: themeMenuItems, selectedKeys: [currentTheme] }} placement="bottomRight">
          <Button type="text" icon={getThemeIcon()} size="large" />
        </Dropdown>
      </Header>

      <Layout style={{ background: isDark ? '#141414' : '#f0f2f5' }}>
        {/* 左侧导航菜单 */}
        <Sider width={200} style={{ background: colorBgContainer, boxShadow: '2px 0 8px rgba(0, 0, 0, 0.06)' }}>
          <SideMenu currentModuleId={currentModuleId} onModuleChange={handleModuleChange} />
        </Sider>

        {/* 主内容区 */}
        <Content style={{ margin: '24px 16px', padding: 24, background: colorBgContainer, borderRadius: borderRadiusLG, overflow: 'auto' }}>
          {ModuleComponent ? <ModuleComponent /> : <div>模块未找到</div>}
        </Content>
      </Layout>
    </Layout>
  );
};

export default MainLayout;
