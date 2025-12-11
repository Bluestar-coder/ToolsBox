import React, { Component } from 'react';
import type { ReactNode } from 'react';
import { Card, Button, Typography, Space, Tag } from 'antd';
import { CloseCircleOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { useAppContext } from '../hooks/useAppContext';

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
    console.error('ErrorBoundary caught an error:', error, errorInfo);
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
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          alignItems: 'center', 
          minHeight: '100vh',
          backgroundColor: '#f0f2f5'
        }}>
          <Card 
            title={
              <Space>
                <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
                <Title level={4} style={{ margin: 0 }}>应用发生错误</Title>
              </Space>
            } 
            bordered={false}
            style={{ width: '90%', maxWidth: 600 }}
            actions={[
              <Button 
                type="primary" 
                onClick={this.handleReset}
                icon={<CloseCircleOutlined />}
              >
                重试
              </Button>
            ]}
          >
            <div style={{ marginBottom: 16 }}>
              <Text strong>错误信息：</Text>
              <Text style={{ display: 'block', marginTop: 4 }}>{this.state.error?.message}</Text>
            </div>
            
            {this.state.errorInfo && (
              <div>
                <Text strong>组件栈：</Text>
                <pre style={{ 
                  backgroundColor: '#f5f5f5', 
                  padding: 12, 
                  borderRadius: 4, 
                  overflowX: 'auto',
                  fontSize: 12,
                  marginTop: 8
                }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              </div>
            )}
            
            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fff2f0', borderRadius: 4 }}>
              <Text type="danger" style={{ fontSize: 12 }}>
                提示：此错误已被错误边界捕获，应用不会崩溃。点击重试按钮可以重置组件状态。
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
  const { state, clearError } = useAppContext();
  
  if (!state.error) return null;

  return (
    <Card 
      style={{ 
        position: 'fixed', 
        top: 20, 
        right: 20, 
        zIndex: 1000, 
        width: 400,
        borderLeft: '4px solid #ff4d4f'
      }}
      title={
        <Space>
          <ExclamationCircleOutlined style={{ color: '#ff4d4f' }} />
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
      <div style={{ marginBottom: 8 }}>
        <Tag color="error">{state.error.type}</Tag>
      </div>
      <Text>{state.error.message}</Text>
      
      {state.error.stack && (
        <pre style={{ 
          backgroundColor: '#f5f5f5', 
          padding: 8, 
          borderRadius: 4, 
          overflowX: 'auto',
          fontSize: 11,
          marginTop: 8
        }}>
          {state.error.stack}
        </pre>
      )}
    </Card>
  );
};