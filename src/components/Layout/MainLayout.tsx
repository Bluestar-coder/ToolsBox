import React, { useState } from 'react';
import { Layout, theme } from 'antd';
import SideMenu from './SideMenu';
import { moduleManager } from '../../modules';

const { Header, Content, Sider } = Layout;

interface MainLayoutProps {
  initialModuleId?: string;
}

const MainLayout: React.FC<MainLayoutProps> = ({ initialModuleId = 'encoder-decoder' }) => {
  const { token: { colorBgContainer, borderRadiusLG } } = theme.useToken();
  const [currentModuleId, setCurrentModuleId] = useState<string>(initialModuleId);

  // 获取当前选中的模块
  const currentModule = moduleManager.getModuleById(currentModuleId);
  const ModuleComponent = currentModule?.component;

  // 处理模块切换
  const handleModuleChange = (moduleId: string) => {
    setCurrentModuleId(moduleId);
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* 顶部导航栏 */}
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', background: colorBgContainer, boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)' }}>
        <h1 style={{ margin: 0, color: '#1890ff', fontSize: '24px', fontWeight: 600 }}>
          🔧 效率工具箱
        </h1>
      </Header>

      <Layout>
        {/* 左侧导航菜单 */}
        <Sider width={200} theme="light" style={{ background: colorBgContainer, boxShadow: '2px 0 8px rgba(0, 0, 0, 0.06)' }}>
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
