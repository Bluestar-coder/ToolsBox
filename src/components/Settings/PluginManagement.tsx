import React, { useState } from 'react';
import { Button, Input, Space, Card, List, Tag, message } from 'antd';
import type { PluginConfig, PluginMetadata } from '../../plugins/types';
import { usePluginContext } from '../../hooks/usePluginContext';

const emptyConfig: PluginConfig = {
  name: '',
  version: '1.0.0',
  description: '',
  author: '',
  entryPoint: '',
  permissions: [],
  dependencies: [],
};

const statusColor = (status: PluginMetadata['status']) => {
  switch (status) {
    case 'enabled':
      return 'green';
    case 'disabled':
      return 'orange';
    case 'error':
      return 'red';
    default:
      return 'default';
  }
};

const PluginManagement: React.FC = () => {
  const { state, loadPlugin, enablePlugin, disablePlugin, unloadPlugin } = usePluginContext();
  const [config, setConfig] = useState<PluginConfig>(emptyConfig);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const updateField = <K extends keyof PluginConfig>(key: K, value: PluginConfig[K]) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleLoad = async () => {
    if (!config.name || !config.version || !config.entryPoint) {
      message.warning('请填写插件名称、版本与入口地址');
      return;
    }
    setSubmitting(true);
    try {
      const result = await loadPlugin(config);
      if (result.success) {
        message.success('插件加载成功');
        setConfig(emptyConfig);
      } else {
        message.error(result.error || '插件加载失败');
      }
    } catch (error) {
      message.error(error instanceof Error ? error.message : '插件加载失败');
    } finally {
      setSubmitting(false);
    }
  };

  const handleToggle = async (plugin: PluginMetadata) => {
    setLoadingId(plugin.id);
    try {
      if (plugin.status === 'enabled') {
        await disablePlugin(plugin.id);
      } else {
        await enablePlugin(plugin.id);
      }
    } finally {
      setLoadingId(null);
    }
  };

  const handleUnload = async (plugin: PluginMetadata) => {
    setLoadingId(plugin.id);
    try {
      await unloadPlugin(plugin.id);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <Card size="small" title="加载插件">
        <Space direction="vertical" style={{ width: '100%' }} size="small">
          <Input
            placeholder="插件名称"
            value={config.name}
            onChange={(e) => updateField('name', e.target.value)}
          />
          <Input
            placeholder="版本号 (例如 1.0.0)"
            value={config.version}
            onChange={(e) => updateField('version', e.target.value)}
          />
          <Input
            placeholder="入口地址 (如 /plugins/demo/index.ts)"
            value={config.entryPoint}
            onChange={(e) => updateField('entryPoint', e.target.value)}
          />
          <Input
            placeholder="作者 (可选)"
            value={config.author}
            onChange={(e) => updateField('author', e.target.value)}
          />
          <Input
            placeholder="插件描述 (可选)"
            value={config.description}
            onChange={(e) => updateField('description', e.target.value)}
          />
          <Input
            placeholder="权限 (逗号分隔，如 storage,network)"
            value={config.permissions.join(',')}
            onChange={(e) =>
              updateField(
                'permissions',
                e.target.value.split(',').map((p) => p.trim()).filter(Boolean)
              )
            }
          />
          <Button type="primary" onClick={handleLoad} loading={submitting}>
            加载插件
          </Button>
        </Space>
      </Card>

      <Card size="small" title="已加载插件">
        <List
          locale={{ emptyText: '暂无插件' }}
          dataSource={state.list}
          renderItem={(plugin) => (
            <List.Item
              actions={[
                <Button
                  key="toggle"
                  size="small"
                  onClick={() => handleToggle(plugin)}
                  loading={loadingId === plugin.id}
                >
                  {plugin.status === 'enabled' ? '禁用' : '启用'}
                </Button>,
                <Button
                  key="unload"
                  size="small"
                  danger
                  onClick={() => handleUnload(plugin)}
                  loading={loadingId === plugin.id}
                >
                  卸载
                </Button>,
              ]}
            >
              <List.Item.Meta
                title={
                  <Space>
                    <span>{plugin.config.name}@{plugin.config.version}</span>
                    <Tag color={statusColor(plugin.status)}>{plugin.status}</Tag>
                  </Space>
                }
                description={
                  <div>
                    <div>入口: {plugin.config.entryPoint}</div>
                    {plugin.error && <div style={{ color: '#ff4d4f' }}>错误: {plugin.error}</div>}
                  </div>
                }
              />
            </List.Item>
          )}
        />
      </Card>
    </Space>
  );
};

export default PluginManagement;
