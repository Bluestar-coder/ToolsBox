import React, { useState, useMemo } from 'react';
import { Input, Checkbox, Space, Alert, Typography, Button, App } from 'antd';
import { CopyOutlined, SwapOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { regexFlags } from '../../utils/constants';
import { replaceWithRegex } from '../../utils/regex-utils';

const { TextArea } = Input;
const { Text } = Typography;

const ReplaceTab: React.FC = () => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState<string[]>(['g']);
  const [testString, setTestString] = useState('');
  const [replacement, setReplacement] = useState('');

  const flagString = flags.join('');
  const result = useMemo(
    () => replaceWithRegex(pattern, flagString, testString, replacement),
    [pattern, flagString, testString, replacement]
  );

  const copyResult = () => {
    navigator.clipboard.writeText(result.result);
    message.success(t('common.copied'));
  };

  const applyResult = () => {
    setTestString(result.result);
    message.success(t('modules.regex.applyResult'));
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
        <Text strong>{t('modules.regex.pattern')}：</Text>
        <Space.Compact style={{ marginTop: 8, width: '100%' }}>
          <Input style={{ width: 30, textAlign: 'center' }} value="/" disabled />
          <Input
            style={{ flex: 1 }}
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder={t('modules.regex.patternPlaceholder')}
          />
          <Input style={{ width: 50, textAlign: 'center' }} value={`/${flagString}`} disabled />
        </Space.Compact>
      </div>

      <div>
        <Text strong>{t('modules.regex.flags')}：</Text>
        <div style={{ marginTop: 8 }}>
          <Checkbox.Group value={flags} onChange={(v) => setFlags(v as string[])}>
            <Space wrap>
              {regexFlags.map((f) => (
                <Checkbox key={f.key} value={f.key}>
                  {getFlagLabel(f.key)}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </div>
      </div>

      <div>
        <Text strong>{t('modules.regex.replacement')}：</Text>
        <Input
          style={{ marginTop: 8 }}
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
          placeholder={t('modules.regex.replacementPlaceholder')}
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          {t('modules.regex.replacementTip')}
        </Text>
      </div>

      <div>
        <Text strong>{t('modules.regex.originalText')}：</Text>
        <TextArea
          autoSize={{ minRows: 4, maxRows: 20 }}
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder={t('modules.regex.originalTextPlaceholder')}
          style={{ marginTop: 8 }}
        />
      </div>

      {result.error && <Alert type="error" title={result.error === '请输入正则表达式' ? t('modules.regex.invalidPattern') : result.error} showIcon />}

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>{t('modules.regex.replaceResult')}：</Text>
          <Space>
            <Button size="small" icon={<SwapOutlined />} onClick={applyResult}>
              {t('modules.regex.applyResult')}
            </Button>
            <Button size="small" icon={<CopyOutlined />} onClick={copyResult}>
              {t('common.copy')}
            </Button>
          </Space>
        </div>
        <TextArea
          autoSize={{ minRows: 4, maxRows: 20 }}
          value={result.result}
          readOnly
          style={{ marginTop: 8, background: '#fafafa' }}
        />
      </div>
    </Space>
  );
};

export default ReplaceTab;
