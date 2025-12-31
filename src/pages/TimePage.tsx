import React from 'react';
import { useParams } from 'react-router-dom';
import Time from '../modules/time-tool/components/TimeTool';

/**
 * 时间处理工具页面组件
 */
const TimePage: React.FC = () => {
  useParams<{ type?: string }>();

  // 这里可以根据type参数更新时间工具类型状态
  // 目前先简单渲染组件

  return <Time />;
};

export default TimePage;
