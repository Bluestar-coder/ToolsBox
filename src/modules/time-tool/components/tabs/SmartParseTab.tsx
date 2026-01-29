import React, { useState, useEffect } from 'react';
import { Card, Input, Button, Space, Row, Col, message } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import { formatDateTime, parseSmartTime, copyToClipboard } from '../../utils/helpers';

const { TextArea } = Input;

const SmartParseTab: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [smartInput, setSmartInput] = useState('');
  const [smartResult, setSmartResult] = useState('');

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSmartParse = () => {
    const parsed = parseSmartTime(smartInput);
    if (parsed) {
      setSmartResult(`本地时间: ${formatDateTime(parsed)}\nUnix时间戳(秒): ${Math.floor(parsed.getTime() / 1000)}\nUnix时间戳(毫秒): ${parsed.getTime()}\nISO 8601: ${parsed.toISOString()}`);
    } else {
      setSmartResult('无法解析输入的时间格式');
    }
  };

  const handleCopy = async () => {
    if (await copyToClipboard(smartResult)) {
      message.success('已复制');
    } else {
      message.error('复制失败');
    }
  };

  return (
    <>
      <Card size="small" title="⚡ 快捷操作" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Button onClick={() => setSmartInput('now')}>当前时间</Button>
          <Button onClick={() => setSmartInput('today')}>今天开始</Button>
          <Button onClick={() => setSmartInput('yesterday')}>昨天</Button>
          <Button onClick={() => {
            const d = new Date();
            d.setDate(d.getDate() - d.getDay());
            setSmartInput(formatDateTime(d));
          }}>本周开始</Button>
          <Button onClick={() => {
            const d = new Date();
            d.setDate(1);
            setSmartInput(formatDateTime(d));
          }}>本月开始</Button>
        </Space>
      </Card>
      
      <Row gutter={16}>
        <Col span={12}>
          <Card size="small" title="⏰ 当前时间" style={{ marginBottom: 16 }} extra={<Button size="small" icon={<ReloadOutlined />} onClick={() => setCurrentTime(new Date())}>刷新</Button>}>
            <Row gutter={8}>
              <Col span={8}>
                <div style={{ fontSize: 12, color: '#999' }}>当前本地时间</div>
                <Input value={formatDateTime(currentTime)} readOnly size="small" />
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 12, color: '#999' }}>Unix时间戳(秒)</div>
                <Input value={Math.floor(currentTime.getTime() / 1000)} readOnly size="small" />
              </Col>
              <Col span={8}>
                <div style={{ fontSize: 12, color: '#999' }}>Unix时间戳(毫秒)</div>
                <Input value={currentTime.getTime()} readOnly size="small" />
              </Col>
            </Row>
          </Card>
          
          <Card size="small" title="📝 输入时间（支持多种格式）">
            <TextArea
              value={smartInput}
              onChange={(e) => setSmartInput(e.target.value)}
              placeholder={`试试输入：\n• 1749722690 (时间戳)\n• 2025-06-12 18:06:25\n• now / today / yesterday\n• 2025/06/12\n• Jun 12, 2025`}
              autoSize={{ minRows: 6, maxRows: 20 }}
              style={{ marginBottom: 8 }}
            />
            <Space>
              <Button type="primary" onClick={handleSmartParse}>🔍 解析</Button>
              <Button onClick={() => { setSmartInput(''); setSmartResult(''); }}>清空</Button>
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" title="📊 解析结果">
            <TextArea value={smartResult} readOnly autoSize={{ minRows: 10, maxRows: 20 }} placeholder="解析结果将显示在这里" />
            {smartResult && (
              <Button size="small" icon={<CopyOutlined />} onClick={handleCopy} style={{ marginTop: 8 }}>
                复制结果
              </Button>
            )}
          </Card>
        </Col>
      </Row>
    </>
  );
};

export default SmartParseTab;
