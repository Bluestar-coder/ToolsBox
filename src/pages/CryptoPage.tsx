import React, { Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
import type { CryptoToolProps } from '../modules/crypto-tool/components/CryptoTool';
import ModulePageShell from '../components/ModulePageShell';
import { getValidatedModuleType } from '../modules/catalog';

const LazyCryptoTool = lazy(() => import('../modules/crypto-tool/components/CryptoTool'));

/**
 * 加密/解密工具页面组件
 */
const CryptoPage: React.FC = () => {
  const { type } = useParams<{ type?: string }>();
  const initialType = getValidatedModuleType('crypto-tool', type) as CryptoToolProps['initialType'];

  return (
    <ModulePageShell moduleId="crypto-tool">
      <Suspense fallback={null}>
        <LazyCryptoTool key={initialType ?? 'crypto-default'} initialType={initialType} />
      </Suspense>
    </ModulePageShell>
  );
};

export default CryptoPage;
