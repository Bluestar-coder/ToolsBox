/**
 * Recipe工具模块入口文件
 */

import React from 'react';
import { DatabaseOutlined } from '@ant-design/icons';
import RecipeTool from './components/RecipeTool';
import type { ToolModule } from '../index';

/**
 * Recipe工具模块
 */
const RecipeToolModule: ToolModule = {
  id: 'recipe-tool',
  name: 'Recipe工具',
  icon: React.createElement(DatabaseOutlined),
  component: RecipeTool,
  description: '基于CyberChef设计理念的操作链式处理工具',
};

export default RecipeToolModule;