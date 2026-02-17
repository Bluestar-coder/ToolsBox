import React from 'react';
import { DiffOutlined } from '@ant-design/icons';
import { DiffTool } from './components/DiffTool';
import type { ToolModule } from '../index';

const diffModule: ToolModule = {
  id: 'diff-tool',
  name: 'Diff Tool',
  icon: <DiffOutlined />,
  component: DiffTool,
  description: 'Compare text, code, or JSON files to find differences.',
};

export default diffModule;
