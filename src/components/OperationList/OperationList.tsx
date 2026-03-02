/**
 * 操作列表组件
 * 显示所有可用的操作，支持拖拽和搜索
 */

import React, { useState, useMemo } from 'react';
import { Card, Input, Collapse, Badge, Empty, Spin } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { Operation, OperationCategory } from '../../core/operations';
import { getOperationIcon } from '../../core/operations/icons';
import { useTranslation } from 'react-i18next';
import styles from './OperationList.module.css';

interface OperationListProps {
  /** 操作列表 */
  operations: Operation[];
  /** 操作点击回调 */
  onOperationClick?: (operation: Operation) => void;
  /** 加载状态 */
  loading?: boolean;
}

// 分类映射
const categoryMap: Record<OperationCategory, string> = {
  encoding: '编码/解码',
  encryption: '加密/解密',
  hashing: '哈希计算',
  compression: '压缩/解压',
  data: '数据格式',
  network: '网络协议',
  time: '时间处理',
  analysis: '数据分析',
  binary: '二进制处理',
  utility: '实用工具',
};

/**
 * 操作列表组件
 */
const OperationList: React.FC<OperationListProps> = ({
  operations,
  onOperationClick,
  loading = false,
}) => {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategories, setActiveCategories] = useState<string[]>([]);

  // 按分类分组操作
  const operationsByCategory = useMemo(() => {
    const grouped: Partial<Record<OperationCategory, Operation[]>> = {};

    operations.forEach(operation => {
      const category = operation.category;
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category]!.push(operation);
    });

    return grouped;
  }, [operations]);

  // 过滤操作
  const filteredOperationsByCategory = useMemo(() => {
    if (!searchQuery) {
      return operationsByCategory;
    }

    const filtered: Partial<Record<OperationCategory, Operation[]>> = {};
    const lowerQuery = searchQuery.toLowerCase();

    Object.entries(operationsByCategory).forEach(([category, ops]) => {
      const filteredOps = (ops as Operation[]).filter(op =>
        op.name.toLowerCase().includes(lowerQuery) ||
        op.description.toLowerCase().includes(lowerQuery) ||
        op.id.toLowerCase().includes(lowerQuery)
      );

      if (filteredOps.length > 0) {
        filtered[category as OperationCategory] = filteredOps;
      }
    });

    return filtered;
  }, [operationsByCategory, searchQuery]);

  // 处理分类展开/收起
  const handleCategoryChange = (activeKeys: string[]) => {
    setActiveCategories(activeKeys);
  };

  // 渲染操作卡片
  const renderOperationCard = (operation: Operation) => (
    <Card
      key={operation.id}
      size="small"
      className={styles.operationCard}
      hoverable
      onClick={() => onOperationClick?.(operation)}
    >
      <div className={styles.operationHeader}>
        <div className={styles.operationIcon}>
          {typeof operation.icon === 'string' ? getOperationIcon(operation.icon) : operation.icon}
        </div>
        <div className={styles.operationInfo}>
          <div className={styles.operationName}>
            {operation.name}
          </div>
          <div className={styles.operationDescription}>
            {operation.description}
          </div>
        </div>
      </div>
    </Card>
  );

  const collapseItems = Object.entries(filteredOperationsByCategory).map(([category, ops]) => ({
    key: category,
    label: (
      <div className={styles.categoryHeader}>
        <span className={styles.categoryName}>
          {categoryMap[category as OperationCategory] || category}
        </span>
        <Badge count={ops.length} className={styles.categoryBadge} />
      </div>
    ),
    children: (
      <div className={styles.operationsGrid}>
        {(ops as Operation[]).map(renderOperationCard)}
      </div>
    ),
  }));

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <Spin size="large" />
      </div>
    );
  }

  return (
    <div className={styles.operationList}>
      <div className={styles.searchContainer}>
        <Input
          placeholder={t('operationList.searchPlaceholder', '搜索操作...')}
          name="operation-search"
          prefix={<SearchOutlined />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          allowClear
        />
      </div>

      <div className={styles.scrollArea}>
        {Object.keys(filteredOperationsByCategory).length === 0 ? (
          <Empty
            description={t('operationList.noOperations', '没有找到匹配的操作')}
            className={styles.emptyContainer}
          />
        ) : (
          <Collapse
            activeKey={activeCategories.length > 0 ? activeCategories : Object.keys(filteredOperationsByCategory)}
            onChange={handleCategoryChange}
            className={styles.categoryCollapse}
            items={collapseItems}
          />
        )}
      </div>
    </div>
  );
};

export default OperationList;
