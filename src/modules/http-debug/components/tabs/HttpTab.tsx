import React, { useState, useEffect, useCallback } from 'react';
import { Row, Col, Alert } from 'antd';
import { useTranslation } from 'react-i18next';
import RequestBuilder from '../http/RequestBuilder';
import ResponseViewer from '../http/ResponseViewer';
import HistoryPanel from '../http/HistoryPanel';
import EnvironmentPanel from '../http/EnvironmentPanel';
import { sendHttpRequest, isTauriEnvironment } from '../../utils/http-client';
import { saveToHistory, getHistory, clearHistory } from '../../utils/history-manager';
import {
  saveEnvironments,
  loadEnvironments,
  saveActiveEnvId,
  loadActiveEnvId,
} from '../../utils/variable-engine';
import type {
  HttpRequestConfig,
  HttpResponse,
  HistoryEntry,
  Environment,
  KeyValuePair,
} from '../../utils/types';

const DEFAULT_REQUEST: HttpRequestConfig = {
  method: 'GET',
  url: '',
  headers: [],
  bodyType: 'none',
  body: '',
};

const HttpTab: React.FC = () => {
  const { t } = useTranslation();

  // Request state
  const [requestConfig, setRequestConfig] = useState<HttpRequestConfig>(DEFAULT_REQUEST);
  const [response, setResponse] = useState<HttpResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // History state
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  // Environment state
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [activeEnvId, setActiveEnvId] = useState<string | null>(null);

  // CORS warning (browser-only)
  const [isBrowser, setIsBrowser] = useState(false);

  // Load persisted data on mount
  useEffect(() => {
    setHistory(getHistory());
    setEnvironments(loadEnvironments());
    setActiveEnvId(loadActiveEnvId());
    setIsBrowser(!isTauriEnvironment());
  }, []);

  // Get active environment variables
  const getActiveVariables = useCallback((): KeyValuePair[] => {
    if (!activeEnvId) return [];
    const env = environments.find((e) => e.id === activeEnvId);
    return env?.variables.filter((v) => v.enabled) ?? [];
  }, [environments, activeEnvId]);

  // Send HTTP request
  const handleSend = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const variables = getActiveVariables();
      const res = await sendHttpRequest(requestConfig, variables);

      setResponse(res);

      // If request returned a real response (not a network error), save to history
      if (res.status > 0) {
        const entry: HistoryEntry = {
          id: crypto.randomUUID(),
          timestamp: Date.now(),
          request: { ...requestConfig },
        };
        saveToHistory(entry);
        setHistory(getHistory());
      } else {
        // status === 0 means network error; show the body as error message
        setError(res.body);
      }
    } catch (err: any) {
      setError(err.message || String(err));
    } finally {
      setLoading(false);
    }
  }, [requestConfig, getActiveVariables]);

  // History: select entry to restore request config
  const handleHistorySelect = useCallback((entry: HistoryEntry) => {
    setRequestConfig(entry.request);
  }, []);

  // History: clear all
  const handleHistoryClear = useCallback(() => {
    clearHistory();
    setHistory([]);
  }, []);

  // Environments: update list and persist
  const handleEnvironmentsChange = useCallback((envs: Environment[]) => {
    setEnvironments(envs);
    saveEnvironments(envs);
  }, []);

  // Environments: switch active and persist
  const handleActiveEnvChange = useCallback((id: string | null) => {
    setActiveEnvId(id);
    saveActiveEnvId(id);
  }, []);

  return (
    <div>
      {isBrowser && (
        <Alert
          type="info"
          showIcon
          closable
          title={t(
            'modules.httpDebug.corsWarning',
            '当前为浏览器环境，HTTP 请求可能因 CORS 策略被拦截。建议使用 Tauri 桌面端以绕过 CORS 限制。',
          )}
          style={{ marginBottom: 12 }}
        />
      )}

      <Row gutter={16}>
        {/* Left: Request + Response */}
        <Col xs={24} lg={16}>
          <RequestBuilder
            config={requestConfig}
            onChange={setRequestConfig}
            onSend={handleSend}
            loading={loading}
          />
          <div style={{ marginTop: 16 }}>
            <ResponseViewer response={response} loading={loading} error={error} />
          </div>
        </Col>

        {/* Right: History + Environment */}
        <Col xs={24} lg={8}>
          <div style={{ marginBottom: 16 }}>
            <EnvironmentPanel
              environments={environments}
              activeEnvId={activeEnvId}
              onEnvironmentsChange={handleEnvironmentsChange}
              onActiveEnvChange={handleActiveEnvChange}
            />
          </div>
          <HistoryPanel
            history={history}
            onSelect={handleHistorySelect}
            onClear={handleHistoryClear}
          />
        </Col>
      </Row>
    </div>
  );
};

export default HttpTab;
