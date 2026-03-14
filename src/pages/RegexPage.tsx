import React from 'react';
import { useParams } from 'react-router-dom';
import Regex, { type RegexToolTabKey } from '../modules/regex-tool/components/RegexTool';
import ModulePageShell from '../components/ModulePageShell';
import { getValidatedModuleType } from '../modules/catalog';

/**
 * 正则表达式工具页面组件
 */
const RegexPage: React.FC = () => {
  const { type } = useParams<{ type?: string }>();
  const initialTab = getValidatedModuleType('regex-tool', type) as RegexToolTabKey | undefined;

  return (
    <ModulePageShell moduleId="regex-tool">
      <Regex key={initialTab ?? 'regex-default'} initialTab={initialTab} />
    </ModulePageShell>
  );
};

export default RegexPage;
