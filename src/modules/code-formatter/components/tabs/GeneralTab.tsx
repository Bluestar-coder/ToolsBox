import React, { useState, useCallback } from 'react';
import { Button, Space, message, Select, Row, Col, Tooltip, Switch, Alert, List } from 'antd';
import { CopyOutlined, ClearOutlined, FormatPainterOutlined, CompressOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { formatCode, minifyCode, type SupportedLanguage, type FormatOptions } from '../../utils/formatters';
import { languageOptions, indentSizeOptions } from '../../utils/constants';
import { checkSyntax, type SyntaxCheckResult } from '../../utils/syntax-checker';
import CodeEditor from '../CodeEditor';

// 排除有专用 Tab 的语言
const generalLanguages = languageOptions.filter(
  l => !['json', 'sql'].includes(l.value)
);

interface GeneralTabProps {
  defaultLanguage?: SupportedLanguage;
}

const GeneralTab: React.FC<GeneralTabProps> = ({ defaultLanguage = 'javascript' }) => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [language, setLanguage] = useState<SupportedLanguage>(defaultLanguage);
  const [indentSize, setIndentSize] = useState(2);
  const [useTabs, setUseTabs] = useState(false);
  const [syntaxResult, setSyntaxResult] = useState<SyntaxCheckResult | null>(null);

  const currentLanguage = generalLanguages.find(l => l.value === language);

  const handleFormat = useCallback(async () => {
    if (!input.trim()) {
      message.warning('请输入代码');
      return;
    }
    try {
      const options: FormatOptions = { indentSize, useTabs };
      const result = await formatCode(input, language, options);
      setOutput(result);
      message.success('格式化成功');
    } catch (error) {
      message.error(`格式化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [input, language, indentSize, useTabs]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      message.warning('请输入代码');
      return;
    }
    try {
      const result = minifyCode(input, language);
      setOutput(result);
      message.success('压缩成功');
    } catch (error) {
      message.error(`压缩失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [input, language]);

  const handleSyntaxCheck = useCallback(() => {
    if (!input.trim()) {
      message.warning('请输入代码');
      return;
    }
    const result = checkSyntax(input, language);
    setSyntaxResult(result);
    if (result.valid && result.warnings.length === 0) {
      message.success('语法检查通过');
    } else if (result.valid) {
      message.info('语法正确，但有一些建议');
    } else {
      message.error('发现语法错误');
    }
  }, [input, language]);

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
    setSyntaxResult(null);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'error': return '#ff4d4f';
      case 'warning': return '#faad14';
      case 'info': return '#1890ff';
      default: return '#666';
    }
  };

  return (
    <Space orientation="vertical" style={{ width: '100%' }} size="middle">
      {/* 选项区域 */}
      <Row gutter={16} align="middle">
        <Col>
          <Space>
            <span>语言:</span>
            <Select
              value={language}
              onChange={(v) => { setLanguage(v); setSyntaxResult(null); }}
              options={generalLanguages}
              style={{ width: 130 }}
              showSearch
              optionFilterProp="label"
            />
          </Space>
        </Col>
        <Col>
          <Space>
            <span>缩进:</span>
            <Select
              value={indentSize}
              onChange={setIndentSize}
              options={indentSizeOptions}
              style={{ width: 100 }}
              disabled={useTabs}
            />
          </Space>
        </Col>
        <Col>
          <Space>
            <span>Tab:</span>
            <Switch checked={useTabs} onChange={setUseTabs} size="small" />
          </Space>
        </Col>
      </Row>

      {/* 输入区域 - 带语法高亮 */}
      <div>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>输入代码</div>
        <CodeEditor
          value={input}
          onChange={setInput}
          language={language}
          placeholder={currentLanguage?.placeholder}
          rows={10}
        />
      </div>

      {/* 操作按钮 */}
      <Space wrap>
        <Tooltip title="格式化"><Button type="primary" icon={<FormatPainterOutlined />} onClick={handleFormat}>格式化</Button></Tooltip>
        <Tooltip title="压缩"><Button icon={<CompressOutlined />} onClick={handleMinify}>压缩</Button></Tooltip>
        <Tooltip title="语法检查"><Button icon={<CheckCircleOutlined />} onClick={handleSyntaxCheck}>语法检查</Button></Tooltip>
        <Tooltip title="复制"><Button icon={<CopyOutlined />} onClick={handleCopy}>复制</Button></Tooltip>
        <Tooltip title="清空"><Button icon={<ClearOutlined />} onClick={handleClear}>清空</Button></Tooltip>
      </Space>

      {/* 语法检查结果 */}
      {syntaxResult && (
        <div>
          {syntaxResult.valid && syntaxResult.warnings.length === 0 ? (
            <Alert title="语法检查通过" type="success" icon={<CheckCircleOutlined />} showIcon />
          ) : (
            <>
              {syntaxResult.errors.length > 0 && (
                <Alert
                  message="语法错误"
                  description={
                    <List
                      size="small"
                      dataSource={syntaxResult.errors}
                      renderItem={(err) => (
                        <List.Item style={{ padding: '4px 0', color: getSeverityColor(err.severity) }}>
                          行 {err.line}, 列 {err.column}: {err.message}
                        </List.Item>
                      )}
                    />
                  }
                  type="error"
                  showIcon
                />
              )}
              {syntaxResult.warnings.length > 0 && (
                <Alert
                  message="建议"
                  description={
                    <List
                      size="small"
                      dataSource={syntaxResult.warnings}
                      renderItem={(warn) => (
                        <List.Item style={{ padding: '4px 0', color: getSeverityColor(warn.severity) }}>
                          行 {warn.line}, 列 {warn.column}: {warn.message}
                        </List.Item>
                      )}
                    />
                  }
                  type="warning"
                  showIcon
                  style={{ marginTop: syntaxResult.errors.length > 0 ? 8 : 0 }}
                />
              )}
            </>
          )}
        </div>
      )}

      {/* 输出区域 - 带语法高亮 */}
      <div>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>输出结果</div>
        <CodeEditor
          value={output}
          language={language}
          readOnly
          rows={10}
        />
      </div>
    </Space>
  );
};

export default GeneralTab;
