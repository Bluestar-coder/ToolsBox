import React, { useMemo } from 'react';
import { Input, Button, Space, Tag, Badge } from 'antd';
import {
  LinkOutlined,
  DisconnectOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type { WsConnectionConfig, WsConnectionStatus } from '../../utils/types';
import { isValidWsUrl } from '../../utils/validators';

interface ConnectionPanelProps {
  config: WsConnectionConfig;
  status: WsConnectionStatus;
  error: string | null;
  onChange: (config: WsConnectionConfig) => void;
  onConnect: () => void;
  onDisconnect: () => void;
}

const STATUS_MAP: Record<WsConnectionStatus, { color: string; badgeStatus: 'success' | 'processing' | 'default' | 'error' }> = {
  disconnected: { color: 'default', badgeStatus: 'default' },
  connecting: { color: 'processing', badgeStatus: 'processing' },
  connected: { color: 'success', badgeStatus: 'success' },
  closed: { color: 'error', badgeStatus: 'error' },
};

const ConnectionPanel: React.FC<ConnectionPanelProps> = ({
  config,
  status,
  error,
  onChange,
  onConnect,
  onDisconnect,
}) => {
  const { t } = useTranslation();

  const urlValid = isValidWsUrl(config.url);
  const isConnected = status === 'connected';
  const isConnecting = status === 'connecting';
  const canConnect = urlValid && !isConnected && !isConnecting;

  const statusInfo = STATUS_MAP[status];

  const statusLabel = useMemo(() => {
    const labels: Record<WsConnectionStatus, string> = {
      disconnected: t('modules.httpDebug.ws.statusDisconnected', '未连接'),
      connecting: t('modules.httpDebug.ws.statusConnecting', '连接中'),
      connected: t('modules.httpDebug.ws.statusConnected', '已连接'),
      closed: t('modules.httpDebug.ws.statusClosed', '已断开'),
    };
    return labels[status];
  }, [status, t]);

  const updateConfig = (partial: Partial<WsConnectionConfig>) => {
    onChange({ ...config, ...partial });
  };

  const handleProtocolsChange = (value: string) => {
    const protocols = value
      .split(',')
      .map((p) => p.trim())
      .filter(Boolean);
    updateConfig({ protocols });
  };

  const protocolsValue = config.protocols.join(', ');

  return (
    <div>
      {/* URL input + connect/disconnect button */}
      <Space.Compact style={{ width: '100%', marginBottom: 12 }}>
        <Input
          value={config.url}
          onChange={(e) => updateConfig({ url: e.target.value })}
          placeholder={t(
            'modules.httpDebug.ws.urlPlaceholder',
            '输入 WebSocket URL，如 ws://localhost:8080/ws',
          )}
          status={config.url && !urlValid ? 'error' : undefined}
          disabled={isConnected || isConnecting}
          onPressEnter={() => canConnect && onConnect()}
          style={{ flex: 1 }}
        />
        {isConnected || isConnecting ? (
          <Button
            danger
            icon={<DisconnectOutlined />}
            onClick={onDisconnect}
          >
            {t('modules.httpDebug.ws.disconnect', '断开')}
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<LinkOutlined />}
            onClick={onConnect}
            disabled={!canConnect}
          >
            {t('modules.httpDebug.ws.connect', '连接')}
          </Button>
        )}
      </Space.Compact>

      {/* URL validation error */}
      {config.url && !urlValid && (
        <div style={{ color: 'var(--ant-color-error)', fontSize: 12, marginBottom: 8 }}>
          {t('modules.httpDebug.ws.invalidUrl', '请输入有效的 WebSocket URL（ws:// 或 wss://）')}
        </div>
      )}

      {/* Sub-protocols input */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 12, color: 'var(--ant-color-text-secondary)', marginBottom: 4 }}>
          {t('modules.httpDebug.ws.subprotocols', '子协议（多个用逗号分隔）')}
        </div>
        <Input
          value={protocolsValue}
          onChange={(e) => handleProtocolsChange(e.target.value)}
          placeholder={t(
            'modules.httpDebug.ws.subprotocolsPlaceholder',
            '如: graphql-ws, mqtt',
          )}
          disabled={isConnected || isConnecting}
          size="small"
        />
      </div>

      {/* Connection status display */}
      <Space size="middle">
        <Badge status={statusInfo.badgeStatus} text={statusLabel} />
        <Tag color={statusInfo.color}>{statusLabel}</Tag>
      </Space>

      {/* Error message */}
      {error && (
        <div style={{ color: 'var(--ant-color-error)', fontSize: 12, marginTop: 8 }}>
          {error}
        </div>
      )}
    </div>
  );
};

export default ConnectionPanel;
