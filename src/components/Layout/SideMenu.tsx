import React, { useMemo } from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { moduleManager } from '../../modules';
import { moduleIdToPath } from '../../router';
import styles from '../styles/SideMenu.module.css';

interface SideMenuProps {
  currentModuleId: string;
}

// 模块ID到i18n key的映射
const moduleI18nKeys: Record<string, string> = {
  'encoder-decoder': 'modules.encoder',
  'time-tool': 'modules.time',
  'crypto-tool': 'modules.crypto',
  'code-formatter': 'modules.formatter',
  'regex-tool': 'modules.regex',
  'qrcode-tool': 'modules.qrcode',
};

const SideMenu: React.FC<SideMenuProps> = React.memo(({ currentModuleId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const modules = moduleManager.getLazyModules();

  // 菜单项配置 - 使用useMemo优化
  const menuItems: MenuProps['items'] = useMemo(() =>
    modules.map(module => {
      const i18nKey = moduleI18nKeys[module.id];
      const path = moduleIdToPath[module.id];
      return {
        key: module.id,
        icon: module.icon,
        label: i18nKey ? t(`${i18nKey}.name`) : module.name,
        title: i18nKey ? t(`${i18nKey}.description`) : module.description,
        onClick: () => {
          // 使用路由导航
          navigate(path);
        },
      };
    }), [modules, t, navigate]
  );

  return (
    <Menu
      mode="inline"
      selectedKeys={[currentModuleId]}
      items={menuItems}
      className={styles.menu}
    />
  );
});

SideMenu.displayName = 'SideMenu';

export default SideMenu;
