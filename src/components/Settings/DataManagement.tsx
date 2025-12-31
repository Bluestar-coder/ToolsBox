import React, { useState } from 'react';
import { Button, Modal, message } from 'antd';
import { clearAllAppData, exportData, importData } from '../../utils/storage';

export const DataManagement: React.FC = () => {
  const [exportModal, setExportModal] = useState(false);
  const [importModal, setImportModal] = useState(false);
  const [exportedData, setExportedData] = useState('');

  const handleExport = () => {
    const data = exportData();
    setExportedData(data);
    setExportModal(true);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(exportedData);
    message.success('已复制到剪贴板');
  };

  const handleDownload = () => {
    const blob = new Blob([exportedData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `toolsbox-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = () => {
    Modal.warning({
      title: '导入数据警告',
      content: '导入的数据将覆盖现有设置。请确保数据来源可信，不要导入不明来源的数据文件。敏感数据（如加密内容）不会被导入。',
      okText: '我了解风险，继续导入',
      cancelText: '取消',
      onOk: () => {
        setImportModal(true);
      },
    });
  };

  const handleImportSubmit = () => {
    const textarea = document.querySelector('#import-input') as HTMLTextAreaElement;
    if (textarea) {
      const data = textarea.value;
      if (importData(data)) {
        message.success('数据导入成功，页面将刷新');
        setTimeout(() => window.location.reload(), 1000);
      } else {
        message.error('数据导入失败，请检查格式');
      }
    }
  };

  const handleClear = () => {
    Modal.confirm({
      title: '确认清除',
      content: '确定要清除所有本地数据吗？此操作不可恢复。',
      okText: '确定',
      cancelText: '取消',
      okButtonProps: { danger: true },
      onOk: () => {
        clearAllAppData();
        message.success('数据已清除');
        setTimeout(() => window.location.reload(), 500);
      },
    });
  };

  return (
    <div>
      <Button onClick={handleExport}>导出数据</Button>
      <Button onClick={handleImport} style={{ marginLeft: 8 }}>导入数据</Button>
      <Button danger onClick={handleClear} style={{ marginLeft: 8 }}>清除所有数据</Button>

      {/* 导出模态框 */}
      <Modal
        title="导出数据"
        open={exportModal}
        onCancel={() => setExportModal(false)}
        footer={[
          <Button key="copy" onClick={handleCopy}>复制</Button>,
          <Button key="download" type="primary" onClick={handleDownload}>下载</Button>,
        ]}
        width={600}
      >
        <textarea
          readOnly
          value={exportedData}
          style={{
            width: '100%',
            height: 300,
            fontFamily: 'monospace',
            fontSize: 12,
            padding: 8,
            border: '1px solid #d9d9d9',
            borderRadius: 4,
          }}
        />
      </Modal>

      {/* 导入模态框 */}
      <Modal
        title="导入数据"
        open={importModal}
        onCancel={() => setImportModal(false)}
        onOk={handleImportSubmit}
        okText="导入"
        cancelText="取消"
        width={600}
      >
        <textarea
          id="import-input"
          placeholder="粘贴之前导出的JSON数据"
          style={{
            width: '100%',
            height: 300,
            fontFamily: 'monospace',
            fontSize: 12,
            padding: 8,
            border: '1px solid #d9d9d9',
            borderRadius: 4,
          }}
        />
      </Modal>
    </div>
  );
};

export default DataManagement;
