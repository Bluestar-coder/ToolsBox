import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Row, Col, Card, Switch, InputNumber, Space, Typography, Tag } from 'antd';
import { useTranslation } from 'react-i18next';
import ConnectionPanel from '../websocket/ConnectionPanel';
import MessageComposer from '../websocket/MessageComposer';
import MessageLog from '../websocket/MessageLog';
import { WsClient } from '../../utils/ws-client';
import type {
  WsConnectionConfig,
  WsConnectionStatus,
  WsMessage,
  ReconnectConfig,
} from '../../utils/types';

const { Text } = Typography;

const DEFAULT_CONNECTION_CONFIG: WsConnectionConfig = {
  url: '',
  protocols: [],
};

const DEFAULT_RECONNECT_CONFIG: ReconnectConfig = {
  enabled: false,
  interval: 3000,
  maxRetries: 5,
};

const WebSocketTab: React.FC = () => {
  const { t } = useTranslation();

  // Connection state
  const [connectionConfig, setConnectionConfig] = useState<WsConnectionConfig>(DEFAULT_CONNECTION_CONFIG);
  const [status, setStatus] = useState<WsConnectionStatus>('disconnected');
  const [messages, setMessages] = useState<WsMessage[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Reconnect state
  const [reconnectConfig, setReconnectConfig] = useState<ReconnectConfig>(DEFAULT_RECONNECT_CONFIG);
  const [reconnectCount, setReconnectCount] = useState(0);

  // WsClient instance (stable across renders)
  const clientRef = useRef<WsClient | null>(null);

  // Initialize WsClient once
  useEffect(() => {
    const client = new WsClient();
    clientRef.current = client;

    client.onMessage = (msg: WsMessage) => {
      setMessages((prev) => [...prev, msg]);
    };

    client.onStatusChange = (newStatus: WsConnectionStatus) => {
      setStatus(newStatus);
      if (newStatus === 'connected') {
        setError(null);
        setReconnectCount(0);
      }
    };

    client.onError = (errMsg: string) => {
      setError(errMsg);
    };

    return () => {
      client.disconnect();
    };
  }, []);

  // Track reconnect count by monitoring status changes
  useEffect(() => {
    if (status === 'connecting' && clientRef.current) {
      // Read reconnect count from the client's internal state via status transitions
      // When status goes to 'connecting' after 'closed', it's a reconnect attempt
      setReconnectCount((prev) => {
        // Only increment if reconnect is enabled and we were previously closed
        if (reconnectConfig.enabled) {
          return prev;
        }
        return 0;
      });
    }
  }, [status, reconnectConfig.enabled]);

  // Sync reconnect config to WsClient
  useEffect(() => {
    const client = clientRef.current;
    if (!client) return;

    if (reconnectConfig.enabled) {
      client.enableReconnect(reconnectConfig);
    } else {
      client.disableReconnect();
    }
  }, [reconnectConfig]);

  // Connect handler
  const handleConnect = useCallback(() => {
    const client = clientRef.current;
    if (!client) return;

    setError(null);
    setReconnectCount(0);

    if (reconnectConfig.enabled) {
      client.enableReconnect(reconnectConfig);
    }

    client.connect(connectionConfig);
  }, [connectionConfig, reconnectConfig]);

  // Disconnect handler
  const handleDisconnect = useCallback(() => {
    const client = clientRef.current;
    if (!client) return;

    client.disconnect();
    setReconnectCount(0);
  }, []);

  // Send message handler
  const handleSend = useCallback((data: string | ArrayBuffer) => {
    const client = clientRef.current;
    if (!client) return;

    client.send(data);
  }, []);

  // Clear messages handler
  const handleClearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  // Reconnect config change handlers
  const handleReconnectEnabledChange = useCallback((enabled: boolean) => {
    setReconnectConfig((prev) => ({ ...prev, enabled }));
  }, []);

  const handleReconnectIntervalChange = useCallback((value: number | null) => {
    if (value !== null && value >= 500) {
      setReconnectConfig((prev) => ({ ...prev, interval: value }));
    }
  }, []);

  const handleReconnectMaxRetriesChange = useCallback((value: number | null) => {
    if (value !== null && value >= 1) {
      setReconnectConfig((prev) => ({ ...prev, maxRetries: value }));
    }
  }, []);

  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';

  return (
    <div>
      <Row gutter={16}>
        {/* Left: Connection + Message Composer */}
        <Col xs={24} lg={14}>
          <Card
            size="small"
            title={t('modules.httpDebug.ws.connection', '连接')}
            style={{ marginBottom: 16 }}
          >
            <ConnectionPanel
              config={connectionConfig}
              status={status}
              error={error}
              onChange={setConnectionConfig}
              onConnect={handleConnect}
              onDisconnect={handleDisconnect}
            />
          </Card>

          {/* Auto-reconnect config */}
          <Card
            size="small"
            title={t('modules.httpDebug.ws.autoReconnect', '自动重连')}
            style={{ marginBottom: 16 }}
          >
            <Space orientation="vertical" style={{ width: '100%' }} size="small">
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text>{t('modules.httpDebug.ws.enableReconnect', '启用自动重连')}</Text>
                <Switch
                  checked={reconnectConfig.enabled}
                  onChange={handleReconnectEnabledChange}
                  size="small"
                />
              </div>

              {reconnectConfig.enabled && (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13 }}>
                      {t('modules.httpDebug.ws.reconnectInterval', '重连间隔 (ms)')}
                    </Text>
                    <InputNumber
                      value={reconnectConfig.interval}
                      onChange={handleReconnectIntervalChange}
                      min={500}
                      max={60000}
                      step={500}
                      size="small"
                      style={{ width: 120 }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <Text style={{ fontSize: 13 }}>
                      {t('modules.httpDebug.ws.maxRetries', '最大重连次数')}
                    </Text>
                    <InputNumber
                      value={reconnectConfig.maxRetries}
                      onChange={handleReconnectMaxRetriesChange}
                      min={1}
                      max={100}
                      size="small"
                      style={{ width: 120 }}
                    />
                  </div>

                  {/* Reconnect status display */}
                  {(status === 'closed' || isConnecting) && reconnectCount > 0 && (
                    <div>
                      <Tag color="warning">
                        {t('modules.httpDebug.ws.reconnecting', '重连中')}: {reconnectCount} / {reconnectConfig.maxRetries}
                      </Tag>
                    </div>
                  )}
                </>
              )}
            </Space>
          </Card>

          <Card
            size="small"
            title={t('modules.httpDebug.ws.sendMessage', '发送消息')}
          >
            <MessageComposer
              onSend={handleSend}
              disabled={!isConnected}
            />
          </Card>
        </Col>

        {/* Right: Message Log */}
        <Col xs={24} lg={10}>
          <Card
            size="small"
            title={t('modules.httpDebug.ws.messageLog', '消息记录')}
            style={{ height: '100%' }}
          >
            <MessageLog
              messages={messages}
              onClear={handleClearMessages}
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default WebSocketTab;
