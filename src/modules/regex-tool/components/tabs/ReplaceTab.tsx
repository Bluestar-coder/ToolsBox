import React, { useState, useMemo } from 'react';
import { Input, Checkbox, Space, Alert, Typography, Button, message } from 'antd';
import { CopyOutlined, SwapOutlined } from '@ant-design/icons';
import { regexFlags } from '../../utils/constants';
import { replaceWithRegex } from '../../utils/regex-utils';

const { TextArea } = Input;
const { Text } = Typography;

const ReplaceTab: React.FC = () => {
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
    message.success('已复制替换结果');
  };

  const applyResult = () => {
    setTestString(result.result);
    message.success('已应用替换结果');
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <div>
        <Text strong>正则表达式：</Text>
        <Input
          style={{ marginTop: 8 }}
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="输入正则表达式，如: \d+"
          addonBefore="/"
          addonAfter={`/${flagString}`}
        />
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
        <Text strong>替换为：</Text>
        <Input
          style={{ marginTop: 8 }}
          value={replacement}
          onChange={(e) => setReplacement(e.target.value)}
          placeholder="替换文本，支持 $1, $2 等捕获组引用"
        />
        <Text type="secondary" style={{ fontSize: 12 }}>
          提示: 使用 $1, $2... 引用捕获组，$& 引用整个匹配，$` 引用匹配前的文本，$' 引用匹配后的文本
        </Text>
      </div>

      <div>
        <Text strong>原始文本：</Text>
        <TextArea
          rows={4}
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="输入要处理的文本"
          style={{ marginTop: 8 }}
        />
      </div>

      {result.error && <Alert type="error" message={result.error} showIcon />}

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>替换结果：</Text>
          <Space>
            <Button size="small" icon={<SwapOutlined />} onClick={applyResult}>
              应用结果
            </Button>
            <Button size="small" icon={<CopyOutlined />} onClick={copyResult}>
              复制
            </Button>
          </Space>
        </div>
        <TextArea
          rows={4}
          value={result.result}
          readOnly
          style={{ marginTop: 8, background: '#fafafa' }}
        />
      </div>
    </Space>
  );
};

export default ReplaceTab;
