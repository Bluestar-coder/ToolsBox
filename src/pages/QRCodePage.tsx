import React from 'react';
import { useParams } from 'react-router-dom';
import QRCode from '../modules/qrcode-tool/components/QRCodeTool';
import ModulePageShell from '../components/ModulePageShell';

/**
 * 二维码工具页面组件
 */
const QRCodePage: React.FC = () => {
  useParams<{ type?: string }>();

  // 这里可以根据type参数更新二维码工具类型状态
  // 目前先简单渲染组件

  return (
    <ModulePageShell moduleId="qrcode-tool">
      <QRCode />
    </ModulePageShell>
  );
};

export default QRCodePage;
