import React, { useState } from 'react';
import { Card, Input, Button, Space, Tabs, Upload, Row, Col, message } from 'antd';
import { DownloadOutlined, UploadOutlined, CopyOutlined } from '@ant-design/icons';
import { imageModeItems } from '../../utils/constants';
import { formatFileSize, detectImageType } from '../../utils/helpers';

const { TextArea } = Input;

type ImageMode = 'toBase64' | 'toImage';

const ImageTab: React.FC = () => {
  const [imageMode, setImageMode] = useState<ImageMode>('toBase64');
  const [imageBase64, setImageBase64] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [imageInfo, setImageInfo] = useState<{ name: string; size: string; type: string } | null>(null);

  const handleImageToBase64 = (file: File) => {
    // 限制文件大小为 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      message.error('文件过大，最大支持 10MB');
      return false;
    }
    
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
    return false;
  };

  const handleBase64ToImage = () => {
    const base64 = imageBase64.trim();
    if (!base64) {
      message.warning('请输入Base64字符串');
      return;
    }
    setImagePreview(detectImageType(base64));
  };

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

  const handleClearImage = () => {
    setImageBase64('');
    setImagePreview('');
    setImageInfo(null);
  };

  return (
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
  );
};

export default ImageTab;
