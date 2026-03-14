import React, { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { AppIcon } from './icons/AppIcon';
import { toolModulesById, type ToolModuleId } from '../modules/catalog';
import styles from './ModulePageShell.module.css';

interface ModulePageShellProps {
  moduleId: ToolModuleId;
  children: ReactNode;
}

const ModulePageShell: React.FC<ModulePageShellProps> = ({ moduleId, children }) => {
  const { t } = useTranslation();
  const module = toolModulesById[moduleId];

  return (
    <div className={styles.pageShell}>
      <section className={styles.pageHeader}>
        <div className={styles.iconWrap} aria-hidden="true">
          <AppIcon name={module.iconName} size={24} />
        </div>
        <div className={styles.headerContent}>
          <h2 className={styles.headerTitle}>
            {t(`${module.i18nKey}.name`, module.fallbackTitle)}
          </h2>
          <p className={styles.headerDesc}>
            {t(`${module.i18nKey}.description`, module.fallbackDescription)}
          </p>
        </div>
        <span className={styles.moduleBadge}>MODULE</span>
      </section>

      <section className={styles.operationSurface}>
        {children}
      </section>
    </div>
  );
};

export default ModulePageShell;
