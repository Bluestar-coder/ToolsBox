import React, { useCallback, useState, useRef, useEffect } from 'react';
import { Card, Input, Button, Space, Tabs, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useAppContext } from '../../../../hooks/useAppContext';
import { executeEncodeDecode, getEncoderDisplayName } from '../../utils/encoders';
import type { EncoderType, OperationType } from '../../utils/encoders';
import { validateBase64, validateBase64Url, validateBase32, validateBase16, validateJson } from '../../../../utils/validators';
import { baseEncoders, utfEncoders, otherEncoders } from '../../utils/constants';
import styles from './EncodingTab.module.css';

const { TextArea } = Input;

interface ValidationResult {
  valid: boolean;
  error?: string;
}

interface EncodingTabProps {
  activeCategory: 'base' | 'utf' | 'other';
}

const EncodingTab: React.FC<EncodingTabProps> = ({ activeCategory }) => {
  const { state, dispatch } = useAppContext();
  const [error, setError] = useState<string>('');
  const [isImageMode, setIsImageMode] = useState<boolean>(false);
  const lastProcessedRef = useRef<string>('');

  const getCurrentEncoders = () => {
    if (activeCategory === 'base') return baseEncoders;
    if (activeCategory === 'utf') return utfEncoders;
    return otherEncoders;
  };

  // 处理编码/解码逻辑
  const doProcess = useCallback((input: string, type: EncoderType, operation: OperationType): string => {
    if (!input.trim()) {
      return '';
    }

    const validators: ((input: string) => ValidationResult)[] = [];

    if (operation === 'decode') {
      switch (type) {
        case 'base64':
          validators.push(validateBase64);
          break;
        case 'base64url':
          validators.push(validateBase64Url);
          break;
        case 'base32':
        case 'base32hex':
          validators.push(validateBase32);
          break;
        case 'base16':
          validators.push(validateBase16);
          break;
        case 'json':
          validators.push(validateJson);
          break;
        default:
          break;
      }
    }

    if (validators.length > 0) {
      for (const validator of validators) {
        const validationResult = validator(input);
        if (!validationResult.valid) {
          throw new Error(validationResult.error || '输入验证失败');
        }
      }
    }

    const result = executeEncodeDecode(input, type, operation);

    if (result.success) {
      return result.result;
    } else {
      throw new Error(result.error || '发生未知错误');
    }
  }, []);

  // 使用 useEffect 处理输入变化，通过 ref 防止重复处理
  useEffect(() => {
    const key = `${state.currentInput}|${state.currentType}|${state.currentOperation}|${isImageMode}`;
    if (lastProcessedRef.current === key) {
      return;
    }
    lastProcessedRef.current = key;

    if (!state.currentInput.trim() || isImageMode) {
      if (state.currentOutput !== '') {
        dispatch({ type: 'SET_CURRENT_OUTPUT', payload: '' });
      }
      setError('');
      return;
    }

    try {
      const output = doProcess(state.currentInput, state.currentType, state.currentOperation);
      dispatch({ type: 'SET_CURRENT_OUTPUT', payload: output });
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生意外错误');
      dispatch({ type: 'SET_CURRENT_OUTPUT', payload: '' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.currentInput, state.currentType, state.currentOperation, isImageMode, dispatch, doProcess]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_CURRENT_INPUT', payload: e.target.value });
    setIsImageMode(false);
  };

  const handleTypeChange = (type: EncoderType) => {
    dispatch({ type: 'SET_CURRENT_TYPE', payload: type });
  };

  const handleOperationChange = (operation: OperationType) => {
    dispatch({ type: 'SET_CURRENT_OPERATION', payload: operation });
  };

  const copyToClipboard = async () => {
    if (!state.currentOutput && !state.currentInput) {
      message.warning('没有可复制的内容');
      return;
    }
    try {
      const textToCopy = state.currentOutput || state.currentInput;
      await navigator.clipboard.writeText(textToCopy);
      message.success('已复制到剪贴板！');
    } catch {
      message.error('复制到剪贴板失败');
    }
  };

  const downloadImage = () => {
    if (!state.currentOutput) {
      message.warning('没有可下载的图片');
      return;
    }
    try {
      const link = document.createElement('a');
      link.href = state.currentOutput;
      link.download = `image_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('图片下载成功');
    } catch {
      message.error('图片下载失败');
    }
  };

  const handleClear = () => {
    dispatch({ type: 'SET_CURRENT_INPUT', payload: '' });
    dispatch({ type: 'SET_CURRENT_OUTPUT', payload: '' });
    setError('');
    setIsImageMode(false);
  };

  return (
    <>
      <Tabs
        activeKey={state.currentType}
        onChange={(key) => handleTypeChange(key as EncoderType)}
        items={getCurrentEncoders().map(type => ({
          key: type,
          label: getEncoderDisplayName(type)
        }))}
        size="small"
        className={styles.typeSelect}
      />

      <TextArea
        value={state.currentInput}
        onChange={handleInputChange}
        placeholder="请在这里填写原文/密文"
        rows={8}
        className={styles.inputWrapper}
      />

      <Space className={styles.buttonGroup}>
        <Button type="primary" className={styles.encodeButton} onClick={() => handleOperationChange('encode')}>
          编码
        </Button>
        <Button type="primary" onClick={() => handleOperationChange('decode')}>
          解码
        </Button>
        <Button className={styles.copyButton} onClick={copyToClipboard}>
          复制
        </Button>
        <Button danger onClick={handleClear}>
          清空
        </Button>
      </Space>

      {(state.currentOutput || error) && (
        <Card
          size="small"
          className={error ? styles.outputCardError : styles.outputCardSuccess}
        >
          {error ? (
            <div className={styles.errorMessage}>{error}</div>
          ) : (
            <>
              <TextArea
                value={state.currentOutput}
                readOnly
                rows={6}
                className={styles.outputWrapper}
                style={{
                  backgroundColor: 'transparent',
                  border: 'none'
                }}
              />
              <Space>
                <Button size="small" onClick={handleClear}>清空</Button>
                {isImageMode && state.currentOutput && (
                  <Button icon={<DownloadOutlined />} onClick={downloadImage} size="small">
                    下载图片
                  </Button>
                )}
              </Space>
            </>
          )}
        </Card>
      )}
    </>
  );
};

export default EncodingTab;
