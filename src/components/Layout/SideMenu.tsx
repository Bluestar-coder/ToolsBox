import React from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { moduleManager } from '../../modules';

interface SideMenuProps {
  currentModuleId: string;
  onModuleChange: (moduleId: string) => void;
}

const SideMenu: React.FC<SideMenuProps> = ({ currentModuleId, onModuleChange }) => {
  const modules = moduleManager.getModules();

  // 菜单项配置
  const menuItems: MenuProps['items'] = modules.map(module => ({
    key: module.id,
    icon: module.icon,
    label: module.name,
    title: module.description
  }));

  // 处理菜单点击
  const handleMenuClick: MenuProps['onClick'] = (e) => {
    onModuleChange(e.key);
  };

  return (
    <Menu
      mode="inline"
      selectedKeys={[currentModuleId]}
      onClick={handleMenuClick}
      items={menuItems}
      style={{ height: '100%', borderRight: 0 }}
    />
  );
};

export default SideMenu;
