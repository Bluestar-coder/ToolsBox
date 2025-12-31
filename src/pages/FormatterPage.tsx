import React from 'react';
import { useParams } from 'react-router-dom';
import CodeFormatter from '../modules/code-formatter/components/CodeFormatter';

/**
 * 代码格式化工具页面组件
 */
const FormatterPage: React.FC = () => {
  useParams<{ type?: string }>();

  // 这里可以根据type参数更新格式化类型状态
  // 目前先简单渲染组件

  return <CodeFormatter />;
};

export default FormatterPage;
