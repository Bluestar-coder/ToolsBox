import React, { useEffect, useCallback, useState } from 'react';
import { Card, Input, Button, Space, Tabs, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { useAppContext } from '../../../../hooks/useAppContext';
import { executeEncodeDecode, getEncoderDisplayName } from '../../utils/encoders';
import type { EncoderType, OperationType } from '../../utils/encoders';
import { validateBase64, validateBase64Url, validateBase32, validateBase16, validateJson } from '../../../../utils/validators';
import { baseEncoders, utfEncoders, otherEncoders } from '../../utils/constants';

const { TextArea } = Input;

interface EncodingTabProps {
  activeCategory: 'base' | 'utf' | 'other';
}

const EncodingTab: React.FC<EncodingTabProps> = ({ activeCategory }) => {
  const { state, dispatch } = useAppContext();
  const [error, setError] = useState<string>('');
  const [isImageMode, setIsImageMode] = useState<boolean>(false);

  const getCurrentEncoders = () => {
    if (activeCategory === 'base') return baseEncoders;
    if (activeCategory === 'utf') return utfEncoders;
    return otherEncoders;
  };

  const processInput = useCallback(() => {
    setError('');

    try {
      const { currentInput, currentType, currentOperation } = state;
      
      if (!currentInput.trim()) {
        dispatch({ type: 'SET_CURRENT_OUTPUT', payload: '' });
        return;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let validators: ((input: string) => any)[] = [];
      
      if (currentOperation === 'decode') {
        switch (currentType) {
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
          const validationResult = validator(currentInput);
          if (!validationResult.valid) {
            setError(validationResult.error || '输入验证失败');
            dispatch({ type: 'SET_CURRENT_OUTPUT', payload: '' });
            return;
          }
        }
      }
      
      const result = executeEncodeDecode(currentInput, currentType, currentOperation);

      if (result.success) {
        dispatch({ type: 'SET_CURRENT_OUTPUT', payload: result.result });
      } else {
        setError(result.error || '发生未知错误');
        dispatch({ type: 'SET_CURRENT_OUTPUT', payload: '' });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '发生意外错误');
      dispatch({ type: 'SET_CURRENT_OUTPUT', payload: '' });
    }
  }, [state, dispatch]);

  useEffect(() => {
    if (state.currentInput.trim() && !isImageMode) {
      processInput();
    } else if (!state.currentInput.trim()) {
      dispatch({ type: 'SET_CURRENT_OUTPUT', payload: '' });
      setError('');
    }
  }, [state.currentInput, state.currentType, state.currentOperation, isImageMode, dispatch, processInput]);

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
        style={{ marginBottom: 16 }}
      />

      <TextArea
        value={state.currentInput}
        onChange={handleInputChange}
        placeholder="请在这里填写原文/密文"
        rows={8}
        style={{ marginBottom: 16, fontFamily: 'monospace' }}
      />

      <Space style={{ marginBottom: 16 }}>
        <Button type="primary" style={{ backgroundColor: '#52c41a' }} onClick={() => handleOperationChange('encode')}>
          编码
        </Button>
        <Button type="primary" onClick={() => handleOperationChange('decode')}>
          解码
        </Button>
        <Button style={{ backgroundColor: '#faad14', borderColor: '#faad14', color: '#fff' }} onClick={copyToClipboard}>
          复制
        </Button>
        <Button danger onClick={handleClear}>
          清空
        </Button>
      </Space>

      {(state.currentOutput || error) && (
        <Card 
          size="small" 
          style={{ 
            marginBottom: 16,
            backgroundColor: error ? '#fff2f0' : '#f6ffed',
            borderColor: error ? '#ffccc7' : '#b7eb8f'
          }}
        >
          {error ? (
            <div style={{ color: '#ff4d4f' }}>{error}</div>
          ) : (
            <>
              <TextArea
                value={state.currentOutput}
                readOnly
                rows={6}
                style={{ 
                  marginBottom: 8, 
                  fontFamily: 'monospace',
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
