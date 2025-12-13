import React, { useState, useMemo } from 'react';
import { Input, Checkbox, Space, Alert, Typography, Divider, Empty, Select, Button, message } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { regexFlags, regexTemplates } from '../../utils/constants';
import { testRegex, highlightMatches } from '../../utils/regex-utils';
import '../../styles/regex.css';

const { TextArea } = Input;
const { Text } = Typography;

const TestTab: React.FC = () => {
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
    const template = regexTemplates.find((t) => t.name === value);
    if (template) {
      setPattern(template.pattern);
    }
  };

  const copyPattern = () => {
    navigator.clipboard.writeText(pattern);
    message.success('已复制正则表达式');
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <div>
        <Text strong>常用模板：</Text>
        <Select
          placeholder="选择常用正则模板"
          style={{ width: '100%', marginTop: 8 }}
          onChange={handleTemplateSelect}
          options={regexTemplates.map((t) => ({
            value: t.name,
            label: `${t.name} - ${t.description}`,
          }))}
          allowClear
        />
      </div>

      <div>
        <Text strong>正则表达式：</Text>
        <Input.Group compact style={{ marginTop: 8 }}>
          <Input
            style={{ width: 'calc(100% - 40px)' }}
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            placeholder="输入正则表达式，如: \d+"
            status={pattern && !result.isValid ? 'error' : undefined}
            addonBefore="/"
            addonAfter={`/${flagString}`}
          />
          <Button icon={<CopyOutlined />} onClick={copyPattern} />
        </Input.Group>
      </div>

      <div>
        <Text strong>标志选项：</Text>
        <div style={{ marginTop: 8 }}>
          <Checkbox.Group value={flags} onChange={(v) => setFlags(v as string[])}>
            <Space wrap>
              {regexFlags.map((f) => (
                <Checkbox key={f.key} value={f.key}>
                  {f.label}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </div>
      </div>

      <div>
        <Text strong>测试文本：</Text>
        <TextArea
          rows={4}
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="输入要测试的文本"
          style={{ marginTop: 8 }}
        />
      </div>

      <Divider />

      {result.error && <Alert type="error" message={result.error} showIcon />}

      {result.isValid && (
        <>
          <Alert
            type={result.matchCount > 0 ? 'success' : 'info'}
            message={`找到 ${result.matchCount} 个匹配`}
            showIcon
          />

          <div>
            <Text strong>匹配结果高亮：</Text>
            <div
              className="regex-result-container"
              style={{ marginTop: 8 }}
              dangerouslySetInnerHTML={{ __html: highlightedHtml || '<span style="color:#999">无内容</span>' }}
            />
          </div>

          {result.matches.length > 0 && (
            <div>
              <Text strong>匹配详情：</Text>
              <div style={{ marginTop: 8, maxHeight: 200, overflowY: 'auto' }}>
                {result.matches.map((m, i) => (
                  <div key={i} className="match-item">
                    <span className="match-index">#{i + 1} 位置: {m.index}</span>
                    <div className="match-text">"{m.match}"</div>
                    {m.groups.length > 0 && (
                      <div className="match-groups">
                        捕获组: {m.groups.map((g, j) => `$${j + 1}="${g}"`).join(', ')}
                      </div>
                    )}
                    {m.namedGroups && Object.keys(m.namedGroups).length > 0 && (
                      <div className="match-groups">
                        命名组: {Object.entries(m.namedGroups).map(([k, v]) => `${k}="${v}"`).join(', ')}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.matchCount === 0 && testString && <Empty description="没有找到匹配" />}
        </>
      )}
    </Space>
  );
};

export default TestTab;
