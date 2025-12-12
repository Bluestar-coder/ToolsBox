import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { useAppContext } from '../../../hooks/useAppContext';
import { categoryItems, baseEncoders, otherEncoders } from '../utils/constants';
import { EncodingTab, RadixTab, ImageTab } from './tabs';

const EncoderDecoder: React.FC = () => {
  const { dispatch, state } = useAppContext();
  const [activeCategory, setActiveCategory] = useState<string>('base');

  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    if (category === 'base' || category === 'other') {
      const encoders = category === 'base' ? baseEncoders : otherEncoders;
      if (!encoders.includes(state.currentType as typeof encoders[number])) {
        dispatch({ type: 'SET_CURRENT_TYPE', payload: encoders[0] });
      }
    }
  };

  const renderContent = () => {
    switch (activeCategory) {
      case 'base':
        return <EncodingTab activeCategory="base" />;
      case 'other':
        return <EncodingTab activeCategory="other" />;
      case 'radix':
        return <RadixTab />;
      case 'image':
        return <ImageTab />;
      default:
        return <EncodingTab activeCategory="base" />;
    }
  };

  return (
    <Card title="编码/解码工具" bordered={false}>
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
