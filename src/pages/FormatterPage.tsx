import React, { Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
import type { CodeFormatterTabKey } from '../modules/code-formatter/components/CodeFormatter';
import ModulePageShell from '../components/ModulePageShell';
import { getValidatedModuleType } from '../modules/catalog';

const LazyCodeFormatter = lazy(() => import('../modules/code-formatter/components/CodeFormatter'));

/**
 * 代码格式化工具页面组件
 */
const FormatterPage: React.FC = () => {
  const { type } = useParams<{ type?: string }>();
  const initialTab = getValidatedModuleType('code-formatter', type) as CodeFormatterTabKey | undefined;

  return (
    <ModulePageShell moduleId="code-formatter">
      <Suspense fallback={null}>
        <LazyCodeFormatter key={initialTab ?? 'formatter-default'} initialTab={initialTab} />
      </Suspense>
    </ModulePageShell>
  );
};

export default FormatterPage;
