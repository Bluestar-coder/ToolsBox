import React from 'react';
import { useParams } from 'react-router-dom';
import QRCode, { type QRCodeToolTabKey } from '../modules/qrcode-tool/components/QRCodeTool';
import ModulePageShell from '../components/ModulePageShell';
import { getValidatedModuleType } from '../modules/catalog';

/**
 * 二维码工具页面组件
 */
const QRCodePage: React.FC = () => {
  const { type } = useParams<{ type?: string }>();
  const initialTab = getValidatedModuleType('qrcode-tool', type) as QRCodeToolTabKey | undefined;

  return (
    <ModulePageShell moduleId="qrcode-tool">
      <QRCode key={initialTab ?? 'qrcode-default'} initialTab={initialTab} />
    </ModulePageShell>
  );
};

export default QRCodePage;
