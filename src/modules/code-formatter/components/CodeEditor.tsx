import React, { useRef, useCallback, useEffect, useState } from 'react';
import Prism from 'prismjs';
import DOMPurify from 'dompurify';
import { logger } from '../../../utils/logger';

import '../styles/prism-theme.css';

// 动态导入Prism语言包的hook
const usePrismLanguage = (language: string) => {
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadLanguage = async () => {
      const languageImports: Record<string, () => Promise<unknown>> = {
        javascript: () => import('prismjs/components/prism-javascript'),
        typescript: () => import('prismjs/components/prism-typescript'),
        json: () => import('prismjs/components/prism-json'),
        sql: () => import('prismjs/components/prism-sql'),
        yaml: () => import('prismjs/components/prism-yaml'),
        python: () => import('prismjs/components/prism-python'),
        java: () => import('prismjs/components/prism-java'),
        markup: () => import('prismjs/components/prism-markup'),
        css: () => import('prismjs/components/prism-css'),
        clike: () => import('prismjs/components/prism-clike'),
      };

      const loader = languageImports[language];
      if (loader) {
        try {
          await loader();
        } catch {
          logger.warn(`Failed to load Prism language: ${language}`);
        }
      }
      setLoaded(true);
    };

    loadLanguage();
  }, [language]);

  return loaded;
};

// 语言映射
const languageMap: Record<string, string> = {
  json: 'json',
  javascript: 'javascript',
  typescript: 'typescript',
  html: 'markup',
  xml: 'markup',
  css: 'css',
  sql: 'sql',
  yaml: 'yaml',
  python: 'python',
  java: 'java',
  http: 'http',
};

interface CodeEditorProps {
  value: string;
  onChange?: (value: string) => void;
  language: string;
  placeholder?: string;
  readOnly?: boolean;
  rows?: number;
  style?: React.CSSProperties;
}

// HTTP 自定义高亮 - Monokai Pro 配色
function highlightHttp(code: string): string {
  // Monokai Pro 颜色
  const colors = {
    keyword: '#ff6188',    // 红色/粉色 - 方法
    function: '#a9dc76',   // 绿色 - HTTP版本
    number: '#ab9df2',     // 紫色 - 状态码
    property: '#78dce8',   // 青色 - 头部名称
    string: '#ffd866',     // 黄色 - 字符串值
    comment: '#727072',    // 灰色 - 注释
  };

  return code
    // 请求方法 - 红色/粉色
    .replace(/^(GET|POST|PUT|DELETE|PATCH|HEAD|OPTIONS|TRACE|CONNECT)\b/gm, 
      `<span style="color:${colors.keyword};font-weight:bold">$1</span>`)
    // HTTP 版本 - 绿色
    .replace(/(HTTP\/[\d.]+)/g, 
      `<span style="color:${colors.function}">$1</span>`)
    // 状态码 - 紫色
    .replace(/\b([1-5]\d{2})\b/g, 
      `<span style="color:${colors.number}">$1</span>`)
    // 头部名称 - 青色
    .replace(/^([A-Za-z-]+):/gm, 
      `<span style="color:${colors.property}">$1</span>:`)
    // 注释 - 灰色
    .replace(/^(#.*)$/gm, 
      `<span style="color:${colors.comment};font-style:italic">$1</span>`)
    // URL 路径 - 黄色
    .replace(/(\s)(\/[^\s]*)/g, 
      `$1<span style="color:${colors.string}">$2</span>`)
    // 字符串值 - 黄色
    .replace(/: (.+)$/gm, 
      `: <span style="color:${colors.string}">$1</span>`);
}

const CodeEditor: React.FC<CodeEditorProps> = ({
  value,
  onChange,
  language,
  placeholder = '',
  readOnly = false,
  rows = 10,
  style,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const highlightRef = useRef<HTMLPreElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const prismLanguage = languageMap[language] || 'plaintext';

  // 动态加载语言包
  usePrismLanguage(prismLanguage);

  // 获取高亮后的 HTML
  const getHighlightedCode = useCallback((code: string) => {
    if (!code) return '';
    
    if (language === 'http') {
      return highlightHttp(code.replace(/</g, '&lt;').replace(/>/g, '&gt;'));
    }
    
    try {
      const grammar = Prism.languages[prismLanguage];
      if (grammar) {
        return Prism.highlight(code, grammar, prismLanguage);
      }
    } catch {
      // fallback
    }
    return code.replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }, [language, prismLanguage]);

  // 同步滚动
  const syncScroll = useCallback(() => {
    if (textareaRef.current && highlightRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
      highlightRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  }, [onChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Tab 键插入空格
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const newValue = value.substring(0, start) + '  ' + value.substring(end);
      onChange?.(newValue);
      // 恢复光标位置
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  }, [value, onChange]);

  const lineHeight = 20;
  const minHeight = rows * lineHeight + 24;

  // Monokai Pro 配色
  const bgColor = '#2d2a2e';
  const textColor = '#fcfcfa';

  return (
    <div
      ref={containerRef}
      style={{
        position: 'relative',
        minHeight,
        fontFamily: '"Fira Code", "Fira Mono", Menlo, Consolas, "DejaVu Sans Mono", monospace',
        fontSize: '13px',
        lineHeight: `${lineHeight}px`,
        borderRadius: 6,
        border: '1px solid #5b595c',
        overflow: 'hidden',
        backgroundColor: bgColor,
        ...style,
      }}
    >
      {/* 高亮层 */}
      <pre
        ref={highlightRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          margin: 0,
          padding: '12px',
          overflow: 'auto',
          pointerEvents: 'none',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          color: textColor,
          backgroundColor: 'transparent',
        }}
        dangerouslySetInnerHTML={{
          __html: DOMPurify.sanitize(
            getHighlightedCode(value) + (value.endsWith('\n') ? ' ' : '')
          ),
        }}
      />
      
      {/* 输入层 */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={handleChange}
        onScroll={syncScroll}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        readOnly={readOnly}
        spellCheck={false}
        style={{
          position: 'relative',
          width: '100%',
          minHeight,
          margin: 0,
          padding: '12px',
          border: 'none',
          outline: 'none',
          resize: 'vertical',
          fontFamily: 'inherit',
          fontSize: 'inherit',
          lineHeight: 'inherit',
          whiteSpace: 'pre-wrap',
          wordWrap: 'break-word',
          color: 'transparent',
          caretColor: textColor,
          backgroundColor: 'transparent',
          overflow: 'auto',
        }}
      />
    </div>
  );
};

// 使用React.memo优化性能，只在props变化时重新渲染
export default React.memo(CodeEditor, (prevProps, nextProps) => {
  return (
    prevProps.value === nextProps.value &&
    prevProps.readOnly === nextProps.readOnly &&
    prevProps.language === nextProps.language &&
    prevProps.placeholder === nextProps.placeholder &&
    prevProps.rows === nextProps.rows &&
    prevProps.onChange === nextProps.onChange
  );
});
