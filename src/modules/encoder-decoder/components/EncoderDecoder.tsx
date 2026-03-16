import React, { Suspense, lazy, useEffect, useState } from 'react';
import { Card, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { useEncodingContext } from '../../../hooks/useEncodingContext';
import { baseEncoders, utfEncoders, otherEncoders } from '../utils/constants';

const EncodingTab = lazy(() => import('./tabs/EncodingTab'));
const RadixTab = lazy(() => import('./tabs/RadixTab'));
const ImageTab = lazy(() => import('./tabs/ImageTab'));
const SmartDecodeTab = lazy(() => import('./tabs/SmartDecodeTab'));

export type EncoderCategoryKey = 'smart' | 'base' | 'utf' | 'other' | 'radix' | 'image';

interface EncoderDecoderProps {
  initialCategory?: EncoderCategoryKey;
}

const EncoderDecoder: React.FC<EncoderDecoderProps> = ({ initialCategory = 'smart' }) => {
  const { t } = useTranslation();
  const { dispatch, state } = useEncodingContext();
  const [activeCategory, setActiveCategory] = useState<EncoderCategoryKey>(initialCategory);

  useEffect(() => {
    setActiveCategory(initialCategory);
  }, [initialCategory]);

  const categoryItems = [
    { key: 'smart', label: t('modules.encoder.categories.smart') },
    { key: 'base', label: t('modules.encoder.categories.base') },
    { key: 'utf', label: t('modules.encoder.categories.utf') },
    { key: 'other', label: t('modules.encoder.categories.other') },
    { key: 'radix', label: t('modules.encoder.categories.radix') },
    { key: 'image', label: t('modules.encoder.categories.image') },
  ];

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category as EncoderCategoryKey);
    if (category === 'base' || category === 'utf' || category === 'other') {
      const encoders = category === 'base' ? baseEncoders : category === 'utf' ? utfEncoders : otherEncoders;
      if (!encoders.includes(state.currentType as typeof encoders[number])) {
        dispatch({ type: 'SET_CURRENT_TYPE', payload: encoders[0] });
      }
    }
  };

  const renderContent = () => {
    switch (activeCategory) {
      case 'smart':
        return <SmartDecodeTab />;
      case 'base':
        return <EncodingTab activeCategory="base" />;
      case 'utf':
        return <EncodingTab activeCategory="utf" />;
      case 'other':
        return <EncodingTab activeCategory="other" />;
      case 'radix':
        return <RadixTab />;
      case 'image':
        return <ImageTab />;
      default:
        return <SmartDecodeTab />;
    }
  };

  return (
    <Card title={t('modules.encoder.title')} variant="borderless">
      <Tabs
        activeKey={activeCategory}
        onChange={handleCategoryChange}
        items={categoryItems}
        style={{ marginBottom: 8 }}
      />
      <Suspense fallback={null}>
        {renderContent()}
      </Suspense>
    </Card>
  );
};

export default EncoderDecoder;
