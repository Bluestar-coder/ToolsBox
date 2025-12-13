import React, { useState, useCallback, useMemo } from 'react';
import {
  Input, Button, Space, message, Select, Row, Col, Tooltip, Slider, Tree, Tabs, Descriptions, Badge, Alert, List,
} from 'antd';
import {
  CopyOutlined, ClearOutlined, FormatPainterOutlined, CompressOutlined,
  ApartmentOutlined, SearchOutlined, SwapOutlined, UnlockOutlined, LockOutlined, CheckCircleOutlined,
} from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import { formatJSON, minifyJSON } from '../../utils/formatters';
import {
  parseJsonToTree, getJsonDepth, expandToDepth, unescapeJson, escapeJson,
  getJsonStats, queryJsonPath, compareJson, type JsonNode, type JsonStats,
} from '../../utils/json-utils';
import { checkJsonSyntax, type SyntaxCheckResult } from '../../utils/syntax-checker';
import CodeEditor from '../CodeEditor';

const { TextArea } = Input;

const indentOptions = [
  { value: 2, label: '2 空格' },
  { value: 4, label: '4 空格' },
];

type ViewMode = 'tree' | 'compare';

const JsonTab: React.FC = () => {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [indentSize, setIndentSize] = useState(2);
  const [viewMode, setViewMode] = useState<ViewMode>('tree');
  const [expandDepth, setExpandDepth] = useState(2);
  const [jsonPath, setJsonPath] = useState('');
  const [pathResult, setPathResult] = useState('');
  const [compareInput, setCompareInput] = useState('');
  const [compareResult, setCompareResult] = useState('');
  const [stats, setStats] = useState<JsonStats | null>(null);
  const [syntaxResult, setSyntaxResult] = useState<SyntaxCheckResult | null>(null);

  // 解析 JSON 树
  const treeData = useMemo((): DataNode[] => {
    if (!output) return [];
    try {
      const tree = parseJsonToTree(output);
      return [convertToAntdTree(tree)];
    } catch {
      return [];
    }
  }, [output]);

  // 最大深度
  const maxDepth = useMemo(() => {
    if (!output) return 1;
    try {
      return getJsonDepth(output);
    } catch {
      return 1;
    }
  }, [output]);

  const handleFormat = useCallback(() => {
    if (!input.trim()) {
      message.warning('请输入 JSON');
      return;
    }
    // 先进行语法检查
    const checkResult = checkJsonSyntax(input);
    setSyntaxResult(checkResult);
    
    if (!checkResult.valid) {
      message.error('JSON 语法错误，请检查');
      return;
    }
    
    try {
      const result = formatJSON(input, { indentSize, useTabs: false });
      setOutput(result);
      setStats(getJsonStats(input));
      message.success('格式化成功');
    } catch (error) {
      message.error(`格式化失败: ${error instanceof Error ? error.message : '无效的 JSON'}`);
    }
  }, [input, indentSize]);

  const handleSyntaxCheck = useCallback(() => {
    if (!input.trim()) {
      message.warning('请输入 JSON');
      return;
    }
    const result = checkJsonSyntax(input);
    setSyntaxResult(result);
    if (result.valid) {
      message.success('语法检查通过');
    } else {
      message.error('发现语法错误');
    }
  }, [input]);

  const handleMinify = useCallback(() => {
    if (!input.trim()) {
      message.warning('请输入 JSON');
      return;
    }
    try {
      const result = minifyJSON(input);
      setOutput(result);
      message.success('压缩成功');
    } catch (error) {
      message.error(`压缩失败: ${error instanceof Error ? error.message : '无效的 JSON'}`);
    }
  }, [input]);

  const handleExpandToDepth = useCallback(() => {
    if (!input.trim()) {
      message.warning('请输入 JSON');
      return;
    }
    try {
      const result = expandToDepth(input, expandDepth, indentSize);
      setOutput(result);
      message.success(`已展开到第 ${expandDepth} 层`);
    } catch (error) {
      message.error(`操作失败: ${error instanceof Error ? error.message : '无效的 JSON'}`);
    }
  }, [input, expandDepth, indentSize]);

  const handleUnescape = useCallback(() => {
    if (!input.trim()) {
      message.warning('请输入内容');
      return;
    }
    try {
      const result = unescapeJson(input);
      setOutput(result);
      message.success('转义已移除');
    } catch (error) {
      message.error(`操作失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [input]);

  const handleEscape = useCallback(() => {
    if (!input.trim()) {
      message.warning('请输入内容');
      return;
    }
    const result = escapeJson(input);
    setOutput(result);
    message.success('已添加转义');
  }, [input]);

  const handlePathQuery = useCallback(() => {
    if (!output || !jsonPath) {
      message.warning('请先格式化 JSON 并输入查询路径');
      return;
    }
    try {
      const results = queryJsonPath(output, jsonPath);
      setPathResult(JSON.stringify(results, null, 2));
      message.success(`找到 ${results.length} 个结果`);
    } catch (error) {
      message.error(`查询失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [output, jsonPath]);

  const handleCompare = useCallback(() => {
    if (!output || !compareInput) {
      message.warning('请输入两个 JSON 进行比较');
      return;
    }
    try {
      const result = compareJson(output, compareInput);
      setCompareResult(result.diff);
      if (result.equal) {
        message.success('两个 JSON 完全相同');
      } else {
        message.info('发现差异');
      }
    } catch (error) {
      message.error(`比较失败: ${error instanceof Error ? error.message : '未知错误'}`);
    }
  }, [output, compareInput]);

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
    setStats(null);
    setPathResult('');
    setCompareResult('');
    setSyntaxResult(null);
  }, []);

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      {/* 输入区域 - 带语法高亮 */}
      <div>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>输入 JSON</div>
        <CodeEditor
          value={input}
          onChange={setInput}
          language="json"
          placeholder='{"name": "example", "items": [1, 2, 3]}'
          rows={8}
        />
      </div>

      {/* 操作按钮 */}
      <Row gutter={[8, 8]} align="middle">
        <Col>
          <Space wrap>
            <Select value={indentSize} onChange={setIndentSize} options={indentOptions} style={{ width: 90 }} />
            <Tooltip title="格式化"><Button type="primary" icon={<FormatPainterOutlined />} onClick={handleFormat}>格式化</Button></Tooltip>
            <Tooltip title="压缩"><Button icon={<CompressOutlined />} onClick={handleMinify}>压缩</Button></Tooltip>
            <Tooltip title="语法检查"><Button icon={<CheckCircleOutlined />} onClick={handleSyntaxCheck}>检查</Button></Tooltip>
            <Tooltip title="移除转义"><Button icon={<UnlockOutlined />} onClick={handleUnescape}>去转义</Button></Tooltip>
            <Tooltip title="添加转义"><Button icon={<LockOutlined />} onClick={handleEscape}>加转义</Button></Tooltip>
            <Tooltip title="复制"><Button icon={<CopyOutlined />} onClick={handleCopy}>复制</Button></Tooltip>
            <Tooltip title="清空"><Button icon={<ClearOutlined />} onClick={handleClear}>清空</Button></Tooltip>
          </Space>
        </Col>
      </Row>

      {/* 层级展开控制 */}
      <Row gutter={16} align="middle">
        <Col flex="none"><span>展开层级:</span></Col>
        <Col flex="auto" style={{ maxWidth: 200 }}>
          <Slider min={1} max={Math.max(maxDepth, 5)} value={expandDepth} onChange={setExpandDepth} />
        </Col>
        <Col flex="none">
          <Button icon={<ApartmentOutlined />} onClick={handleExpandToDepth}>按层级展开</Button>
        </Col>
      </Row>

      {/* 输出区域 - 带语法高亮 */}
      <div>
        <div style={{ marginBottom: 8, fontWeight: 500 }}>输出结果</div>
        <CodeEditor
          value={output}
          language="json"
          readOnly
          rows={10}
        />
      </div>

      {/* 扩展视图 */}
      <Tabs
        activeKey={viewMode}
        onChange={(k) => setViewMode(k as ViewMode)}
        items={[
          {
            key: 'tree',
            label: '树形视图',
            children: (
              <div style={{ maxHeight: 300, overflow: 'auto', border: '1px solid #d9d9d9', borderRadius: 6, padding: 8 }}>
                {treeData.length > 0 ? (
                  <Tree treeData={treeData} defaultExpandAll showLine />
                ) : (
                  <div style={{ color: '#999', padding: 16 }}>请先格式化 JSON</div>
                )}
              </div>
            ),
          },
          {
            key: 'compare',
            label: 'JSON 比较',
            children: (
              <Space direction="vertical" style={{ width: '100%' }}>
                <CodeEditor
                  value={compareInput}
                  onChange={setCompareInput}
                  language="json"
                  placeholder="输入要比较的第二个 JSON"
                  rows={5}
                />
                <Button icon={<SwapOutlined />} onClick={handleCompare}>比较差异</Button>
                {compareResult && (
                  <TextArea value={compareResult} readOnly rows={5} style={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5' }} />
                )}
              </Space>
            ),
          },
        ]}
      />

      {/* JSONPath 查询 */}
      <Row gutter={8}>
        <Col flex="auto">
          <Input
            value={jsonPath}
            onChange={(e) => setJsonPath(e.target.value)}
            placeholder="JSONPath 查询，如: $.name 或 $..id"
            prefix={<SearchOutlined />}
          />
        </Col>
        <Col flex="none">
          <Button onClick={handlePathQuery}>查询</Button>
        </Col>
      </Row>
      {pathResult && (
        <TextArea value={pathResult} readOnly rows={3} style={{ fontFamily: 'monospace', backgroundColor: '#f5f5f5' }} />
      )}

      {/* 语法检查结果 */}
      {syntaxResult && (
        <div>
          {syntaxResult.valid ? (
            <Alert message="JSON 语法检查通过" type="success" icon={<CheckCircleOutlined />} showIcon />
          ) : (
            <Alert
              message="JSON 语法错误"
              description={
                <List
                  size="small"
                  dataSource={syntaxResult.errors}
                  renderItem={(err) => (
                    <List.Item style={{ padding: '4px 0', color: '#ff4d4f' }}>
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
              message="警告"
              description={
                <List
                  size="small"
                  dataSource={syntaxResult.warnings}
                  renderItem={(warn) => (
                    <List.Item style={{ padding: '4px 0' }}>
                      行 {warn.line}, 列 {warn.column}: {warn.message}
                    </List.Item>
                  )}
                />
              }
              type="warning"
              showIcon
              style={{ marginTop: 8 }}
            />
          )}
        </div>
      )}

      {/* 统计信息 */}
      {stats && (
        <Descriptions size="small" column={4} bordered>
          <Descriptions.Item label="总键数"><Badge count={stats.totalKeys} showZero color="blue" /></Descriptions.Item>
          <Descriptions.Item label="最大深度"><Badge count={stats.maxDepth} showZero color="green" /></Descriptions.Item>
          <Descriptions.Item label="对象数"><Badge count={stats.objectCount} showZero color="purple" /></Descriptions.Item>
          <Descriptions.Item label="数组数"><Badge count={stats.arrayCount} showZero color="orange" /></Descriptions.Item>
          <Descriptions.Item label="字符串"><Badge count={stats.stringCount} showZero color="cyan" /></Descriptions.Item>
          <Descriptions.Item label="数字"><Badge count={stats.numberCount} showZero color="gold" /></Descriptions.Item>
          <Descriptions.Item label="布尔值"><Badge count={stats.booleanCount} showZero color="lime" /></Descriptions.Item>
          <Descriptions.Item label="Null"><Badge count={stats.nullCount} showZero color="gray" /></Descriptions.Item>
        </Descriptions>
      )}
    </Space>
  );
};

// 转换为 Antd Tree 数据格式
function convertToAntdTree(node: JsonNode): DataNode {
  const getTitle = () => {
    const keyPart = node.key;
    if (node.type === 'object') {
      return <span><strong>{keyPart}</strong>: <span style={{ color: '#666' }}>{`{${node.children?.length || 0}}`}</span></span>;
    }
    if (node.type === 'array') {
      return <span><strong>{keyPart}</strong>: <span style={{ color: '#666' }}>{`[${node.children?.length || 0}]`}</span></span>;
    }
    if (node.type === 'string') {
      return <span><strong>{keyPart}</strong>: <span style={{ color: '#0a0' }}>"{String(node.value)}"</span></span>;
    }
    if (node.type === 'number') {
      return <span><strong>{keyPart}</strong>: <span style={{ color: '#00f' }}>{String(node.value)}</span></span>;
    }
    if (node.type === 'boolean') {
      return <span><strong>{keyPart}</strong>: <span style={{ color: '#a0a' }}>{String(node.value)}</span></span>;
    }
    if (node.type === 'null') {
      return <span><strong>{keyPart}</strong>: <span style={{ color: '#999' }}>null</span></span>;
    }
    return keyPart;
  };

  return {
    key: node.path,
    title: getTitle(),
    children: node.children?.map(convertToAntdTree),
  };
}

export default JsonTab;
