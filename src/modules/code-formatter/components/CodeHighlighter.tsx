import React, { useEffect, useRef, useMemo } from 'react';
import Prism from 'prismjs';

// 导入语言支持 - 注意顺序很重要，依赖项需要先导入
import 'prismjs/components/prism-markup'; // HTML/XML - 必须在依赖它的语言之前
import 'prismjs/components/prism-css';
import 'prismjs/components/prism-clike'; // 很多语言依赖这个
import 'prismjs/components/prism-javascript';
import 'prismjs/components/prism-json';
import 'prismjs/components/prism-typescript';
import 'prismjs/components/prism-jsx';
import 'prismjs/components/prism-tsx';
import 'prismjs/components/prism-scss';
import 'prismjs/components/prism-less';
import 'prismjs/components/prism-sql';
import 'prismjs/components/prism-yaml';
import 'prismjs/components/prism-markdown';
import 'prismjs/components/prism-graphql';
import 'prismjs/components/prism-java';
import 'prismjs/components/prism-python';
import 'prismjs/components/prism-csharp';
import 'prismjs/components/prism-go';
import 'prismjs/components/prism-php-extras';
import 'prismjs/components/prism-php';

// 导入行号插件
import 'prismjs/plugins/line-numbers/prism-line-numbers';
import 'prismjs/plugins/line-numbers/prism-line-numbers.css';

// 语言映射
const languageMap: Record<string, string> = {
  json: 'json',
  javascript: 'javascript',
  typescript: 'typescript',
  html: 'markup',
  xml: 'markup',
  css: 'css',
  scss: 'scss',
  less: 'less',
  sql: 'sql',
  yaml: 'yaml',
  markdown: 'markdown',
  graphql: 'graphql',
  java: 'java',
  python: 'python',
  csharp: 'csharp',
  go: 'go',
  php: 'php',
  http: 'custom-http', // 使用自定义高亮
};

interface CodeHighlighterProps {
  code: string;
  language: string;
  showLineNumbers?: boolean;
  maxHeight?: number | string;
  style?: React.CSSProperties;
}

// HTTP 自定义高亮
function highlightHttp(code: string): React.ReactNode[] {
  const lines = code.split('\n');
  const result: React.ReactNode[] = [];
  
  lines.forEach((line, index) => {
    let highlighted: React.ReactNode;
    
    // 请求行: GET /path HTTP/1.1
    if (line.match(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|TRACE|CONNECT)\s/i)) {
      const parts = line.match(/^(\w+)\s+(.+?)\s+(HTTP\/[\d.]+)$/i);
      if (parts) {
        highlighted = (
          <span key={index}>
            <span style={{ color: '#d73a49', fontWeight: 'bold' }}>{parts[1]}</span>
            <span style={{ color: '#005cc5' }}> {parts[2]} </span>
            <span style={{ color: '#6f42c1' }}>{parts[3]}</span>
          </span>
        );
      } else {
        highlighted = <span key={index} style={{ color: '#d73a49' }}>{line}</span>;
      }
    }
    // 状态行: HTTP/1.1 200 OK
    else if (line.match(/^HTTP\//i)) {
      const parts = line.match(/^(HTTP\/[\d.]+)\s+(\d+)\s*(.*)$/i);
      if (parts) {
        const statusCode = parseInt(parts[2]);
        const statusColor = statusCode < 300 ? '#22863a' : statusCode < 400 ? '#e36209' : '#d73a49';
        highlighted = (
          <span key={index}>
            <span style={{ color: '#6f42c1' }}>{parts[1]}</span>
            <span style={{ color: statusColor, fontWeight: 'bold' }}> {parts[2]}</span>
            <span style={{ color: '#6a737d' }}> {parts[3]}</span>
          </span>
        );
      } else {
        highlighted = <span key={index}>{line}</span>;
      }
    }
    // 注释行: # Comment
    else if (line.trim().startsWith('#')) {
      highlighted = <span key={index} style={{ color: '#6a737d', fontStyle: 'italic' }}>{line}</span>;
    }
    // 头部: Header-Name: value
    else if (line.includes(':') && !line.startsWith(' ') && !line.startsWith('\t')) {
      const colonIndex = line.indexOf(':');
      const headerName = line.substring(0, colonIndex);
      const headerValue = line.substring(colonIndex + 1);
      highlighted = (
        <span key={index}>
          <span style={{ color: '#005cc5' }}>{headerName}</span>
          <span style={{ color: '#393a34' }}>:</span>
          <span style={{ color: '#22863a' }}>{headerValue}</span>
        </span>
      );
    }
    // JSON 内容
    else if (line.trim().startsWith('{') || line.trim().startsWith('[') || line.trim().startsWith('"')) {
      highlighted = <span key={index} style={{ color: '#032f62' }}>{line}</span>;
    }
    // 其他
    else {
      highlighted = <span key={index}>{line}</span>;
    }
    
    result.push(highlighted);
    if (index < lines.length - 1) {
      result.push('\n');
    }
  });
  
  return result;
}

const CodeHighlighter: React.FC<CodeHighlighterProps> = ({
  code,
  language,
  showLineNumbers = true,
  maxHeight = 400,
  style,
}) => {
  const codeRef = useRef<HTMLElement>(null);
  const prismLanguage = languageMap[language] || 'plaintext';
  const isCustomHttp = prismLanguage === 'custom-http';

  // HTTP 使用自定义高亮
  const httpHighlighted = useMemo(() => {
    if (isCustomHttp) {
      return highlightHttp(code);
    }
    return null;
  }, [code, isCustomHttp]);

  useEffect(() => {
    if (codeRef.current && code && !isCustomHttp) {
      Prism.highlightElement(codeRef.current);
    }
  }, [code, language, isCustomHttp]);

  return (
    <div
      style={{
        maxHeight,
        overflow: 'auto',
        borderRadius: 6,
        border: '1px solid #d9d9d9',
        ...style,
      }}
    >
      <pre
        className={showLineNumbers && !isCustomHttp ? 'line-numbers' : ''}
        style={{
          margin: 0,
          padding: '12px',
          fontSize: '13px',
          lineHeight: '1.5',
          backgroundColor: '#f6f8fa',
          overflow: 'visible',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
        }}
      >
        {isCustomHttp ? (
          <code style={{ fontFamily: '"Fira Code", "Fira Mono", Menlo, Consolas, monospace' }}>
            {httpHighlighted}
          </code>
        ) : (
          <code ref={codeRef} className={`language-${prismLanguage}`}>
            {code}
          </code>
        )}
      </pre>
    </div>
  );
};

export default CodeHighlighter;
