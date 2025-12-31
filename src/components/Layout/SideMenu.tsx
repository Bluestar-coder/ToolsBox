import React from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { useTranslation } from 'react-i18next';
import { moduleManager } from '../../modules';

interface SideMenuProps {
  currentModuleId: string;
  onModuleChange: (moduleId: string) => void;
}

// 模块ID到i18n key的映射
const moduleI18nKeys: Record<string, string> = {
  'encoder-decoder': 'modules.encoder',
  'time-tool': 'modules.time',
  'crypto-tool': 'modules.crypto',
  'code-formatter': 'modules.formatter',
  'regex-tool': 'modules.regex',
};

const SideMenu: React.FC<SideMenuProps> = ({ currentModuleId, onModuleChange }) => {
  const { t } = useTranslation();
  const modules = moduleManager.getModules();

  // 菜单项配置
  const menuItems: MenuProps['items'] = modules.map(module => {
    const i18nKey = moduleI18nKeys[module.id];
    return {
      key: module.id,
      icon: module.icon,
      label: i18nKey ? t(`${i18nKey}.name`) : module.name,
      title: i18nKey ? t(`${i18nKey}.description`) : module.description,
    };
  });

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
