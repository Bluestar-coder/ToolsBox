import React, { useState } from 'react';
import { Card, Tabs } from 'antd';
import { TestTab, ReplaceTab, SplitTab } from './tabs';

const tabItems = [
  { key: 'test', label: '正则测试', children: <TestTab /> },
  { key: 'replace', label: '替换', children: <ReplaceTab /> },
  { key: 'split', label: '分割', children: <SplitTab /> },
];

const RegexTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState('test');

  return (
    <Card title="正则表达式工具" bordered={false}>
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        style={{ marginBottom: 8 }}
      />
    </Card>
  );
};

export default RegexTool;
