import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useModules } from '../hooks/useModules';
import { moduleIdToPath } from '../modules/catalog';
import { resolveDisplayModules } from '../modules/display';
import { getRuntimeInfo, openRuntimePath, type RuntimeInfo } from '../utils/runtime-info';
import styles from './DashboardPage.module.css';

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const modules = useModules();
  const [runtimeInfo, setRuntimeInfo] = useState<RuntimeInfo | null>(null);
  const [openingPath, setOpeningPath] = useState<string | null>(null);
  const [desktopNotice, setDesktopNotice] = useState<string | null>(null);

  const sortedModules = useMemo(() => resolveDisplayModules(modules), [modules]);
  const desktopPaths = useMemo(() => {
    if (!runtimeInfo?.desktop) {
      return [];
    }

    return [
      { key: 'data', label: 'App Data', value: runtimeInfo.app_data_dir },
      { key: 'config', label: 'Config', value: runtimeInfo.app_config_dir },
      { key: 'temp', label: 'Temp', value: runtimeInfo.temp_dir },
    ].filter((entry): entry is { key: string; label: string; value: string } => !!entry.value);
  }, [runtimeInfo]);

  useEffect(() => {
    let active = true;

    void getRuntimeInfo().then((info) => {
      if (active) {
        setRuntimeInfo(info);
      }
    });

    return () => {
      active = false;
    };
  }, []);

  const handleOpenDesktopPath = async (path: string) => {
    setDesktopNotice(null);
    setOpeningPath(path);
    const opened = await openRuntimePath(path);
    setOpeningPath(null);
    if (!opened) {
      setDesktopNotice('Unable to open path in the system file manager.');
    }
  };

  const handleCardClick = (moduleId: string) => {
    const path = moduleIdToPath[moduleId as keyof typeof moduleIdToPath];
    if (path) {
      navigate(path);
    }
  };

  return (
    <div className={styles.pageShell}>
      <section className={styles.heroPanel}>
        <span className={styles.heroPulse} aria-hidden="true" />
        <h2 className={styles.heroTitle}>
          {t('home.welcome')}
        </h2>
        <p className={styles.heroDescription}>
          {t('home.description')}
        </p>
        {runtimeInfo && (
          <div className={styles.runtimePanel}>
            <span className={styles.runtimeChip}>
              {runtimeInfo.desktop ? 'Desktop Runtime' : 'Web Runtime'}
            </span>
            {runtimeInfo.hostname && (
              <span className={styles.runtimeChip}>
                Host: {runtimeInfo.hostname}
              </span>
            )}
            <span className={styles.runtimeChip}>
              {runtimeInfo.platform}/{runtimeInfo.arch}
            </span>
            <span className={styles.runtimeChip}>
              Native HTTP: {runtimeInfo.native_http ? 'on' : 'off'}
            </span>
            <span className={styles.runtimeChip}>
              Window State: {runtimeInfo.window_state ? 'on' : 'off'}
            </span>
            <span className={styles.runtimeChip}>
              Native FS: {runtimeInfo.native_fs ? 'on' : 'off'}
            </span>
            <span className={styles.runtimeChip}>
              Path Opener: {runtimeInfo.path_opener ? 'on' : 'off'}
            </span>
          </div>
        )}
        {runtimeInfo?.desktop && desktopPaths.length > 0 && (
          <div className={styles.desktopPanel}>
            <div className={styles.desktopPanelHeader}>
              <span className={styles.desktopPanelTitle}>Desktop Quick Actions</span>
              <span className={styles.desktopPanelHint}>Native folders exposed by the Tauri runtime</span>
            </div>
            <div className={styles.desktopPathGrid}>
              {desktopPaths.map((entry) => (
                <div key={entry.key} className={styles.desktopPathCard}>
                  <span className={styles.desktopPathLabel}>{entry.label}</span>
                  <code className={styles.desktopPathValue}>{entry.value}</code>
                  <button
                    type="button"
                    className={styles.desktopPathButton}
                    disabled={!runtimeInfo.path_opener || openingPath === entry.value}
                    onClick={() => handleOpenDesktopPath(entry.value)}
                  >
                    {openingPath === entry.value ? 'Opening…' : 'Open Folder'}
                  </button>
                </div>
              ))}
            </div>
            {desktopNotice && <p className={styles.desktopNotice}>{desktopNotice}</p>}
          </div>
        )}
      </section>

      <h3 className={styles.sectionTitle}>
        {t('home.quickStart')}
      </h3>

      <div className={styles.moduleGrid}>
        {sortedModules.map((module, index) => (
          <button
            type="button"
            key={module.id}
            onClick={() => handleCardClick(module.id)}
            className={styles.moduleCard}
            style={{ ['--card-delay' as string]: `${index * 50}ms` }}
          >
            <div className={styles.moduleCardBody}>
              <div className={styles.moduleIcon}>
                {module.icon}
              </div>
              <h4 className={styles.moduleName}>
                {module.i18nKey ? t(`${module.i18nKey}.name`, module.name) : module.name}
              </h4>
              <p className={styles.moduleDescription}>
                {module.i18nKey
                  ? t(`${module.i18nKey}.description`, module.description)
                  : module.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default DashboardPage;
