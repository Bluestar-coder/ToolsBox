import React, { Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
import type { TimeToolTabKey } from '../modules/time-tool/components/TimeTool';
import ModulePageShell from '../components/ModulePageShell';
import { getValidatedModuleType } from '../modules/catalog';

const LazyTimeTool = lazy(() => import('../modules/time-tool/components/TimeTool'));

/**
 * 时间处理工具页面组件
 */
const TimePage: React.FC = () => {
  const { type } = useParams<{ type?: string }>();
  const initialTab = getValidatedModuleType('time-tool', type) as TimeToolTabKey | undefined;

  return (
    <ModulePageShell moduleId="time-tool">
      <Suspense fallback={null}>
        <LazyTimeTool key={initialTab ?? 'time-default'} initialTab={initialTab} />
      </Suspense>
    </ModulePageShell>
  );
};

export default TimePage;
