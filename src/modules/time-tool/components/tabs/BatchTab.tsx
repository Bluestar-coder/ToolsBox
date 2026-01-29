import React, { useState } from 'react';
import { Card, Input, Button, Space, Row, Col } from 'antd';
import { formatDateTime, parseSmartTime } from '../../utils/helpers';

const { TextArea } = Input;

const BatchTab: React.FC = () => {
  const [batchInput, setBatchInput] = useState('');
  const [batchResult, setBatchResult] = useState('');

  const handleBatchConvert = () => {
    const lines = batchInput.split('\n').filter(l => l.trim());
    const results = lines.map(line => {
      const parsed = parseSmartTime(line.trim());
      if (parsed) return `${line.trim()} → ${formatDateTime(parsed)} (${Math.floor(parsed.getTime() / 1000)})`;
      return `${line.trim()} → 无法解析`;
    });
    setBatchResult(results.join('\n'));
  };

  return (
    <Row gutter={16}>
      <Col span={12}>
        <Card size="small" title="📝 批量时间输入（每行一个）">
          <TextArea
            value={batchInput}
            onChange={(e) => setBatchInput(e.target.value)}
            placeholder={`输入多个时间值，每行一个：\n1699999999\n2024-01-15 10:30:45\nnow\ntoday\n2024/01/15`}
            autoSize={{ minRows: 10, maxRows: 20 }}
            style={{ marginBottom: 8 }}
          />
          <Space>
            <Button type="primary" block onClick={handleBatchConvert}>📊 批量转换</Button>
            <Button onClick={() => { setBatchInput(''); setBatchResult(''); }}>清空</Button>
          </Space>
        </Card>
      </Col>
      <Col span={12}>
        <Card size="small" title="📋 转换结果">
          <TextArea value={batchResult} readOnly autoSize={{ minRows: 12, maxRows: 20 }} placeholder="转换结果将显示在这里" />
        </Card>
      </Col>
    </Row>
  );
};

export default BatchTab;
