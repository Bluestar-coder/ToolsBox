import React, { useEffect, useRef } from 'react';
import { Button, Empty, Popconfirm, Typography, Tag } from 'antd';
import { DeleteOutlined, ArrowUpOutlined, ArrowDownOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { WsMessage } from '../../utils/types';

const { Text } = Typography;

interface MessageLogProps {
  messages: WsMessage[];
  onClear: () => void;
}

function formatTimestamp(ts: number): string {
  const d = new Date(ts);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

const MessageLog: React.FC<MessageLogProps> = ({ messages, onClear }) => {
  const { t } = useTranslation();
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to latest message
  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === 'function') {
      bottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const isSent = (msg: WsMessage) => msg.direction === 'sent';

  return (
    <div>
      {/* Header with title and clear button */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <Text strong>{t('modules.httpDebug.ws.messageLog', '消息记录')}</Text>
        <Popconfirm
          title={t('modules.httpDebug.ws.clearMessagesConfirm', '确定清空所有消息？')}
          onConfirm={onClear}
          okText={t('modules.httpDebug.ws.confirm', '确定')}
          cancelText={t('modules.httpDebug.ws.cancel', '取消')}
        >
          <Button
            type="text"
            danger
            icon={<DeleteOutlined />}
            size="small"
            disabled={messages.length === 0}
          >
            {t('modules.httpDebug.ws.clearAll', '清空')}
          </Button>
        </Popconfirm>
      </div>

      {/* Message list or empty state */}
      {messages.length === 0 ? (
        <Empty
          description={t('modules.httpDebug.ws.noMessages', '暂无消息')}
          image={Empty.PRESENTED_IMAGE_SIMPLE}
        />
      ) : (
        <div
          style={{ maxHeight: 400, overflowY: 'auto', padding: '4px 0' }}
          data-testid="message-log-list"
        >
          {messages.map((msg) => {
            const sent = isSent(msg);
            return (
              <div
                key={msg.id}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: sent ? 'flex-end' : 'flex-start',
                  marginBottom: 8,
                }}
              >
                {/* Meta line: direction icon + timestamp + type tag */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: 'var(--ant-color-text-secondary)',
                    marginBottom: 2,
                  }}
                >
                  {sent ? (
                    <ArrowUpOutlined style={{ color: '#1677ff' }} />
                  ) : (
                    <ArrowDownOutlined style={{ color: '#52c41a' }} />
                  )}
                  <span>{formatTimestamp(msg.timestamp)}</span>
                  <Tag
                    color={msg.type === 'binary' ? 'orange' : 'default'}
                    style={{ margin: 0, lineHeight: '18px', fontSize: 11 }}
                  >
                    {msg.type === 'binary'
                      ? t('modules.httpDebug.ws.typeBinary', '二进制')
                      : t('modules.httpDebug.ws.typeText', '文本')}
                  </Tag>
                </div>

                {/* Message content bubble */}
                <div
                  style={{
                    background: sent
                      ? 'var(--ant-color-primary-bg, #e6f4ff)'
                      : 'var(--ant-color-fill-tertiary, #f5f5f5)',
                    borderRadius: 6,
                    padding: '6px 10px',
                    maxWidth: '80%',
                    wordBreak: 'break-all',
                    whiteSpace: 'pre-wrap',
                    fontFamily: msg.type === 'binary' ? 'monospace' : undefined,
                    fontSize: 13,
                  }}
                >
                  {msg.content}
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      )}
    </div>
  );
};

export default MessageLog;
