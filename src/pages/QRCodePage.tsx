import React, { Suspense, lazy } from 'react';
import { useParams } from 'react-router-dom';
import type { QRCodeToolTabKey } from '../modules/qrcode-tool/components/QRCodeTool';
import ModulePageShell from '../components/ModulePageShell';
import { getValidatedModuleType } from '../modules/catalog';

const LazyQRCodeTool = lazy(() => import('../modules/qrcode-tool/components/QRCodeTool'));

/**
 * 二维码工具页面组件
 */
const QRCodePage: React.FC = () => {
  const { type } = useParams<{ type?: string }>();
  const initialTab = getValidatedModuleType('qrcode-tool', type) as QRCodeToolTabKey | undefined;

  return (
    <ModulePageShell moduleId="qrcode-tool">
      <Suspense fallback={null}>
        <LazyQRCodeTool key={initialTab ?? 'qrcode-default'} initialTab={initialTab} />
      </Suspense>
    </ModulePageShell>
  );
};

export default QRCodePage;
