import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { tabItems } from '../utils/constants';
import {
  SymmetricTab,
  AEADTab,
  SM2Tab,
  SM4Tab,
  ZUCTab,
  HashTab,
  SM3Tab,
  GMInfoTab,
} from './tabs';

const CryptoTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState('aes');

  const isSymmetricTab = ['aes', 'des', '3des'].includes(activeTab);
  const isAeadTab = ['aes-gcm', 'aes-siv', 'chacha20'].includes(activeTab);

  const renderTabContent = () => {
    if (isSymmetricTab) {
      return <SymmetricTab activeTab={activeTab} />;
    }
    if (isAeadTab) {
      return <AEADTab activeTab={activeTab} />;
    }
    switch (activeTab) {
      case 'sm2':
        return <SM2Tab />;
      case 'sm4':
        return <SM4Tab />;
      case 'zuc':
        return <ZUCTab />;
      case 'hash':
        return <HashTab />;
      case 'sm3':
        return <SM3Tab />;
      case 'gm-info':
        return <GMInfoTab />;
      default:
        return <SymmetricTab activeTab="aes" />;
    }
  };

  return (
    <Card title="加密/解密工具" bordered={false}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginBottom: 16 }}
      />
      {renderTabContent()}
    </Card>
  );
};

export default CryptoTool;
