import React, { Suspense, lazy, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import type { EncoderCategoryKey } from '../modules/encoder-decoder/components/EncoderDecoder';
import { useEncodingContext } from '../hooks/useEncodingContext';
import type { EncoderType, OperationType } from '../modules/encoder-decoder/utils/encoders';
import { baseEncoders, otherEncoders, utfEncoders } from '../modules/encoder-decoder/utils/constants';
import ModulePageShell from '../components/ModulePageShell';
import { EncodingProvider } from '../context/EncodingContext';

const LazyEncoderDecoder = lazy(() => import('../modules/encoder-decoder/components/EncoderDecoder'));

function resolveEncoderCategory(type?: string): EncoderCategoryKey {
  if (!type) {
    return 'smart';
  }
  if (baseEncoders.includes(type as EncoderType)) {
    return 'base';
  }
  if (utfEncoders.includes(type as EncoderType)) {
    return 'utf';
  }
  if (otherEncoders.includes(type as EncoderType)) {
    return 'other';
  }
  return 'smart';
}

/**
 * 编码/解码工具页面组件
 * 负责从URL参数读取状态并同步到Context
 */
const EncoderPageContent: React.FC = () => {
  const { type } = useParams<{ type?: string }>();
  const [searchParams] = useSearchParams();
  const { state, setType, setOperation, setInput } = useEncodingContext();
  const initialCategory = resolveEncoderCategory(type);

  // 从URL参数同步编码类型
  useEffect(() => {
    if (type && type !== state.currentType) {
      // 验证是否是有效的编码类型
      const validTypes: EncoderType[] = ['base64', 'base16', 'base32', 'base32hex', 'base36', 'base64url', 'base58', 'base62', 'base85', 'base91', 'url', 'html', 'json', 'unicode', 'utf7', 'utf8', 'utf16be', 'utf16le', 'utf32be', 'utf32le'];
      if (validTypes.includes(type as EncoderType)) {
        setType(type as EncoderType);
      }
    }
  }, [type, state.currentType, setType]);

  // 从URL参数同步操作模式
  useEffect(() => {
    const mode = searchParams.get('mode');
    if (mode && (mode === 'encode' || mode === 'decode') && mode !== state.currentOperation) {
      setOperation(mode as OperationType);
    }
  }, [searchParams, state.currentOperation, setOperation]);

  // 从URL参数同步输入内容（可选）
  useEffect(() => {
    const input = searchParams.get('input');
    if (input !== null && input !== state.currentInput) {
      try {
        // URL decode输入内容
        setInput(decodeURIComponent(input));
      } catch {
        // 如果解码失败，直接使用原始值
        setInput(input);
      }
    }
  }, [searchParams, state.currentInput, setInput]);

  return (
    <ModulePageShell moduleId="encoder-decoder">
      <Suspense fallback={null}>
        <LazyEncoderDecoder initialCategory={initialCategory} />
      </Suspense>
    </ModulePageShell>
  );
};

const EncoderPage: React.FC = () => (
  <EncodingProvider>
    <EncoderPageContent />
  </EncodingProvider>
);

export default EncoderPage;
