import React, { useState } from 'react';
import { Card, Input, Select, Button, Space, Row, Col, InputNumber, message } from 'antd';
import { formatDateTime, parseSmartTime } from '../../utils/helpers';

const CalcTab: React.FC = () => {
  const [calcStart, setCalcStart] = useState('');
  const [calcEnd, setCalcEnd] = useState('');
  const [calcDiffResult, setCalcDiffResult] = useState('');
  const [calcBaseTime, setCalcBaseTime] = useState('');
  const [calcOperation, setCalcOperation] = useState<'add' | 'subtract'>('add');
  const [calcAmount, setCalcAmount] = useState<number>(1);
  const [calcUnit, setCalcUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days'>('days');
  const [calcOpResult, setCalcOpResult] = useState('');

  const handleCalcDiff = () => {
    const start = parseSmartTime(calcStart);
    const end = parseSmartTime(calcEnd);
    if (!start || !end) { message.error('请输入有效的时间'); return; }
    const diffMs = end.getTime() - start.getTime();
    const diffSec = Math.abs(Math.floor(diffMs / 1000));
    const days = Math.floor(diffSec / 86400);
    const hours = Math.floor((diffSec % 86400) / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;
    setCalcDiffResult(`相差: ${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒\n总秒数: ${diffSec}秒\n总毫秒数: ${Math.abs(diffMs)}毫秒`);
  };

  const handleCalcOp = () => {
    const base = parseSmartTime(calcBaseTime);
    if (!base) { message.error('请输入有效的基准时间'); return; }
    const multiplier = calcOperation === 'add' ? 1 : -1;
    const msMap = { seconds: 1000, minutes: 60000, hours: 3600000, days: 86400000 };
    const result = new Date(base.getTime() + multiplier * calcAmount * msMap[calcUnit]);
    setCalcOpResult(formatDateTime(result));
  };

  return (
    <Row gutter={16}>
      <Col span={12}>
        <Card size="small" title="⏱️ 时间差计算">
          <Space direction="vertical" style={{ width: '100%' }}>
            <div>
              <span style={{ marginRight: 8 }}>从</span>
              <Input
                value={calcStart}
                onChange={(e) => setCalcStart(e.target.value)}
                placeholder="开始时间（如：2024-01-01 10:00:00）"
                style={{ width: 'calc(100% - 30px)' }}
              />
            </div>
            <div>
              <span style={{ marginRight: 8 }}>到</span>
              <Input
                value={calcEnd}
                onChange={(e) => setCalcEnd(e.target.value)}
                placeholder="结束时间（如：2024-01-02 15:30:00）"
                style={{ width: 'calc(100% - 30px)' }}
              />
            </div>
            <Button type="primary" block onClick={handleCalcDiff}>📊 计算时间差</Button>
            <Input.TextArea value={calcDiffResult} readOnly rows={3} placeholder="计算结果" />
          </Space>
        </Card>
      </Col>
      <Col span={12}>
        <Card size="small" title="➕➖ 时间加减运算">
          <Space direction="vertical" style={{ width: '100%' }}>
            <Input
              value={calcBaseTime}
              onChange={(e) => setCalcBaseTime(e.target.value)}
              placeholder="基准时间（如：2024-01-01 10:00:00）"
            />
            <Space>
              <Select value={calcOperation} onChange={setCalcOperation} style={{ width: 80 }}>
                <Select.Option value="add">+ 增加</Select.Option>
                <Select.Option value="subtract">- 减少</Select.Option>
              </Select>
              <InputNumber value={calcAmount} onChange={(v) => setCalcAmount(v || 0)} min={0} style={{ width: 80 }} />
              <Select value={calcUnit} onChange={setCalcUnit} style={{ width: 80 }}>
                <Select.Option value="seconds">秒</Select.Option>
                <Select.Option value="minutes">分钟</Select.Option>
                <Select.Option value="hours">小时</Select.Option>
                <Select.Option value="days">天</Select.Option>
              </Select>
            </Space>
            <Button type="primary" style={{ backgroundColor: '#52c41a' }} block onClick={handleCalcOp}>📊 计算结果</Button>
            <Input value={calcOpResult} readOnly placeholder="计算结果" />
          </Space>
        </Card>
      </Col>
    </Row>
  );
};

export default CalcTab;
