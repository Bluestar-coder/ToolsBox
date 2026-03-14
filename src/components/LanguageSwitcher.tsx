import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, changeLanguage } from '../i18n';
import { AppIcon } from './icons/AppIcon';
import styles from './LanguageSwitcher.module.css';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const currentLang = useMemo(
    () =>
      supportedLanguages.find(l => l.code === i18n.language)
      || supportedLanguages.find(l => i18n.language.startsWith(l.code.split('-')[0]))
      || supportedLanguages[0],
    [i18n.language]
  );

  useEffect(() => {
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    return () => document.removeEventListener('pointerdown', handlePointerDown);
  }, []);

  return (
    <div className={styles.switcher} ref={rootRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        <AppIcon name="globe" size={16} />
        <span className={styles.triggerText}>{currentLang.flag}</span>
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          {supportedLanguages.map((lang) => {
            const active = lang.code === currentLang.code;
            return (
              <button
                key={lang.code}
                type="button"
                role="menuitemradio"
                aria-checked={active}
                className={`${styles.menuButton} ${active ? styles.menuButtonActive : ''}`}
                onClick={() => {
                  void changeLanguage(lang.code);
                  setOpen(false);
                }}
              >
                <span className={styles.menuButtonFlag}>{lang.flag}</span>
                <span className={styles.menuButtonName}>{lang.name}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LanguageSwitcher;
