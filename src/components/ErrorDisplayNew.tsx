import React, { useCallback } from 'react';
import { Card, Button, Typography, Space, Tag } from 'antd';
import { CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useErrorContext } from '../hooks/useErrorContext';
import styles from './styles/ErrorBoundary.module.css';

const { Text } = Typography;

// 错误显示组件（函数组件，用于显示上下文管理的错误）
const ErrorDisplay: React.FC = React.memo(() => {
  const { state, clearError } = useErrorContext();

  // 使用useCallback优化事件处理
  const handleClose = useCallback(() => {
    clearError();
  }, [clearError]);

  // 如果没有错误，不渲染
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
          onClick={handleClose}
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
});

ErrorDisplay.displayName = 'ErrorDisplay';

export default ErrorDisplay;
