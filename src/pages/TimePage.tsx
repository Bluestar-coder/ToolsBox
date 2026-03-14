import React from 'react';
import { useParams } from 'react-router-dom';
import Time, { type TimeToolTabKey } from '../modules/time-tool/components/TimeTool';
import ModulePageShell from '../components/ModulePageShell';
import { getValidatedModuleType } from '../modules/catalog';

/**
 * 时间处理工具页面组件
 */
const TimePage: React.FC = () => {
  const { type } = useParams<{ type?: string }>();
  const initialTab = getValidatedModuleType('time-tool', type) as TimeToolTabKey | undefined;

  return (
    <ModulePageShell moduleId="time-tool">
      <Time key={initialTab ?? 'time-default'} initialTab={initialTab} />
    </ModulePageShell>
  );
};

export default TimePage;
