import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import {
  categoryItems,
  symmetricTabItems,
  asymmetricTabItems,
  hashTabItems,
  gmTabItems,
} from '../utils/constants';
import {
  SymmetricTab,
  AEADTab,
  RCTab,
  BlowfishTab,
  RSATab,
  ECDSATab,
  Ed25519Tab,
  X25519Tab,
  ECDHTab,
  SM2Tab,
  SM4Tab,
  ZUCTab,
  HashTab,
  SM3Tab,
  KDFTab,
  GMInfoTab,
} from './tabs';

const CryptoTool: React.FC = () => {
  const [activeCategory, setActiveCategory] = useState('symmetric');
  const [activeSubTab, setActiveSubTab] = useState('aes');

  const getSubTabItems = () => {
    switch (activeCategory) {
      case 'symmetric':
        return symmetricTabItems;
      case 'asymmetric':
        return asymmetricTabItems;
      case 'hash':
        return hashTabItems;
      case 'gm':
        return gmTabItems;
      default:
        return symmetricTabItems;
    }
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    // 切换分类时，设置默认子标签
    const defaultTabs: Record<string, string> = {
      symmetric: 'aes',
      asymmetric: 'rsa',
      hash: 'hash',
      gm: 'sm2',
    };
    setActiveSubTab(defaultTabs[category] || 'aes');
  };

  const renderTabContent = () => {
    // 对称加密
    if (['aes', 'des', '3des'].includes(activeSubTab)) {
      return <SymmetricTab activeTab={activeSubTab} />;
    }
    if (['aes-gcm', 'aes-siv', 'chacha20'].includes(activeSubTab)) {
      return <AEADTab activeTab={activeSubTab} />;
    }
    if (activeSubTab === 'rc') {
      return <RCTab />;
    }
    if (activeSubTab === 'blowfish') {
      return <BlowfishTab />;
    }
    // 非对称加密
    switch (activeSubTab) {
      case 'rsa':
        return <RSATab />;
      case 'ecdsa':
        return <ECDSATab />;
      case 'ed25519':
        return <Ed25519Tab />;
      case 'x25519':
        return <X25519Tab />;
      case 'ecdh':
        return <ECDHTab />;
      // 哈希
      case 'hash':
        return <HashTab />;
      case 'sm3':
        return <SM3Tab />;
      case 'kdf':
        return <KDFTab />;
      // 国密
      case 'sm2':
        return <SM2Tab />;
      case 'sm4':
        return <SM4Tab />;
      case 'zuc':
        return <ZUCTab />;
      case 'gm-info':
        return <GMInfoTab />;
      default:
        return <SymmetricTab activeTab="aes" />;
    }
  };

  return (
    <Card title="加密/解密工具" variant="borderless">
      <Tabs
        activeKey={activeCategory}
        onChange={handleCategoryChange}
        items={categoryItems}
        style={{ marginBottom: 8 }}
      />
      <Tabs
        activeKey={activeSubTab}
        onChange={setActiveSubTab}
        items={getSubTabItems()}
        size="small"
        style={{ marginBottom: 16 }}
      />
      {renderTabContent()}
    </Card>
  );
};

export default CryptoTool;
