/**
 * Recipe工具页面组件
 */

import React from 'react';
import RecipeTool from '../modules/recipe-tool/components/RecipeTool';
import ModulePageShell from '../components/ModulePageShell';

/**
 * Recipe工具页面
 */
const RecipePage: React.FC = () => {
  return (
    <ModulePageShell moduleId="recipe-tool">
      <RecipeTool />
    </ModulePageShell>
  );
};

export default RecipePage;
