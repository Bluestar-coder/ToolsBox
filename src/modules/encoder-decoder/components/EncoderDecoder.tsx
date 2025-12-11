import React, { useEffect, useState } from 'react';
import { Card, Input, Button, Space, Tabs, message, InputNumber, Upload, Row, Col } from 'antd';
import { DownloadOutlined, UploadOutlined, CopyOutlined } from '@ant-design/icons';
import { useAppContext } from '../../../hooks/useAppContext';
import { executeEncodeDecode, getEncoderDisplayName } from '../utils/encoders';
import type { EncoderType, OperationType } from '../utils/encoders';
import { validateBase64, validateBase64Url, validateBase32, validateBase16, validateJson } from '../../../utils/validators';

const { TextArea } = Input;

// 进制转换类型
type RadixType = 'bin' | 'oct' | 'dec' | 'hex' | 'custom';

// 图片转换模式
type ImageMode = 'toBase64' | 'toImage';

const EncoderDecoder: React.FC = () => {
  const { state, dispatch } = useAppContext();
  const [error, setError] = useState<string>('');
  const [isImageMode, setIsImageMode] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('base');
  
  // 进制转换状态
  const [radixInput, setRadixInput] = useState<string>('');
  const [fromRadix, setFromRadix] = useState<RadixType>('dec');
  const [radixResults, setRadixResults] = useState<Record<string, string>>({});
  const [customRadix, setCustomRadix] = useState<number>(36); // 自定义进制，默认36
  
  // 图片转换状态
  const [imageMode, setImageMode] = useState<ImageMode>('toBase64');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageInfo, setImageInfo] = useState<{ name: string; size: string; type: string } | null>(null);

  // Base 家族编码类型 (完整)
  const baseEncoders: EncoderType[] = ['base16', 'base32', 'base32hex', 'base36', 'base58', 'base62', 'base64', 'base64url', 'base85', 'base91'];
  // 其他编码类型
  const otherEncoders: EncoderType[] = ['url', 'html', 'json', 'unicode'];

  // 一级分类
  const categoryItems = [
    { key: 'base', label: 'Base 编码' },
    { key: 'other', label: '其他编码' },
    { key: 'radix', label: '进制转换' },
    { key: 'image', label: '图片转换' },
  ];
  
  // 进制二级导航选项
  const radixTabItems = [
    { key: 'bin', label: '二进制' },
    { key: 'oct', label: '八进制' },
    { key: 'dec', label: '十进制' },
    { key: 'hex', label: '十六进制' },
    { key: 'custom', label: '自定义' },
  ];
  
  // 获取当前输入进制的数值
  const getInputRadix = (): number => {
    if (fromRadix === 'custom') return customRadix;
    const radixMap: Record<string, number> = {
      bin: 2,
      oct: 8,
      dec: 10,
      hex: 16,
    };
    return radixMap[fromRadix] || 10;
  };
  
  // 进制转换
  const convertRadix = () => {
    if (!radixInput.trim()) {
      message.warning('请输入要转换的数值');
      return;
    }
    try {
      const base = getInputRadix();
      const num = parseInt(radixInput, base);
      if (isNaN(num)) {
        throw new Error('无效的输入');
      }
      const results: Record<string, string> = {
        bin: num.toString(2),
        oct: num.toString(8),
        dec: num.toString(10),
        hex: num.toString(16).toUpperCase(),
      };
      // 如果是自定义进制，添加自定义进制结果
      if (fromRadix === 'custom' || customRadix !== 36) {
        results.custom = num.toString(customRadix).toUpperCase();
      }
      setRadixResults(results);
    } catch {
      message.error('转换失败，请检查输入是否符合所选进制');
      setRadixResults({});
    }
  };
  
  const copyRadixResult = async (value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  // 图片转Base64
  const handleImageToBase64 = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const base64 = e.target?.result as string;
      setImageBase64(base64);
      setImagePreview(base64);
      setImageInfo({
        name: file.name,
        size: formatFileSize(file.size),
        type: file.type,
      });
    };
    reader.readAsDataURL(file);
    return false; // 阻止默认上传
  };

  // 格式化文件大小
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  // Base64转图片预览
  const handleBase64ToImage = () => {
    let base64 = imageBase64.trim();
    if (!base64) {
      message.warning('请输入Base64字符串');
      return;
    }
    // 如果没有data:前缀，自动添加
    if (!base64.startsWith('data:')) {
      // 尝试检测图片类型
      if (base64.startsWith('/9j/')) {
        base64 = 'data:image/jpeg;base64,' + base64;
      } else if (base64.startsWith('iVBOR')) {
        base64 = 'data:image/png;base64,' + base64;
      } else if (base64.startsWith('R0lGO')) {
        base64 = 'data:image/gif;base64,' + base64;
      } else if (base64.startsWith('UklGR')) {
        base64 = 'data:image/webp;base64,' + base64;
      } else {
        base64 = 'data:image/png;base64,' + base64;
      }
    }
    setImagePreview(base64);
  };

  // 下载图片
  const handleDownloadImage = () => {
    if (!imagePreview) {
      message.warning('没有可下载的图片');
      return;
    }
    const link = document.createElement('a');
    link.href = imagePreview;
    link.download = `image_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    message.success('图片下载成功');
  };

  // 复制Base64
  const handleCopyBase64 = async () => {
    if (!imageBase64) {
      message.warning('没有可复制的内容');
      return;
    }
    try {
      await navigator.clipboard.writeText(imageBase64);
      message.success('已复制到剪贴板');
    } catch {
      message.error('复制失败');
    }
  };

  // 清空图片转换
  const handleClearImage = () => {
    setImageBase64('');
    setImagePreview('');
    setImageInfo(null);
  };

  // 图片模式标签
  const imageModeItems = [
    { key: 'toBase64', label: '图片转Base64' },
    { key: 'toImage', label: 'Base64转图片' },
  ];

  // 处理输入，执行编码/解码
  const processInput = React.useCallback(() => {
    setError('');

    try {
      const { currentInput, currentType, currentOperation } = state;
      
      // 输入验证
      if (!currentInput.trim()) {
        dispatch({ type: 'SET_CURRENT_OUTPUT', payload: '' });
        return;
      }
      
      // 根据编码类型选择验证器
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
      
      // 执行验证
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
      
      // 执行编码/解码
      const result = executeEncodeDecode(
        currentInput,
        currentType,
        currentOperation
      );

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
  }, [state, dispatch, setError]);

  // 当输入、编码类型或操作类型变化时，执行编码/解码
  useEffect(() => {
    if (state.currentInput.trim() && !isImageMode) {
      processInput();
    } else if (!state.currentInput.trim()) {
      dispatch({ type: 'SET_CURRENT_OUTPUT', payload: '' });
      setError('');
    }
  }, [state.currentInput, state.currentType, state.currentOperation, isImageMode, dispatch, processInput, setError]);

  // 处理输入变化
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    dispatch({ type: 'SET_CURRENT_INPUT', payload: e.target.value });
    setIsImageMode(false);
  };

  // 处理编码类型变化
  const handleTypeChange = (type: EncoderType) => {
    dispatch({ type: 'SET_CURRENT_TYPE', payload: type });
  };

  // 处理操作类型变化
  const handleOperationChange = (operation: OperationType) => {
    dispatch({ type: 'SET_CURRENT_OPERATION', payload: operation });
  };

  // 复制结果到剪贴板
  const copyToClipboard = async () => {
    if (!state.currentOutput && !state.currentInput) {
      message.warning('没有可复制的内容');
      return;
    }

    try {
      const textToCopy = state.currentOutput || state.currentInput;
      await navigator.clipboard.writeText(textToCopy);
      message.success('已复制到剪贴板！');
    } catch (err) {
      message.error('复制到剪贴板失败');
      console.error('复制错误:', err);
    }
  };

  // Base64转图片并下载
  const downloadImage = () => {
    if (!state.currentOutput) {
      message.warning('没有可下载的图片');
      return;
    }

    try {
      // 创建下载链接
      const link = document.createElement('a');
      link.href = state.currentOutput;
      link.download = `image_${Date.now()}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      message.success('图片下载成功');
    } catch (err) {
      message.error('图片下载失败');
      console.error('下载错误:', err);
    }
  };

  // 清空输入输出
  const handleClear = () => {
    dispatch({ type: 'SET_CURRENT_INPUT', payload: '' });
    dispatch({ type: 'SET_CURRENT_OUTPUT', payload: '' });
    setError('');
    setIsImageMode(false);
  };

  // 获取当前分类的编码类型
  const getCurrentEncoders = () => {
    return activeCategory === 'base' ? baseEncoders : otherEncoders;
  };

  // 切换分类时，自动选择该分类的第一个编码类型
  const handleCategoryChange = (category: string) => {
    setActiveCategory(category);
    if (category !== 'radix') {
      const encoders = category === 'base' ? baseEncoders : otherEncoders;
      if (!encoders.includes(state.currentType as EncoderType)) {
        dispatch({ type: 'SET_CURRENT_TYPE', payload: encoders[0] });
      }
    }
  };

  return (
    <Card title="编码/解码工具" bordered={false}>
      {/* 一级分类标签页 */}
      <Tabs
        activeKey={activeCategory}
        onChange={handleCategoryChange}
        items={categoryItems}
        style={{ marginBottom: 8 }}
      />
      
      {activeCategory === 'image' ? (
        /* 图片转换界面 */
        <>
          <Tabs
            activeKey={imageMode}
            onChange={(key) => { setImageMode(key as ImageMode); handleClearImage(); }}
            items={imageModeItems}
            size="small"
            style={{ marginBottom: 16 }}
          />
          
          {imageMode === 'toBase64' ? (
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="📤 上传图片">
                  <Upload.Dragger
                    accept="image/*"
                    showUploadList={false}
                    beforeUpload={handleImageToBase64}
                    style={{ marginBottom: 16 }}
                  >
                    <p className="ant-upload-drag-icon">
                      <UploadOutlined style={{ fontSize: 48, color: '#1890ff' }} />
                    </p>
                    <p>点击或拖拽图片到此区域</p>
                    <p style={{ color: '#999', fontSize: 12 }}>支持 JPG、PNG、GIF、WebP 等格式</p>
                  </Upload.Dragger>
                  {imageInfo && (
                    <div style={{ padding: 8, backgroundColor: '#f5f5f5', borderRadius: 4 }}>
                      <div><strong>文件名:</strong> {imageInfo.name}</div>
                      <div><strong>大小:</strong> {imageInfo.size}</div>
                      <div><strong>类型:</strong> {imageInfo.type}</div>
                    </div>
                  )}
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="📋 Base64 结果" extra={
                  <Space>
                    <Button size="small" icon={<CopyOutlined />} onClick={handleCopyBase64} disabled={!imageBase64}>复制</Button>
                    <Button size="small" danger onClick={handleClearImage}>清空</Button>
                  </Space>
                }>
                  <TextArea
                    value={imageBase64}
                    readOnly
                    rows={10}
                    placeholder="Base64编码将显示在这里"
                    style={{ fontFamily: 'monospace', fontSize: 11 }}
                  />
                  {imagePreview && (
                    <div style={{ marginTop: 8, textAlign: 'center' }}>
                      <img src={imagePreview} alt="preview" style={{ maxWidth: '100%', maxHeight: 150, border: '1px solid #d9d9d9', borderRadius: 4 }} />
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          ) : (
            <Row gutter={16}>
              <Col span={12}>
                <Card size="small" title="📝 输入Base64">
                  <TextArea
                    value={imageBase64}
                    onChange={(e) => setImageBase64(e.target.value)}
                    rows={10}
                    placeholder="粘贴Base64字符串（可带或不带data:前缀）"
                    style={{ fontFamily: 'monospace', fontSize: 11, marginBottom: 8 }}
                  />
                  <Space>
                    <Button type="primary" onClick={handleBase64ToImage}>🖼️ 转换为图片</Button>
                    <Button danger onClick={handleClearImage}>清空</Button>
                  </Space>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="🖼️ 图片预览" extra={
                  <Button size="small" icon={<DownloadOutlined />} onClick={handleDownloadImage} disabled={!imagePreview}>下载</Button>
                }>
                  {imagePreview ? (
                    <div style={{ textAlign: 'center', padding: 16, backgroundColor: '#fafafa', borderRadius: 4, minHeight: 200 }}>
                      <img src={imagePreview} alt="preview" style={{ maxWidth: '100%', maxHeight: 300, border: '1px solid #d9d9d9', borderRadius: 4 }} />
                    </div>
                  ) : (
                    <div style={{ textAlign: 'center', padding: 40, color: '#999', backgroundColor: '#fafafa', borderRadius: 4, minHeight: 200 }}>
                      图片预览将显示在这里
                    </div>
                  )}
                </Card>
              </Col>
            </Row>
          )}
        </>
      ) : activeCategory === 'radix' ? (
        /* 进制转换界面 */
        <>
          {/* 二级进制类型标签页 */}
          <Tabs
            activeKey={fromRadix}
            onChange={(key) => setFromRadix(key as RadixType)}
            items={radixTabItems}
            size="small"
            style={{ marginBottom: 16 }}
          />
          {/* 自定义进制输入 */}
          {fromRadix === 'custom' && (
            <div style={{ marginBottom: 16 }}>
              <Space>
                <span>自定义进制 (2-36):</span>
                <InputNumber
                  min={2}
                  max={36}
                  value={customRadix}
                  onChange={(value) => setCustomRadix(value || 10)}
                  style={{ width: 80 }}
                />
              </Space>
            </div>
          )}
          <TextArea
            value={radixInput}
            onChange={(e) => setRadixInput(e.target.value)}
            placeholder="请输入要转换的数值"
            rows={4}
            style={{ marginBottom: 16, fontFamily: 'monospace' }}
          />
          <Space style={{ marginBottom: 16 }}>
            <Button type="primary" style={{ backgroundColor: '#52c41a' }} onClick={convertRadix}>
              转换
            </Button>
            <Button danger onClick={() => { setRadixInput(''); setRadixResults({}); }}>
              清空
            </Button>
          </Space>
          {Object.keys(radixResults).length > 0 && (
            <Card size="small" style={{ backgroundColor: '#f6ffed', borderColor: '#b7eb8f' }}>
              {[
                { key: 'bin', label: '二进制' },
                { key: 'oct', label: '八进制' },
                { key: 'dec', label: '十进制' },
                { key: 'hex', label: '十六进制' },
                ...(radixResults.custom ? [{ key: 'custom', label: `${customRadix}进制` }] : []),
              ].map(({ key, label }) => (
                <div key={key} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                    <span style={{ fontWeight: 500, width: 80 }}>{label}:</span>
                    <Button size="small" onClick={() => copyRadixResult(radixResults[key])}>复制</Button>
                  </div>
                  <Input value={radixResults[key]} readOnly style={{ fontFamily: 'monospace' }} />
                </div>
              ))}
            </Card>
          )}
        </>
      ) : (
        /* 编码/解码界面 */
        <>
          {/* 二级编码类型标签页 */}
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

          {/* 输入区域 */}
          <TextArea
            value={state.currentInput}
            onChange={handleInputChange}
            placeholder="请在这里填写原文/密文"
            rows={8}
            style={{ marginBottom: 16, fontFamily: 'monospace' }}
          />

          {/* 操作按钮 */}
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

          {/* 结果显示区域 */}
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
                      <Button
                        icon={<DownloadOutlined />}
                        onClick={downloadImage}
                        size="small"
                      >
                        下载图片
                      </Button>
                    )}
                  </Space>
                </>
              )}
            </Card>
          )}
        </>
      )}
    </Card>
  );
};

export default EncoderDecoder;
