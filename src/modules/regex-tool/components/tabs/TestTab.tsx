import React, { useState, useMemo } from 'react';
import { Input, Checkbox, Space, Alert, Typography, Divider, Empty, Select, Button, App } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { regexFlags, regexTemplates } from '../../utils/constants';
import { testRegex, highlightMatches } from '../../utils/regex-utils';
import '../../styles/regex.css';

const { TextArea } = Input;
const { Text } = Typography;

const TestTab: React.FC = () => {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const [pattern, setPattern] = useState('');
  const [flags, setFlags] = useState<string[]>(['g']);
  const [testString, setTestString] = useState('');

  const flagString = flags.join('');
  const result = useMemo(() => testRegex(pattern, flagString, testString), [pattern, flagString, testString]);
  const highlightedHtml = useMemo(
    () => (result.isValid ? highlightMatches(testString, result.matches) : testString),
    [testString, result]
  );

  const handleTemplateSelect = (value: string) => {
    const tpl = regexTemplates.find((item) => item.name === value);
    if (tpl) {
      setPattern(tpl.pattern);
    }
  };

  const copyPattern = () => {
    navigator.clipboard.writeText(pattern);
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
        <Text strong>{t('modules.regex.template')}：</Text>
        <Select
          placeholder={t('modules.regex.selectTemplate')}
          style={{ width: '100%', marginTop: 8 }}
          onChange={handleTemplateSelect}
          options={regexTemplates.map((tpl) => ({
            value: tpl.name,
            label: `${tpl.name} - ${tpl.description}`,
          }))}
          allowClear
        />
      </div>

      <div>
        <Text strong>{t('modules.regex.pattern')}：</Text>
        <Space.Compact style={{ marginTop: 8, width: '100%' }}>
          <Input style={{ width: 30, textAlign: 'center' }} value="/" disabled />
          <Input
            style={{ flex: 1 }}
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder={t('modules.regex.patternPlaceholder')}
            status={pattern && !result.isValid ? 'error' : undefined}
          />
          <Input style={{ width: 50, textAlign: 'center' }} value={`/${flagString}`} disabled />
          <Button icon={<CopyOutlined />} onClick={copyPattern} />
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
        <Text strong>{t('modules.regex.testText')}：</Text>
        <TextArea
          rows={4}
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder={t('modules.regex.testTextPlaceholder')}
          style={{ marginTop: 8 }}
        />
      </div>

      <Divider />

      {result.error && <Alert type="error" title={result.error === '请输入正则表达式' ? t('modules.regex.invalidPattern') : result.error} showIcon />}

      {result.isValid && (
        <>
          <Alert
            type={result.matchCount > 0 ? 'success' : 'info'}
            message={t('modules.regex.matchCount', { count: result.matchCount })}
            showIcon
          />

          <div>
            <Text strong>{t('modules.regex.matchResult')}：</Text>
            <div
              className="regex-result-container"
              style={{ marginTop: 8 }}
              dangerouslySetInnerHTML={{ __html: highlightedHtml || `<span style="color:#999">${t('modules.regex.noContent')}</span>` }}
            />
          </div>

          {result.matches.length > 0 && (
            <div>
              <Text strong>{t('modules.regex.matchDetails')}：</Text>
              <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
                {result.matches.map((m, i) => (
                  <div key={i} className="match-item">
                    <span className="match-index">#{i + 1} {t('modules.regex.position')}: {m.index}</span>
                    <div className="match-text">"{m.match}"</div>
                    {m.groups.length > 0 && (
                      <div className="match-groups">
                        {t('modules.regex.captureGroups')}: {m.groups.map((g, j) => `${j + 1}="${g}"`).join(', ')}
                      </div>
                    )}
                    {m.namedGroups && Object.keys(m.namedGroups).length > 0 && (
                      <div className="match-groups">
                        {t('modules.regex.namedGroups')}: {Object.entries(m.namedGroups).map(([k, v]) => `${k}="${v}"`).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.matchCount === 0 && testString && <Empty description={t('modules.regex.noMatch')} />}
        </>
      )}
    </Space>
  );
};

export default TestTab;
