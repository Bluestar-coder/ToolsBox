import React from 'react';
import { useParams } from 'react-router-dom';
import Regex from '../modules/regex-tool/components/RegexTool';

/**
 * 正则表达式工具页面组件
 */
const RegexPage: React.FC = () => {
  useParams<{ type?: string }>();

  // 这里可以根据type参数更新正则工具类型状态
  // 目前先简单渲染组件

  return <Regex />;
};

export default RegexPage;
