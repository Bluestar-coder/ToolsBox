import React, { useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { DiffTool } from '../modules/diff-tool/components/DiffTool';

/**
 * 差异对比工具页面组件
 */
const DiffPage: React.FC = () => {
  return <DiffTool />;
};

export default DiffPage;
