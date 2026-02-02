import React from 'react';
import { Card, Space } from 'antd';
import DataManagement from '../components/Settings/DataManagement';
import PluginManagement from '../components/Settings/PluginManagement';

const SettingsPage: React.FC = () => {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      <Card title="数据管理" variant="borderless">
        <DataManagement />
      </Card>
      <Card title="插件管理" variant="borderless">
        <PluginManagement />
      </Card>
    </Space>
  );
};

export default SettingsPage;
