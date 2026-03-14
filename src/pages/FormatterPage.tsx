import React from 'react';
import { useParams } from 'react-router-dom';
import CodeFormatter, { type CodeFormatterTabKey } from '../modules/code-formatter/components/CodeFormatter';
import ModulePageShell from '../components/ModulePageShell';
import { getValidatedModuleType } from '../modules/catalog';

/**
 * 代码格式化工具页面组件
 */
const FormatterPage: React.FC = () => {
  const { type } = useParams<{ type?: string }>();
  const initialTab = getValidatedModuleType('code-formatter', type) as CodeFormatterTabKey | undefined;

  return (
    <ModulePageShell moduleId="code-formatter">
      <CodeFormatter key={initialTab ?? 'formatter-default'} initialTab={initialTab} />
    </ModulePageShell>
  );
};

export default FormatterPage;
