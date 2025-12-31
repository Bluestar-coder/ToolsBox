import React from 'react';
import { useParams } from 'react-router-dom';
import Crypto from '../modules/crypto-tool/components/CryptoTool';

/**
 * 加密/解密工具页面组件
 */
const CryptoPage: React.FC = () => {
  useParams<{ type?: string }>();

  // 这里可以根据type参数更新加密类型状态
  // 目前先简单渲染组件

  return <Crypto />;
};

export default CryptoPage;
