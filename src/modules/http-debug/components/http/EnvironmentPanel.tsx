import React from 'react';
import {
  Select,
  Button,
  Input,
  Switch,
  Space,
  Empty,
  Popconfirm,
  Typography,
} from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { Environment, KeyValuePair } from '../../utils/types';

const { Text } = Typography;

interface EnvironmentPanelProps {
  environments: Environment[];
  activeEnvId: string | null;
  onEnvironmentsChange: (environments: Environment[]) => void;
  onActiveEnvChange: (id: string | null) => void;
}

const EnvironmentPanel: React.FC<EnvironmentPanelProps> = ({
  environments,
  activeEnvId,
  onEnvironmentsChange,
  onActiveEnvChange,
}) => {
  const { t } = useTranslation();

  const activeEnv = environments.find((e) => e.id === activeEnvId) ?? null;

  const addEnvironment = () => {
    const newEnv: Environment = {
      id: crypto.randomUUID(),
      name: `${t('modules.httpDebug.newEnvironment', 'New Environment')} ${environments.length + 1}`,
      variables: [],
    };
    const updated = [...environments, newEnv];
    onEnvironmentsChange(updated);
    onActiveEnvChange(newEnv.id);
  };

  const deleteEnvironment = () => {
    if (!activeEnvId) return;
    const updated = environments.filter((e) => e.id !== activeEnvId);
    onEnvironmentsChange(updated);
    onActiveEnvChange(updated.length > 0 ? updated[0].id : null);
  };

  const updateActiveEnv = (partial: Partial<Environment>) => {
    if (!activeEnvId) return;
    const updated = environments.map((e) =>
      e.id === activeEnvId ? { ...e, ...partial } : e,
    );
    onEnvironmentsChange(updated);
  };

  const updateVariable = (index: number, field: keyof KeyValuePair, value: string | boolean) => {
    if (!activeEnv) return;
    const variables = [...activeEnv.variables];
    variables[index] = { ...variables[index], [field]: value };
    updateActiveEnv({ variables });
  };

  const addVariable = () => {
    if (!activeEnv) return;
    updateActiveEnv({
      variables: [...activeEnv.variables, { key: '', value: '', enabled: true }],
    });
  };

  const removeVariable = (index: number) => {
    if (!activeEnv) return;
    updateActiveEnv({
      variables: activeEnv.variables.filter((_, i) => i !== index),
    });
  };

  const envOptions = environments.map((e) => ({ value: e.id, label: e.name }));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong>{t('modules.httpDebug.environments', '环境变量')}</Text>
        <Space size="small">
          <Button type="dashed" icon={<PlusOutlined />} size="small" onClick={addEnvironment}>
            {t('modules.httpDebug.addEnvironment', '新建环境')}
          </Button>
          {activeEnvId && (
            <Popconfirm
              title={t('modules.httpDebug.deleteEnvConfirm', '确定删除当前环境？')}
              onConfirm={deleteEnvironment}
              okText={t('modules.httpDebug.confirm', '确定')}
              cancelText={t('modules.httpDebug.cancel', '取消')}
            >
              <Button type="text" danger icon={<DeleteOutlined />} size="small" />
            </Popconfirm>
          )}
        </Space>
      </div>

      {environments.length === 0 ? (
        <Empty
          description={t('modules.httpDebug.noEnvironments', '暂无环境，点击"新建环境"创建')}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <>
          <Select
            value={activeEnvId}
            onChange={onActiveEnvChange}
            options={envOptions}
            placeholder={t('modules.httpDebug.selectEnvironment', '选择环境')}
            style={{ width: '100%', marginBottom: 12 }}
          />

          {activeEnv && (
            <>
              <Input
                value={activeEnv.name}
                onChange={(e) => updateActiveEnv({ name: e.target.value })}
                placeholder={t('modules.httpDebug.envNamePlaceholder', '环境名称')}
                style={{ marginBottom: 12 }}
                size="small"
              />

              {activeEnv.variables.map((variable, index) => (
                <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="center">
                  <Switch
                    size="small"
                    checked={variable.enabled}
                    onChange={(checked) => updateVariable(index, 'enabled', checked)}
                  />
                  <Input
                    placeholder={t('modules.httpDebug.variableKeyPlaceholder', 'Variable Name')}
                    value={variable.key}
                    onChange={(e) => updateVariable(index, 'key', e.target.value)}
                    style={{ width: 180 }}
                    size="small"
                  />
                  <Input
                    placeholder={t('modules.httpDebug.variableValuePlaceholder', 'Variable Value')}
                    value={variable.value}
                    onChange={(e) => updateVariable(index, 'value', e.target.value)}
                    style={{ width: 260 }}
                    size="small"
                  />
                  <Button
                    type="text"
                    danger
                    icon={<DeleteOutlined />}
                    onClick={() => removeVariable(index)}
                    size="small"
                  />
                </Space>
              ))}

              <Button type="dashed" onClick={addVariable} icon={<PlusOutlined />} size="small">
                {t('modules.httpDebug.addVariable', '添加变量')}
              </Button>
            </>
          )}
        </>
      )}
    </div>
  );
};

export default EnvironmentPanel;
