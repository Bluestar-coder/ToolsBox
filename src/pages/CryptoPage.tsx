import React from 'react';
import { useParams } from 'react-router-dom';
import Crypto from '../modules/crypto-tool/components/CryptoTool';
import ModulePageShell from '../components/ModulePageShell';
import { getValidatedModuleType } from '../modules/catalog';

/**
 * 加密/解密工具页面组件
 */
const CryptoPage: React.FC = () => {
  const { type } = useParams<{ type?: string }>();
  const initialType = getValidatedModuleType('crypto-tool', type);

  return (
    <ModulePageShell moduleId="crypto-tool">
      <Crypto key={initialType ?? 'crypto-default'} initialType={initialType} />
    </ModulePageShell>
  );
};

export default CryptoPage;
