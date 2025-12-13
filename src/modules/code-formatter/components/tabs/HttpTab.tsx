import React, { useState, useCallback } from 'react';
import { Button, Space, message, Row, Col, Tooltip, Alert } from 'antd';
import {
  CopyOutlined, ClearOutlined, FormatPainterOutlined, CompressOutlined,
  CheckCircleOutlined, SwapOutlined,
} from '@ant-design/icons';
import {
  parseHttpMessage, formatHttpRequest, formatHttpResponse, minifyHttpMessage,
  fromCurl, validateHttpMessage, type HttpValidationResult,
} from '../../utils/http-utils';
import CodeEditor from '../CodeEditor';

const HttpTab: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [validation, setValidation] = useState<HttpValidationResult | null>(null);

  const handleFormat = useCallback(() => {
    if (!input.trim()) {
      message.warning('请输入 HTTP 报文');
      return;
    }
    try {
      const { type, message: httpMessage } = parseHttpMessage(input);
      const formatted = type === 'request'
        ? formatHttpRequest(httpMessage as any)
        : formatHttpResponse(httpMessage as any);
      setOutput(formatted);
      setValidation(validateHttpMessage(input));
      message.success('格式化成功');
    } catch (error) {
      message.error(`格式化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [input]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      message.warning('请输入 HTTP 报文');
      return;
    }
    try {
      const result = minifyHttpMessage(input);
      setOutput(result);
      message.success('压缩成功');
    } catch (error) {
      message.error(`压缩失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [input]);

  const handleParseCurl = useCallback(() => {
    if (!input.trim()) {
      message.warning('请输入 cURL 命令');
      return;
    }
    try {
      const request = fromCurl(input);
      const formatted = formatHttpRequest(request);
      setOutput(formatted);
      message.success('cURL 解析成功');
    } catch (error) {
      message.error(`解析失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [input]);

  const handleValidate = useCallback(() => {
    if (!input.trim()) {
      message.warning('请输入 HTTP 报文');
      return;
    }
    const result = validateHttpMessage(input);
    setValidation(result);
    if (result.valid && result.warnings.length === 0) {
      message.success('验证通过');
    } else if (result.valid) {
      message.info('验证通过，但有一些建议');
    } else {
      message.error('验证失败');
    }
  }, [input]);

  const handleCopy = useCallback(async () => {
    if (!output) {
      message.warning('没有可复制的内容');
      return;
    }
    try {
      await navigator.clipboard.writeText(output);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  }, [output]);

  const handleClear = useCallback(() => {
    setInput('');
    setOutput('');
    setValidation(null);
  }, []);

  const handleLoadExample = useCallback((type: 'request' | 'response') => {
    if (type === 'request') {
      setInput(`GET /api/users?page=1&limit=10 HTTP/1.1
Host: api.example.com
Accept: application/json
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
User-Agent: Mozilla/5.0
Cache-Control: no-cache

`);
    } else {
      setInput(`HTTP/1.1 200 OK
Content-Type: application/json; charset=utf-8
Content-Length: 156
Date: Sat, 13 Dec 2025 10:30:00 GMT
Cache-Control: max-age=3600
X-Request-Id: abc123

{"users":[{"id":1,"name":"Alice","email":"alice@example.com"},{"id":2,"name":"Bob","email":"bob@example.com"}],"total":2,"page":1}`);
    }
  }, []);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      {/* 示例按钮 */}
      <Space>
        <span>加载示例:</span>
        <Button size="small" onClick={() => handleLoadExample('request')}>HTTP 请求</Button>
        <Button size="small" onClick={() => handleLoadExample('response')}>HTTP 响应</Button>
      </Space>

      {/* 输入区域 */}
      <div>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>输入 HTTP 报文 / cURL 命令</div>
        <CodeEditor
          value={input}
          onChange={setInput}
          language="http"
          placeholder={`GET /api/users HTTP/1.1
Host: api.example.com
Accept: application/json`}
          rows={10}
        />
      </div>

      {/* 操作按钮 */}
      <Row gutter={[8, 8]}>
        <Col>
          <Space wrap>
            <Tooltip title="格式化 HTTP 报文">
              <Button type="primary" icon={<FormatPainterOutlined />} onClick={handleFormat}>格式化</Button>
            </Tooltip>
            <Tooltip title="压缩报文">
              <Button icon={<CompressOutlined />} onClick={handleMinify}>压缩</Button>
            </Tooltip>
            <Tooltip title="解析 cURL 命令">
              <Button icon={<SwapOutlined />} onClick={handleParseCurl}>解析 cURL</Button>
            </Tooltip>
            <Tooltip title="验证报文">
              <Button icon={<CheckCircleOutlined />} onClick={handleValidate}>验证</Button>
            </Tooltip>
            <Tooltip title="复制结果">
              <Button icon={<CopyOutlined />} onClick={handleCopy}>复制</Button>
            </Tooltip>
            <Tooltip title="清空">
              <Button icon={<ClearOutlined />} onClick={handleClear}>清空</Button>
            </Tooltip>
          </Space>
        </Col>
      </Row>

      {/* 输出区域 */}
      <div>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>格式化结果</div>
        <CodeEditor
          value={output}
          language="http"
          readOnly
          rows={10}
        />
      </div>

      {/* 验证结果 */}
      {validation && (
        <div>
          {validation.valid && validation.warnings.length === 0 ? (
            <Alert message="HTTP 报文验证通过" type="success" icon={<CheckCircleOutlined />} showIcon />
          ) : (
            <>
              {validation.errors.length > 0 && (
                <Alert
                  message="验证错误"
                  description={
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {validation.errors.map((err, i) => (
                        <li key={i} style={{ color: '#ff4d4f' }}>{err}</li>
                      ))}
                    </ul>
                  }
                  type="error"
                  showIcon
                />
              )}
              {validation.warnings.length > 0 && (
                <Alert
                  message="建议"
                  description={
                    <ul style={{ margin: 0, paddingLeft: 20 }}>
                      {validation.warnings.map((warn, i) => (
                        <li key={i}>{warn}</li>
                      ))}
                    </ul>
                  }
                  type="warning"
                  showIcon
                  style={{ marginTop: validation.errors.length > 0 ? 8 : 0 }}
                />
              )}
            </>
          )}
        </div>
      )}
    </Space>
  );
};

export default HttpTab;
