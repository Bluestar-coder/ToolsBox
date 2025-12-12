import React, { useState } from 'react';
import { Card, Input, Button, Space, message } from 'antd';
import * as smCrypto from 'sm-crypto';
import { calculateAllHashes } from '../../utils/hash';

const { sm3 } = smCrypto;
const { TextArea } = Input;

const SM3Tab: React.FC = () => {
  const [hashInput, setHashInput] = useState('');
  const [sm3Results, setSm3Results] = useState<Record<string, string>>({});
  const [hashResults, setHashResults] = useState<Record<string, string>>({});

  const calculateSm3 = () => {
    if (!hashInput) {
      message.warning('请输入要计算哈希的内容');
      return;
    }
    const hash = sm3(hashInput);
    setSm3Results({ SM3: hash });
    message.success('SM3 哈希计算完成');
  };

  const calculateHash = () => {
    if (!hashInput) {
      message.warning('请输入要计算哈希的内容');
      return;
    }
    const results = calculateAllHashes(hashInput);
    setHashResults(results);
    message.success('哈希计算完成');
  };

  const copyHashResult = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  const handleClear = () => {
    setHashInput('');
    setHashResults({});
    setSm3Results({});
  };

  return (
    <>
      <TextArea
        value={hashInput}
        onChange={(e) => setHashInput(e.target.value)}
        placeholder="请输入要计算 SM3 哈希的内容"
        rows={6}
        style={{ marginBottom: 16, fontFamily: 'monospace' }}
      />
      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" style={{ backgroundColor: '#52c41a' }} onClick={calculateSm3}>
          计算 SM3
        </Button>
        <Button type="primary" onClick={calculateHash}>
          计算全部哈希
        </Button>
        <Button danger onClick={handleClear}>
          清空
        </Button>
      </Space>
      {(Object.keys(sm3Results).length > 0 || Object.keys(hashResults).length > 0) && (
        <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
          {Object.entries({ ...sm3Results, ...hashResults }).map(([algo, value]) => (
            <div key={algo} style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                <span style={{ fontWeight: 500, width: 70, color: algo === 'SM3' ? '#722ed1' : undefined }}>{algo}:</span>
                <Button size="small" onClick={() => copyHashResult(value)}>复制</Button>
              </div>
              <Input value={value} readOnly style={{ fontFamily: 'monospace', fontSize: 12 }} />
            </div>
          ))}
        </Card>
      )}
      <div style={{ marginTop: 16, padding: 8, backgroundColor: '#e6f7ff', borderRadius: 4 }}>
        ℹ️ SM3 是中国国家密码管理局发布的密码杂凑算法，输出 256 位哈希值，安全性与 SHA-256 相当
      </div>
    </>
  );
};

export default SM3Tab;
