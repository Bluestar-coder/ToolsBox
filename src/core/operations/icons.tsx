/**
 * 操作图标映射组件
 * 将操作中的字符串图标名称映射到实际的React组件
 */

import React from 'react';
import {
  LockOutlined,
  UnlockOutlined,
  KeyOutlined,
  SafetyOutlined,
  FileTextOutlined,
  CodeOutlined,
  ClockCircleOutlined,
  BugOutlined,
  DatabaseOutlined,
  CloudServerOutlined,
  CompressOutlined,
  ExpandOutlined,
  ApiOutlined,
  ThunderboltOutlined,
  ToolOutlined,
  LinkOutlined,
} from '@ant-design/icons';

// 图标映射表
const iconMap: Record<string, React.ReactNode> = {
  LinkOutlined: <LinkOutlined />,
  LockOutlined: <LockOutlined />,
  UnlockOutlined: <UnlockOutlined />,
  KeyOutlined: <KeyOutlined />,
  SafetyOutlined: <SafetyOutlined />,
  FileTextOutlined: <FileTextOutlined />,
  CodeOutlined: <CodeOutlined />,
  ClockCircleOutlined: <ClockCircleOutlined />,
  BugOutlined: <BugOutlined />,
  DatabaseOutlined: <DatabaseOutlined />,
  CloudServerOutlined: <CloudServerOutlined />,
  CompressOutlined: <CompressOutlined />,
  ExpandOutlined: <ExpandOutlined />,
  ApiOutlined: <ApiOutlined />,
  ThunderboltOutlined: <ThunderboltOutlined />,
  ToolOutlined: <ToolOutlined />,
};

/**
 * 获取操作图标
 * @param iconName 图标名称
 * @returns React图标组件
 */
export function getOperationIcon(iconName: string): React.ReactNode {
  return iconMap[iconName] || <ToolOutlined />;
}

/**
 * 注册新的图标
 * @param name 图标名称
 * @param icon React图标组件
 */
export function registerIcon(name: string, icon: React.ReactNode): void {
  iconMap[name] = icon;
}

export default iconMap;