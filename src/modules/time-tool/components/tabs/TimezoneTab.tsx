import React, { useState } from 'react';
import { Card, Input, Select, Button, Row, Col, message } from 'antd';
import { formatDateTime, parseSmartTime, getTimeZoneOffsetHours, zonedTimeToUtcMillis } from '../../utils/helpers';
import { timezones } from '../../utils/constants';

const TimezoneTab: React.FC = () => {
  const [tzInput, setTzInput] = useState('');
  const [fromTz, setFromTz] = useState('Asia/Shanghai');
  const [toTz, setToTz] = useState('UTC');
  const [tzResult, setTzResult] = useState('');

  const handleTzConvert = () => {
    const trimmed = tzInput.trim();
    let utcMillis: number | null = null;

    if (/^\d{10}$/.test(trimmed)) {
      utcMillis = parseInt(trimmed, 10) * 1000;
    } else if (/^\d{13}$/.test(trimmed)) {
      utcMillis = parseInt(trimmed, 10);
    } else {
      const parsed = parseSmartTime(tzInput);
      if (!parsed) { message.error('请输入有效的时间'); return; }
      utcMillis = zonedTimeToUtcMillis(parsed, fromTz);
    }

    const toOffset = getTimeZoneOffsetHours(toTz, new Date(utcMillis));
    const targetTime = new Date(utcMillis + toOffset * 3600000);
    setTzResult(formatDateTime(targetTime));
  };

  return (
    <Row gutter={16}>
      <Col span={12}>
        <Card size="small" title="🌍 时区转换设置">
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}>输入时间</div>
            <Input
              value={tzInput}
              onChange={(e) => setTzInput(e.target.value)}
              placeholder="输入时间（如：2024-01-15 10:30:00）"
            />
          </div>
          <Row gutter={16} style={{ marginBottom: 12 }}>
            <Col span={12}>
              <div style={{ marginBottom: 4 }}>从时区</div>
              <Select value={fromTz} onChange={setFromTz} style={{ width: '100%' }} options={timezones.map(t => ({ value: t.value, label: t.label }))} />
            </Col>
            <Col span={12}>
              <div style={{ marginBottom: 4 }}>到时区</div>
              <Select value={toTz} onChange={setToTz} style={{ width: '100%' }} options={timezones.map(t => ({ value: t.value, label: t.label }))} />
            </Col>
          </Row>
          <Button type="primary" block onClick={handleTzConvert}>🔄 转换时区</Button>
        </Card>
      </Col>
      <Col span={12}>
        <Card size="small" title="🎯 转换结果">
          <Input value={tzResult} readOnly size="large" style={{ fontSize: 18 }} />
        </Card>
      </Col>
    </Row>
  );
};

export default TimezoneTab;
