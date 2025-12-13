import React, { useState, useMemo } from 'react';
import { Input, Checkbox, Space, Alert, Typography, Button, message, List, Tag } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { regexFlags } from '../../utils/constants';
import { splitWithRegex } from '../../utils/regex-utils';

const { TextArea } = Input;
const { Text } = Typography;

const SplitTab: React.FC = () => {
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
    message.success('已复制分割结果');
  };

  const copyAsLines = () => {
    navigator.clipboard.writeText(result.result.join('\n'));
    message.success('已复制为多行文本');
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      <div>
        <Text strong>分隔符正则：</Text>
        <Input
          style={{ marginTop: 8 }}
          value={pattern}
          onChange={(e) => setPattern(e.target.value)}
          placeholder="输入分隔符正则，如: [,;\\s]+"
          addonBefore="/"
          addonAfter={`/${flagString}`}
        />
      </div>

      <div>
        <Text strong>标志选项：</Text>
        <div style={{ marginTop: 8 }}>
          <Checkbox.Group value={flags} onChange={(v) => setFlags(v as string[])}>
            <Space wrap>
              {regexFlags.filter(f => f.key !== 'g').map((f) => (
                <Checkbox key={f.key} value={f.key}>
                  {f.label}
                </Checkbox>
              ))}
            </Space>
          </Checkbox.Group>
        </div>
      </div>

      <div>
        <Text strong>原始文本：</Text>
        <TextArea
          rows={4}
          value={testString}
          onChange={(e) => setTestString(e.target.value)}
          placeholder="输入要分割的文本"
          style={{ marginTop: 8 }}
        />
      </div>

      {result.error && <Alert type="error" message={result.error} showIcon />}

      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text strong>分割结果 ({result.result.length} 项)：</Text>
          <Space>
            <Button size="small" icon={<CopyOutlined />} onClick={copyAsLines}>
              复制为多行
            </Button>
            <Button size="small" icon={<CopyOutlined />} onClick={copyResult}>
              复制JSON
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
                {item || <Text type="secondary">(空字符串)</Text>}
              </Text>
            </List.Item>
          )}
        />
      </div>
    </Space>
  );
};

export default SplitTab;
