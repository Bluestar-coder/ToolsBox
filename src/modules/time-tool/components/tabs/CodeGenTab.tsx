import React, { useState } from 'react';
import { Card, Input, Select, Button, Row, Col, message } from 'antd';
import { parseSmartTime, generateCode, copyToClipboard } from '../../utils/helpers';
import { languages } from '../../utils/constants';

const { TextArea } = Input;

const CodeGenTab: React.FC = () => {
  const [codeInput, setCodeInput] = useState('');
  const [codeLang, setCodeLang] = useState('javascript');
  const [generatedCode, setGeneratedCode] = useState('');

  const handleGenerateCode = () => {
    const parsed = parseSmartTime(codeInput);
    if (parsed) {
      setGeneratedCode(generateCode(parsed.getTime(), codeLang));
    } else {
      message.error('请输入有效的时间');
    }
  };

  const handleCopy = async () => {
    if (generatedCode && await copyToClipboard(generatedCode)) {
      message.success('已复制');
    }
  };

  return (
    <Row gutter={16}>
      <Col span={12}>
        <Card size="small" title="⚡ 时间输入与语言选择">
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}>输入时间戳或时间字符串（如：1699999999）</div>
            <Input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              placeholder="输入时间戳或时间字符串"
            />
          </div>
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4 }}>选择语言</div>
            <Select value={codeLang} onChange={setCodeLang} style={{ width: '100%' }} options={languages} />
          </div>
          <Button type="primary" block onClick={handleGenerateCode}>🔧 生成代码</Button>
        </Card>
      </Col>
      <Col span={12}>
        <Card size="small" title="💻 生成的代码（点击代码块可复制）">
          <TextArea
            value={generatedCode}
            readOnly
            rows={8}
            style={{ fontFamily: 'monospace', cursor: 'pointer' }}
            onClick={handleCopy}
          />
        </Card>
      </Col>
    </Row>
  );
};

export default CodeGenTab;
