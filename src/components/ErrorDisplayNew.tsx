import React, { useCallback } from 'react';
import { useErrorContext } from '../hooks/useErrorContext';
import styles from './styles/ErrorBoundary.module.css';
import { AppIcon } from './icons/AppIcon';

const ErrorDisplay: React.FC = React.memo(() => {
  const { state, clearError } = useErrorContext();

  const handleClose = useCallback(() => {
    clearError();
  }, [clearError]);

  if (!state.error) return null;

  return (
    <div className={styles.errorDisplayCard} role="alert">
      <div className={styles.errorCardHeader}>
        <div className={styles.errorCardTitle}>
          <AppIcon name="alert" className={styles.errorIcon} />
          <strong>操作错误</strong>
        </div>
        <button type="button" className={styles.errorCloseButton} onClick={handleClose}>
          <AppIcon name="close" />
        </button>
      </div>

      <div className={styles.errorTypeTag}>
        <span className={styles.errorBadge}>{state.error.type}</span>
      </div>
      <p className={styles.errorMessage}>{state.error.message}</p>

      {state.error.stack && (
        <pre className={styles.errorStack}>
          {state.error.stack}
        </pre>
      )}
    </div>
  );
});

ErrorDisplay.displayName = 'ErrorDisplay';

export default ErrorDisplay;
