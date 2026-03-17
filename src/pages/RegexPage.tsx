import React, { Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
import type { RegexToolTabKey } from '../modules/regex-tool/components/RegexTool';
import ModulePageShell from '../components/ModulePageShell';
import { getValidatedModuleType } from '../modules/catalog';

const LazyRegexTool = lazy(() => import('../modules/regex-tool/components/RegexTool'));

/**
 * 正则表达式工具页面组件
 */
const RegexPage: React.FC = () => {
  const { type } = useParams<{ type?: string }>();
  const initialTab = getValidatedModuleType('regex-tool', type) as RegexToolTabKey | undefined;

  return (
    <ModulePageShell moduleId="regex-tool">
      <Suspense fallback={null}>
        <LazyRegexTool key={initialTab ?? 'regex-default'} initialTab={initialTab} />
      </Suspense>
    </ModulePageShell>
  );
};

export default RegexPage;
