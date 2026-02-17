import React from 'react';
import {
  Select,
  Input,
  Button,
  Tabs,
  Radio,
  Space,
  Switch,
} from 'antd';
import {
  SendOutlined,
  PlusOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type {
  HttpRequestConfig,
  HttpMethod,
  BodyType,
  KeyValuePair,
} from '../../utils/types';
import { isValidHttpUrl, isValidHexString } from '../../utils/validators';

const { TextArea } = Input;

interface RequestBuilderProps {
  config: HttpRequestConfig;
  onChange: (config: HttpRequestConfig) => void;
  onSend: () => void;
  loading: boolean;
}

const HTTP_METHODS: { value: HttpMethod; label: string }[] = [
  { value: 'GET', label: 'GET' },
  { value: 'POST', label: 'POST' },
  { value: 'PUT', label: 'PUT' },
  { value: 'DELETE', label: 'DELETE' },
  { value: 'PATCH', label: 'PATCH' },
  { value: 'HEAD', label: 'HEAD' },
  { value: 'OPTIONS', label: 'OPTIONS' },
];

const BODY_TYPES: { value: BodyType; label: string }[] = [
  { value: 'none', label: 'None' },
  { value: 'json', label: 'JSON' },
  { value: 'form', label: 'Form' },
  { value: 'multipart', label: 'Multipart' },
  { value: 'raw', label: 'Raw' },
  { value: 'binary', label: 'Binary' },
];

const RequestBuilder: React.FC<RequestBuilderProps> = ({
  config,
  onChange,
  onSend,
  loading,
}) => {
  const { t } = useTranslation();
  const urlValid = isValidHttpUrl(config.url);
  const canSend = urlValid && !loading;

  const updateConfig = (partial: Partial<HttpRequestConfig>) => {
    onChange({ ...config, ...partial });
  };

  const updateHeader = (index: number, field: keyof KeyValuePair, value: string | boolean) => {
    const headers = [...config.headers];
    headers[index] = { ...headers[index], [field]: value };
    updateConfig({ headers });
  };

  const addHeader = () => {
    updateConfig({
      headers: [...config.headers, { key: '', value: '', enabled: true }],
    });
  };

  const removeHeader = (index: number) => {
    updateConfig({
      headers: config.headers.filter((_, i) => i !== index),
    });
  };

  const updateFormData = (index: number, field: keyof KeyValuePair, value: string | boolean) => {
    const formData = [...(config.formData || [])];
    formData[index] = { ...formData[index], [field]: value };
    updateConfig({ formData });
  };

  const addFormData = () => {
    updateConfig({
      formData: [...(config.formData || []), { key: '', value: '', enabled: true }],
    });
  };

  const removeFormData = (index: number) => {
    updateConfig({
      formData: (config.formData || []).filter((_, i) => i !== index),
    });
  };

  const renderKeyValueEditor = (
    items: KeyValuePair[],
    onUpdate: (index: number, field: keyof KeyValuePair, value: string | boolean) => void,
    onAdd: () => void,
    onRemove: (index: number) => void,
    keyPlaceholder: string,
    valuePlaceholder: string,
  ) => (
    <div>
      {items.map((item, index) => (
        <Space key={index} style={{ display: 'flex', marginBottom: 8 }} align="center">
          <Switch
            size="small"
            checked={item.enabled}
            onChange={(checked) => onUpdate(index, 'enabled', checked)}
          />
          <Input
            placeholder={keyPlaceholder}
            value={item.key}
            onChange={(e) => onUpdate(index, 'key', e.target.value)}
            style={{ width: 200 }}
          />
          <Input
            placeholder={valuePlaceholder}
            value={item.value}
            onChange={(e) => onUpdate(index, 'value', e.target.value)}
            style={{ width: 300 }}
          />
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            onClick={() => onRemove(index)}
          />
        </Space>
      ))}
      <Button type="dashed" onClick={onAdd} icon={<PlusOutlined />} size="small">
        {t('modules.httpDebug.addItem', '添加')}
      </Button>
    </div>
  );

  const renderBodyEditor = () => {
    switch (config.bodyType) {
      case 'none':
        return null;
      case 'json':
        return (
          <TextArea
            value={config.body}
            onChange={(e) => updateConfig({ body: e.target.value })}
            placeholder='{"key": "value"}'
            autoSize={{ minRows: 6, maxRows: 20 }}
            style={{ fontFamily: 'monospace' }}
          />
        );
      case 'form':
      case 'multipart':
        return renderKeyValueEditor(
          config.formData || [],
          updateFormData,
          addFormData,
          removeFormData,
          t('modules.httpDebug.keyPlaceholder', 'Key'),
          t('modules.httpDebug.valuePlaceholder', 'Value'),
        );
      case 'raw':
        return (
          <TextArea
            value={config.body}
            onChange={(e) => updateConfig({ body: e.target.value })}
            placeholder={t('modules.httpDebug.rawBodyPlaceholder', '输入原始请求体...')}
            autoSize={{ minRows: 6, maxRows: 20 }}
          />
        );
      case 'binary':
        return (
          <div>
            <TextArea
              value={config.body}
              onChange={(e) => updateConfig({ body: e.target.value })}
              placeholder={t('modules.httpDebug.binaryPlaceholder', '输入十六进制字符串，如: 48656c6c6f')}
              autoSize={{ minRows: 4, maxRows: 10 }}
              style={{ fontFamily: 'monospace' }}
              status={config.body && !isValidHexString(config.body) ? 'error' : undefined}
            />
            {config.body && !isValidHexString(config.body) && (
              <div style={{ color: 'var(--ant-color-error)', fontSize: 12, marginTop: 4 }}>
                {t('modules.httpDebug.invalidHex', '请输入有效的十六进制字符串（偶数长度，仅含 0-9, a-f）')}
              </div>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  const tabItems = [
    {
      key: 'headers',
      label: t('modules.httpDebug.headers', 'Headers'),
      children: renderKeyValueEditor(
        config.headers,
        updateHeader,
        addHeader,
        removeHeader,
        t('modules.httpDebug.headerKeyPlaceholder', 'Header Name'),
        t('modules.httpDebug.headerValuePlaceholder', 'Header Value'),
      ),
    },
    {
      key: 'body',
      label: t('modules.httpDebug.body', 'Body'),
      children: (
        <div>
          <Radio.Group
            value={config.bodyType}
            onChange={(e) => updateConfig({ bodyType: e.target.value })}
            style={{ marginBottom: 12 }}
          >
            {BODY_TYPES.map((bt) => (
              <Radio.Button key={bt.value} value={bt.value}>
                {bt.label}
              </Radio.Button>
            ))}
          </Radio.Group>
          {renderBodyEditor()}
        </div>
      ),
    },
  ];

  return (
    <div>
      <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
        <Select
          value={config.method}
          onChange={(value) => updateConfig({ method: value })}
          options={HTTP_METHODS}
          style={{ width: 120 }}
        />
        <Input
          value={config.url}
          onChange={(e) => updateConfig({ url: e.target.value })}
          placeholder={t('modules.httpDebug.urlPlaceholder', '输入请求 URL，如 https://api.example.com/path')}
          status={config.url && !urlValid ? 'error' : undefined}
          onPressEnter={() => canSend && onSend()}
          style={{ flex: 1 }}
        />
        <Button
          type="primary"
          icon={<SendOutlined />}
          onClick={onSend}
          loading={loading}
          disabled={!canSend}
        >
          {t('modules.httpDebug.send', '发送')}
        </Button>
      </Space.Compact>
      {config.url && !urlValid && (
        <div style={{ color: 'var(--ant-color-error)', fontSize: 12, marginBottom: 8 }}>
          {t('modules.httpDebug.invalidUrl', '请输入有效的 HTTP/HTTPS URL')}
        </div>
      )}
      <Tabs items={tabItems} size="small" />
    </div>
  );
};

export default RequestBuilder;
