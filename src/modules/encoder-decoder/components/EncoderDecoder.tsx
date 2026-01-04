import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { useTranslation } from 'react-i18next';
import { useAppContext } from '../../../hooks/useAppContext';
import { baseEncoders, utfEncoders, otherEncoders } from '../utils/constants';
import { EncodingTab, RadixTab, ImageTab, SmartDecodeTab } from './tabs';

const EncoderDecoder: React.FC = () => {
  const { t } = useTranslation();
  const { dispatch, state } = useAppContext();
  const [activeCategory, setActiveCategory] = useState<string>('smart');

  const categoryItems = [
    { key: 'smart', label: t('modules.encoder.categories.smart') },
    { key: 'base', label: t('modules.encoder.categories.base') },
    { key: 'utf', label: t('modules.encoder.categories.utf') },
    { key: 'other', label: t('modules.encoder.categories.other') },
    { key: 'radix', label: t('modules.encoder.categories.radix') },
    { key: 'image', label: t('modules.encoder.categories.image') },
  ];

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
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
      {renderContent()}
    </Card>
  );
};

export default EncoderDecoder;
