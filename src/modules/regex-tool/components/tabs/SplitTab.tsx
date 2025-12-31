import React, { useState, useMemo } from 'react';
import { Input, Checkbox, Space, Alert, Typography, Button, App, List, Tag } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { regexFlags } from '../../utils/constants';
import { splitWithRegex } from '../../utils/regex-utils';

const { TextArea } = Input;
const { Text } = Typography;

const SplitTab: React.FC = () => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState<string[]>([]);
  const [testString, setTestString] = useState('');

  const flagString = flags.join('');
  const result = useMemo(
    () => splitWithRegex(pattern, flagString, testString),
    [pattern, flagString, testString]
  );

  const copyResult = () => {
    navigator.clipboard.writeText(JSON.stringify(result.result, null, 2));
    message.success(t('common.copied'));
  };

  const copyAsLines = () => {
    navigator.clipboard.writeText(result.result.join('\n'));
    message.success(t('common.copied'));
  };

  const getFlagLabel = (key: string) => {
    const map: Record<string, string> = {
      g: 'global',
      i: 'ignoreCase',
      m: 'multiline',
      s: 'dotAll',
      u: 'unicode',
    };
    return t(`modules.regex.flagOptions.${map[key] || key}`);
  };

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
      <div>
        <Text strong>{t('modules.regex.splitPattern')}：</Text>
        <Space.Compact style={{ marginTop: 8, width: '100%' }}>
          <Input style={{ width: 30, textAlign: 'center' }} value="/" disabled />
          <Input
            style={{ flex: 1 }}
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder={t('modules.regex.splitPlaceholder')}
          />
          <Input style={{ width: 50, textAlign: 'center' }} value={`/${flagString}`} disabled />
        </Space.Compact>
      </div>

      <div>
        <Text strong>{t('modules.regex.flags')}：</Text>
        <div style={{ marginTop: 8 }}>
          <Checkbox.Group value={flags} onChange={(v) => setFlags(v as string[])}>
            <Space wrap>
              {regexFlags.filter(f => f.key !== 'g').map((f) => (
                <Checkbox key={f.key} value={f.key}>
                  {getFlagLabel(f.key)}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </div>
      </div>

      <div>
        <Text strong>{t('modules.regex.originalText')}：</Text>
        <TextArea
          rows={4}
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder={t('modules.regex.splitTextPlaceholder')}
          style={{ marginTop: 8 }}
        />
      </div>

      {result.error && <Alert type="error" title={result.error === '请输入正则表达式' ? t('modules.regex.invalidPattern') : result.error} showIcon />}

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>{t('modules.regex.splitResult')} ({result.result.length} {t('modules.regex.items')})：</Text>
          <Space>
            <Button size="small" icon={<CopyOutlined />} onClick={copyAsLines}>
              {t('modules.regex.copyAsLines')}
            </Button>
            <Button size="small" icon={<CopyOutlined />} onClick={copyResult}>
              {t('modules.regex.copyJson')}
            </Button>
          </Space>
        </div>
        <List
          style={{ marginTop: 8, maxHeight: 300, overflowY: 'auto' }}
          bordered
          size="small"
          dataSource={result.result}
          renderItem={(item, index) => (
            <List.Item>
              <Tag color="blue">{index}</Tag>
              <Text code style={{ wordBreak: 'break-all' }}>
                {item || <Text type="secondary">({t('modules.regex.emptyString')})</Text>}
              </Text>
            </List.Item>
          )}
        />
      </div>
    </Space>
  );
};

export default SplitTab;
