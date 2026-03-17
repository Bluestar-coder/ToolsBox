/**
 * Recipe工具页面组件
 */

import React, { Suspense, lazy } from 'react';
import ModulePageShell from '../components/ModulePageShell';

const LazyRecipeTool = lazy(() => import('../modules/recipe-tool/components/RecipeTool'));

/**
 * Recipe工具页面
 */
const RecipePage: React.FC = () => {
  return (
    <ModulePageShell moduleId="recipe-tool">
      <Suspense fallback={null}>
        <LazyRecipeTool />
      </Suspense>
    </ModulePageShell>
  );
};

export default RecipePage;
