import React, { useMemo } from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useModules } from '../../hooks/useModules';
import { moduleIdToPath } from '../../router/constants';
import styles from '../styles/SideMenu.module.css';
import { AppIcon } from '../icons/AppIcon';

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
  'diff-tool': 'modules.diff',
  'http-debug': 'modules.httpDebug',
  'ip-network': 'modules.ipNetwork',
  'recipe-tool': 'modules.recipe',
};

// 定义菜单顺序：编码/解码、加密/解密、时间工具、正则工具、代码格式化、二维码工具、差异对比、HTTP调试、IP/网络工具、Recipe工具
const moduleOrder = [
  'encoder-decoder',
  'crypto-tool',
  'time-tool',
  'regex-tool',
  'code-formatter',
  'qrcode-tool',
  'diff-tool',
  'http-debug',
  'ip-network',
  'recipe-tool',
];

const moduleFallbackIcons: Record<string, React.ReactNode> = {
  'encoder-decoder': <AppIcon name="encoder" />,
  'crypto-tool': <AppIcon name="crypto" />,
  'time-tool': <AppIcon name="time" />,
  'regex-tool': <AppIcon name="regex" />,
  'code-formatter': <AppIcon name="formatter" />,
  'qrcode-tool': <AppIcon name="qrcode" />,
  'diff-tool': <AppIcon name="diff" />,
  'http-debug': <AppIcon name="http" />,
  'ip-network': <AppIcon name="network" />,
  'recipe-tool': <AppIcon name="recipe" />,
};

const SideMenu: React.FC<SideMenuProps> = React.memo(({ currentModuleId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const modules = useModules();

  // 按照定义的顺序排序模块
  const sortedModules = useMemo(() => {
    // 确保所有模块都已加载，如果有模块未加载，则使用占位符
    const modulesMap = new Map(modules.map(m => [m.id, m]));
    
    return moduleOrder.map(id => {
      const module = modulesMap.get(id);
      if (module) {
        return {
          id: module.id,
          name: module.name,
          icon: module.icon ?? moduleFallbackIcons[module.id] ?? null,
          description: module.description,
        };
      }
      // 如果模块尚未加载（异步加载中），返回占位符
      return {
        id,
        name: id,
        icon: moduleFallbackIcons[id] ?? null,
        description: '',
      };
    });
  }, [modules]);

  // 菜单项配置 - 使用useMemo优化
  const menuItems: MenuProps['items'] = useMemo(() => {
    const items = sortedModules.map(module => {
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
    });

    // 添加仪表盘/首页入口
    items.unshift({
      key: 'dashboard',
      icon: <AppIcon name="dashboard" />,
      label: t('home.menu'),
      title: t('home.welcome'),
      onClick: () => navigate('/'),
    });

    return items;
  }, [sortedModules, t, navigate]);

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
