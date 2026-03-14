import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useModules } from '../../hooks/useModules';
import { AppIcon } from '../icons/AppIcon';
import { moduleIdToPath } from '../../modules/catalog';
import { resolveDisplayModules } from '../../modules/display';
import styles from '../styles/SideMenu.module.css';

interface SideMenuProps {
  currentModuleId: string;
}

const SideMenu: React.FC<SideMenuProps> = React.memo(({ currentModuleId }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const modules = useModules();

  const sortedModules = useMemo(() => resolveDisplayModules(modules), [modules]);

  return (
    <nav className={styles.menu} role="menu" aria-label={t('home.quickStart')}>
      <div className={styles.menuList}>
        <button
          type="button"
          role="menuitem"
          className={`${styles.menuButton} ${currentModuleId === 'dashboard' ? styles.menuButtonActive : ''}`}
          onClick={() => navigate('/')}
        >
          <span className={styles.menuIcon}>
            <AppIcon name="dashboard" />
          </span>
          <span className={styles.menuLabel}>{t('home.menu')}</span>
        </button>

        {sortedModules.map((module) => {
          const path = moduleIdToPath[module.id as keyof typeof moduleIdToPath];
          const isActive = currentModuleId === module.id;
          return (
            <button
              key={module.id}
              type="button"
              role="menuitem"
              title={module.i18nKey
                ? t(`${module.i18nKey}.description`, module.description)
                : module.description}
              className={`${styles.menuButton} ${isActive ? styles.menuButtonActive : ''}`}
              onClick={() => navigate(path ?? '/')}
            >
              <span className={styles.menuIcon}>{module.icon}</span>
              <span className={styles.menuLabel}>
                {module.i18nKey ? t(`${module.i18nKey}.name`, module.name) : module.name}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});

SideMenu.displayName = 'SideMenu';

export default SideMenu;
