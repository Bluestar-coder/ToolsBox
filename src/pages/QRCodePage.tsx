import React from 'react';
import { useParams } from 'react-router-dom';
import QRCode from '../modules/qrcode-tool/components/QRCodeTool';

/**
 * 二维码工具页面组件
 */
const QRCodePage: React.FC = () => {
  useParams<{ type?: string }>();

  // 这里可以根据type参数更新二维码工具类型状态
  // 目前先简单渲染组件

  return <QRCode />;
};

export default QRCodePage;
