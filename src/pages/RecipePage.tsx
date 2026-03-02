/**
 * Recipe工具页面组件
 */

import React from 'react';
import { useParams } from 'react-router-dom';
import RecipeTool from '../modules/recipe-tool/components/RecipeTool';

/**
 * Recipe工具页面
 */
const RecipePage: React.FC = () => {
  const { type } = useParams<{ type?: string }>();

  return <RecipeTool toolId={type} />;
};

export default RecipePage;