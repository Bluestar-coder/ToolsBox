import React, { useState, useCallback } from 'react';
import { Button, Space, message, Row, Col, Tooltip, Tag, Alert, List } from 'antd';
import {
  CopyOutlined, ClearOutlined, FormatPainterOutlined, CompressOutlined,
  FontSizeOutlined, CheckCircleOutlined, TableOutlined,
} from '@ant-design/icons';
import { formatSQL, minifySQL } from '../../utils/formatters';
import {
  uppercaseKeywords, lowercaseKeywords, removeComments, extractTables,
  validateSql, parseSqlStatements, type SqlStatement, type SqlValidationResult,
} from '../../utils/sql-utils';
import CodeEditor from '../CodeEditor';

const SqlTab: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [validation, setValidation] = useState<SqlValidationResult | null>(null);
  const [statements, setStatements] = useState<SqlStatement[]>([]);
  const [tables, setTables] = useState<string[]>([]);

  const handleFormat = useCallback(() => {
    if (!input.trim()) {
      message.warning('请输入 SQL');
      return;
    }
    try {
      const result = formatSQL(input, { indentSize: 2, useTabs: false });
      setOutput(result);
      setValidation(validateSql(input));
      setStatements(parseSqlStatements(input));
      setTables(extractTables(input));
      message.success('格式化成功');
    } catch (error) {
      message.error(`格式化失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [input]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      message.warning('请输入 SQL');
      return;
    }
    const result = minifySQL(input);
    setOutput(result);
    message.success('压缩成功');
  }, [input]);

  const handleUppercase = useCallback(() => {
    if (!input.trim()) {
      message.warning('请输入 SQL');
      return;
    }
    const result = uppercaseKeywords(input);
    setOutput(result);
    message.success('关键字已转为大写');
  }, [input]);

  const handleLowercase = useCallback(() => {
    if (!input.trim()) {
      message.warning('请输入 SQL');
      return;
    }
    const result = lowercaseKeywords(input);
    setOutput(result);
    message.success('关键字已转为小写');
  }, [input]);

  const handleRemoveComments = useCallback(() => {
    if (!input.trim()) {
      message.warning('请输入 SQL');
      return;
    }
    const result = removeComments(input);
    setOutput(result);
    message.success('注释已移除');
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
    setStatements([]);
    setTables([]);
  }, []);

  const getStatementTypeColor = (type: SqlStatement['type']) => {
    const colors: Record<string, string> = {
      SELECT: 'blue',
      INSERT: 'green',
      UPDATE: 'orange',
      DELETE: 'red',
      CREATE: 'purple',
      ALTER: 'cyan',
      DROP: 'magenta',
      OTHER: 'default',
    };
    return colors[type] || 'default';
  };

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      {/* 输入区域 - 带语法高亮 */}
      <div>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>输入 SQL</div>
        <CodeEditor
          value={input}
          onChange={setInput}
          language="sql"
          placeholder="SELECT * FROM users WHERE id = 1 ORDER BY created_at DESC"
          rows={8}
        />
      </div>

      {/* 操作按钮 */}
      <Row gutter={[8, 8]}>
        <Col>
          <Space wrap>
            <Tooltip title="格式化"><Button type="primary" icon={<FormatPainterOutlined />} onClick={handleFormat}>格式化</Button></Tooltip>
            <Tooltip title="压缩"><Button icon={<CompressOutlined />} onClick={handleMinify}>压缩</Button></Tooltip>
            <Tooltip title="关键字大写"><Button icon={<FontSizeOutlined />} onClick={handleUppercase}>大写</Button></Tooltip>
            <Tooltip title="关键字小写"><Button onClick={handleLowercase}>小写</Button></Tooltip>
            <Tooltip title="移除注释"><Button onClick={handleRemoveComments}>去注释</Button></Tooltip>
            <Tooltip title="复制"><Button icon={<CopyOutlined />} onClick={handleCopy}>复制</Button></Tooltip>
            <Tooltip title="清空"><Button icon={<ClearOutlined />} onClick={handleClear}>清空</Button></Tooltip>
          </Space>
        </Col>
      </Row>

      {/* 输出区域 - 带语法高亮 */}
      <div>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>输出结果</div>
        <CodeEditor
          value={output}
          language="sql"
          readOnly
          rows={10}
        />
      </div>

      {/* 验证结果 */}
      {validation && (
        <div>
          {validation.valid ? (
            <Alert message="SQL 语法检查通过" type="success" icon={<CheckCircleOutlined />} showIcon />
          ) : (
            <Alert
              message="SQL 语法检查发现问题"
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
              style={{ marginTop: 8 }}
            />
          )}
        </div>
      )}

      {/* 语句分析 */}
      {statements.length > 0 && (
        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>语句分析</div>
          <List
            size="small"
            bordered
            dataSource={statements}
            renderItem={(stmt, index) => (
              <List.Item>
                <Space>
                  <Tag color={getStatementTypeColor(stmt.type)}>{stmt.type}</Tag>
                  <span>语句 {index + 1}</span>
                  {stmt.tables.length > 0 && (
                    <span>
                      <TableOutlined /> 表: {stmt.tables.join(', ')}
                    </span>
                  )}
                </Space>
              </List.Item>
            )}
          />
        </div>
      )}

      {/* 提取的表名 */}
      {tables.length > 0 && (
        <div>
          <div style={{ marginBottom: 8, fontWeight: 500 }}>涉及的表</div>
          <Space wrap>
            {tables.map((table) => (
              <Tag key={table} icon={<TableOutlined />} color="blue">{table}</Tag>
            ))}
          </Space>
        </div>
      )}
    </Space>
  );
};

export default SqlTab;
