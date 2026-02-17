import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { Card, Button, Typography, Space, Tag } from 'antd';
import { CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useErrorContext } from '../hooks/useErrorContext';
import * as Sentry from '@sentry/react';
import { logger } from '../utils/logger';
import i18n from '../i18n';
import styles from './styles/ErrorBoundary.module.css';

const { Title, Text } = Typography;

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

    // 发送到Sentry
    Sentry.captureException(error, {
      contexts: {
        react: {
          componentStack: errorInfo.componentStack,
        },
      },
    });
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
          <Card
            title={
              <Space>
                <ExclamationCircleOutlined className={styles.errorIcon} />
                <Title level={4} className={styles.errorTitle}>{i18n.t('errorBoundary.title')}</Title>
              </Space>
            }
            variant="borderless"
            className={styles.errorCard}
            actions={[
              <Button
                type="primary"
                onClick={this.handleReset}
                icon={<CloseCircleOutlined />}
              >
                {i18n.t('errorBoundary.retry')}
              </Button>
            ]}
          >
            <div className={styles.errorInfo}>
              <Text strong>{i18n.t('errorBoundary.errorMessage')}</Text>
              <Text className={styles.errorMessage}>{this.state.error?.message}</Text>
            </div>

            {this.state.errorInfo && (
              <div>
                <Text strong>{i18n.t('errorBoundary.componentStack')}</Text>
                <pre className={styles.componentStack}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}

            <div className={styles.errorHint}>
              <Text type="danger">
                {i18n.t('errorBoundary.hint')}
              </Text>
            </div>
          </Card>
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
    <Card
      className={styles.errorDisplayCard}
      title={
        <Space>
          <ExclamationCircleOutlined className={styles.errorIcon} />
          <Text strong>操作错误</Text>
        </Space>
      }
      extra={
        <Button
          type="text"
          size="small"
          icon={<CloseCircleOutlined />}
          onClick={clearError}
        />
      }
    >
      <div className={styles.errorTypeTag}>
        <Tag color="error">{state.error.type}</Tag>
      </div>
      <Text>{state.error.message}</Text>

      {state.error.stack && (
        <pre className={styles.errorStack}>
          {state.error.stack}
        </pre>
      )}
    </Card>
  );
};
