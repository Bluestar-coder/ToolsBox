import React, { useState } from 'react';
import { Card, Input, Button, Space, Tabs, InputNumber, message } from 'antd';
import { radixTabItems, radixMap } from '../../utils/constants';

const { TextArea } = Input;

type RadixType = 'bin' | 'oct' | 'dec' | 'hex' | 'custom';

const RadixTab: React.FC = () => {
  const [radixInput, setRadixInput] = useState<string>('');
  const [fromRadix, setFromRadix] = useState<RadixType>('dec');
  const [radixResults, setRadixResults] = useState<Record<string, string>>({});
  const [customRadix, setCustomRadix] = useState<number>(36);

  const getInputRadix = (): number => {
    if (fromRadix === 'custom') return customRadix;
    return radixMap[fromRadix] || 10;
  };

  const convertRadix = () => {
    if (!radixInput.trim()) {
      message.warning('请输入要转换的数值');
      return;
    }
    try {
      const base = getInputRadix();
      const num = parseInt(radixInput, base);
      if (isNaN(num)) {
        throw new Error('无效的输入');
      }
      const results: Record<string, string> = {
        bin: num.toString(2),
        oct: num.toString(8),
        dec: num.toString(10),
        hex: num.toString(16).toUpperCase(),
      };
      if (fromRadix === 'custom' || customRadix !== 36) {
        results.custom = num.toString(customRadix).toUpperCase();
      }
      setRadixResults(results);
    } catch {
      message.error('转换失败，请检查输入是否符合所选进制');
      setRadixResults({});
    }
  };

  const copyRadixResult = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  const handleClear = () => {
    setRadixInput('');
    setRadixResults({});
  };

  return (
    <>
      <Tabs
        activeKey={fromRadix}
        onChange={(key) => setFromRadix(key as RadixType)}
        items={radixTabItems}
        size="small"
        style={{ marginBottom: 16 }}
      />
      {fromRadix === 'custom' && (
        <div style={{ marginBottom: 16 }}>
          <Space>
            <span>自定义进制 (2-36):</span>
            <InputNumber
              min={2}
              max={36}
              value={customRadix}
              onChange={(value) => setCustomRadix(value || 10)}
              style={{ width: 80 }}
            />
          </Space>
        </div>
      )}
      <TextArea
        value={radixInput}
        onChange={(e) => setRadixInput(e.target.value)}
        placeholder="请输入要转换的数值"
        autoSize={{ minRows: 4, maxRows: 20 }}
        style={{ marginBottom: 16, fontFamily: 'monospace' }}
      />
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" style={{ backgroundColor: '#52c41a' }} onClick={convertRadix}>
          转换
        </Button>
        <Button danger onClick={handleClear}>
          清空
        </Button>
      </Space>
      {Object.keys(radixResults).length > 0 && (
        <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
          {[
            { key: 'bin', label: '二进制' },
            { key: 'oct', label: '八进制' },
            { key: 'dec', label: '十进制' },
            { key: 'hex', label: '十六进制' },
            ...(radixResults.custom ? [{ key: 'custom', label: `${customRadix}进制` }] : []),
          ].map(({ key, label }) => (
            <div key={key} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 500, width: 80 }}>{label}:</span>
                <Button size="small" onClick={() => copyRadixResult(radixResults[key])}>复制</Button>
              </div>
              <Input value={radixResults[key]} readOnly style={{ fontFamily: 'monospace' }} />
            </div>
          ))}
        </Card>
      )}
    </>
  );
};

export default RadixTab;
