import React, { Suspense, lazy, useState } from 'react';
import { Card, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import {
  categoryItems,
  symmetricTabItems,
  asymmetricTabItems,
  hashTabItems,
  classicalTabItems,
  gmTabItems,
} from '../utils/constants';

const SymmetricTab = lazy(() => import('./tabs/SymmetricTab'));
const AEADTab = lazy(() => import('./tabs/AEADTab'));
const RCTab = lazy(() => import('./tabs/RCTab'));
const BlowfishTab = lazy(() => import('./tabs/BlowfishTab'));
const RSATab = lazy(() => import('./tabs/RSATab'));
const ECDSATab = lazy(() => import('./tabs/ECDSATab'));
const Ed25519Tab = lazy(() => import('./tabs/Ed25519Tab'));
const X25519Tab = lazy(() => import('./tabs/X25519Tab'));
const ECDHTab = lazy(() => import('./tabs/ECDHTab'));
const SM2Tab = lazy(() => import('./tabs/SM2Tab'));
const SM4Tab = lazy(() => import('./tabs/SM4Tab'));
const ZUCTab = lazy(() => import('./tabs/ZUCTab'));
const HashTab = lazy(() => import('./tabs/HashTab'));
const SM3Tab = lazy(() => import('./tabs/SM3Tab'));
const KDFTab = lazy(() => import('./tabs/KDFTab'));
const ClassicalTab = lazy(() => import('./tabs/ClassicalTab'));
const GMInfoTab = lazy(() => import('./tabs/GMInfoTab'));
const JWTTab = lazy(() => import('./tabs/JWTTab'));
const OpenSSLTab = lazy(() => import('./tabs/OpenSSLTab'));

const cryptoCategoryDefaults: Record<string, string> = {
  symmetric: 'aes',
  asymmetric: 'rsa',
  hash: 'hash',
  classical: 'substitute',
  gm: 'sm2',
  jwt: 'jwt',
};

const cryptoCategoryBySubTab: Record<string, string> = {
  aes: 'symmetric',
  des: 'symmetric',
  '3des': 'symmetric',
  'aes-gcm': 'symmetric',
  'aes-siv': 'symmetric',
  chacha20: 'symmetric',
  rc: 'symmetric',
  blowfish: 'symmetric',
  openssl: 'symmetric',
  rsa: 'asymmetric',
  ecdsa: 'asymmetric',
  ed25519: 'asymmetric',
  x25519: 'asymmetric',
  ecdh: 'asymmetric',
  hash: 'hash',
  sm3: 'hash',
  kdf: 'hash',
  substitute: 'classical',
  transpose: 'classical',
  encode: 'classical',
  sm2: 'gm',
  sm4: 'gm',
  zuc: 'gm',
  'gm-info': 'gm',
};

export interface CryptoToolState {
  category: string;
  subTab: string;
}

interface CryptoToolProps {
  initialType?: string;
}

function resolveCryptoState(initialType: string | undefined): CryptoToolState {
  if (!initialType) {
    return { category: 'symmetric', subTab: 'aes' };
  }

  if (initialType in cryptoCategoryDefaults) {
    return {
      category: initialType,
      subTab: cryptoCategoryDefaults[initialType],
    };
  }

  const category = cryptoCategoryBySubTab[initialType];
  if (category) {
    return { category, subTab: initialType };
  }

  return { category: 'symmetric', subTab: 'aes' };
}

const CryptoTool: React.FC<CryptoToolProps> = ({ initialType }) => {
  const { t } = useTranslation();
  const initialState = resolveCryptoState(initialType);
  const [activeCategory, setActiveCategory] = useState(() => initialState.category);
  const [activeSubTab, setActiveSubTab] = useState(() => initialState.subTab);

  const localizedCategoryItems = [
    { key: 'symmetric', label: t('modules.crypto.tabs.symmetric', categoryItems[0].label) },
    { key: 'asymmetric', label: t('modules.crypto.tabs.asymmetric', categoryItems[1].label) },
    { key: 'hash', label: t('modules.crypto.tabs.hash', categoryItems[2].label) },
    { key: 'jwt', label: t('modules.crypto.tabs.jwt', categoryItems[3].label) },
    { key: 'classical', label: t('modules.crypto.tabs.classical', categoryItems[4].label) },
    { key: 'gm', label: t('modules.crypto.tabs.gm', categoryItems[5].label) },
  ];

  const getSubTabItems = () => {
    switch (activeCategory) {
      case 'symmetric':
        return symmetricTabItems;
      case 'asymmetric':
        return asymmetricTabItems;
      case 'hash':
        return hashTabItems;
      case 'classical':
        return classicalTabItems;
      case 'gm':
        return gmTabItems;
      case 'jwt':
        return null; // JWT 没有子标签
      default:
        return symmetricTabItems;
    }
  };

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    // 切换分类时，设置默认子标签
    setActiveSubTab(cryptoCategoryDefaults[category] || 'aes');
  };

  const renderTabContent = () => {
    // JWT
    if (activeCategory === 'jwt') {
      return <JWTTab />;
    }
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
    if (activeSubTab === 'openssl') {
      return <OpenSSLTab />;
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
      // 古典密码
      case 'substitute':
      case 'transpose':
      case 'encode':
        return <ClassicalTab activeTab={activeSubTab} />;
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

  const subTabItems = getSubTabItems();

  return (
    <Card title={t('modules.crypto.title')} variant="borderless">
      <Tabs
        activeKey={activeCategory}
        onChange={handleCategoryChange}
        items={localizedCategoryItems}
        style={{ marginBottom: 8 }}
      />
      {subTabItems && (
        <Tabs
          activeKey={activeSubTab}
          onChange={setActiveSubTab}
          items={subTabItems}
          size="small"
          style={{ marginBottom: 16 }}
        />
      )}
      <Suspense fallback={null}>
        {renderTabContent()}
      </Suspense>
    </Card>
  );
};

export default CryptoTool;
