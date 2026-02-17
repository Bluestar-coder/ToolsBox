import React, { useState, useCallback } from 'react';
import { Input, Button, Radio, Space } from 'antd';
import { SendOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { isValidHexString, hexToArrayBuffer } from '../../utils/validators';
import type { WsMessageType } from '../../utils/types';

const { TextArea } = Input;

interface MessageComposerProps {
  onSend: (data: string | ArrayBuffer) => void;
  disabled: boolean;
}

const MessageComposer: React.FC<MessageComposerProps> = ({ onSend, disabled }) => {
  const { t } = useTranslation();
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<WsMessageType>('text');

  const isBinary = messageType === 'binary';
  const hexValid = !isBinary || message === '' || isValidHexString(message);
  const canSend = !disabled && message.trim() !== '' && hexValid;

  const handleSend = useCallback(() => {
    if (!canSend) return;

    if (isBinary) {
      onSend(hexToArrayBuffer(message.trim()));
    } else {
      onSend(message);
    }
    setMessage('');
  }, [canSend, isBinary, message, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey) && canSend) {
        e.preventDefault();
        handleSend();
      }
    },
    [canSend, handleSend],
  );

  return (
    <div>
      {/* Message type selector */}
      <div style={{ marginBottom: 8 }}>
        <Radio.Group
          value={messageType}
          onChange={(e) => {
            setMessageType(e.target.value);
            setMessage('');
          }}
          size="small"
          disabled={disabled}
        >
          <Radio.Button value="text">
            {t('modules.httpDebug.ws.textMessage', '文本')}
          </Radio.Button>
          <Radio.Button value="binary">
            {t('modules.httpDebug.ws.binaryMessage', '二进制 (Hex)')}
          </Radio.Button>
        </Radio.Group>
      </div>

      {/* Message input */}
      <TextArea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={
          isBinary
            ? t('modules.httpDebug.ws.hexPlaceholder', '输入十六进制字符串，如: 48656c6c6f')
            : t('modules.httpDebug.ws.textPlaceholder', '输入消息内容... (Ctrl+Enter 发送)')
        }
        disabled={disabled}
        autoSize={{ minRows: 3, maxRows: 8 }}
        style={isBinary ? { fontFamily: 'monospace' } : undefined}
        status={!hexValid ? 'error' : undefined}
      />

      {/* Hex validation error */}
      {isBinary && message && !hexValid && (
        <div style={{ color: 'var(--ant-color-error)', fontSize: 12, marginTop: 4 }}>
          {t('modules.httpDebug.ws.invalidHex', '请输入有效的十六进制字符串（偶数长度，仅含 0-9, a-f）')}
        </div>
      )}

      {/* Send button */}
      <div style={{ marginTop: 8, textAlign: 'right' }}>
        <Space>
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            disabled={!canSend}
          >
            {t('modules.httpDebug.ws.send', '发送')}
          </Button>
        </Space>
      </div>
    </div>
  );
};

export default MessageComposer;
