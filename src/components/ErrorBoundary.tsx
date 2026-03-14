import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { useErrorContext } from '../hooks/useErrorContext';
import { logger } from '../utils/logger';
import i18n from '../i18n';
import styles from './styles/ErrorBoundary.module.css';
import { AppIcon } from './icons/AppIcon';

const sentryEnabled = import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN;

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

// 错误边界组件（类组件）
export class ErrorBoundaryClass extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  // 捕获子组件树中的错误
  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  // 记录错误信息
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({ errorInfo });
    logger.error('ErrorBoundary caught an error:', error, errorInfo);

    if (sentryEnabled) {
      void import('../utils/sentry').then(({ captureError }) => {
        captureError(error, {
          react: {
            componentStack: errorInfo.componentStack,
          },
        });
      });
    }
  }

  // 重置错误状态
  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className={styles.errorBoundaryContainer}>
          <div className={styles.errorCard}>
            <div className={styles.errorCardHeader}>
              <div className={styles.errorCardTitle}>
                <AppIcon name="alert" className={styles.errorIcon} />
                <h2 className={styles.errorTitle}>{i18n.t('errorBoundary.title')}</h2>
              </div>
            </div>
            <div className={styles.errorInfo}>
              <strong>{i18n.t('errorBoundary.errorMessage')}</strong>
              <p className={styles.errorMessage}>{this.state.error?.message}</p>
            </div>

            {this.state.errorInfo && (
              <div>
                <strong>{i18n.t('errorBoundary.componentStack')}</strong>
                <pre className={styles.componentStack}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <div className={styles.errorHint}>
              {i18n.t('errorBoundary.hint')}
            </div>

            <button
              type="button"
              className={styles.errorPrimaryButton}
              onClick={this.handleReset}
            >
              <AppIcon name="close" />
              <span>{i18n.t('errorBoundary.retry')}</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// 错误显示组件（函数组件，用于显示上下文管理的错误）
export const ErrorDisplay: React.FC = () => {
  const { state, clearError } = useErrorContext();

  if (!state.error) return null;

  return (
    <div className={styles.errorDisplayCard} role="alert">
      <div className={styles.errorCardHeader}>
        <div className={styles.errorCardTitle}>
          <AppIcon name="alert" className={styles.errorIcon} />
          <strong>操作错误</strong>
        </div>
        <button type="button" className={styles.errorCloseButton} onClick={clearError}>
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
};
