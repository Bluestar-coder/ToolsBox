import React, { useState, useEffect } from 'react';
import { Input, Radio, Space, Card, Button, Typography } from 'antd';
import { computeDiff } from '../utils/diff-utils';
import type { DiffMode, DiffResult } from '../utils/diff-utils';
import { DiffViewer } from './DiffViewer';
import styles from './styles/DiffTool.module.css';
import { useTranslation } from 'react-i18next';
import { SwapOutlined, ClearOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

export const DiffTool: React.FC = () => {
  const { t } = useTranslation();
  const [original, setOriginal] = useState('');
  const [modified, setModified] = useState('');
  const [diffMode, setDiffMode] = useState<DiffMode>('lines');
  const [splitView, setSplitView] = useState(true);
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);

  useEffect(() => {
    if (!original && !modified) {
      setDiffResult(null);
      return;
    }
    const result = computeDiff(original, modified, diffMode);
    setDiffResult(result);
  }, [original, modified, diffMode]);

  const handleSwap = () => {
    setOriginal(modified);
    setModified(original);
  };

  const handleClear = () => {
    setOriginal('');
    setModified('');
  };

  return (
    <div className={styles.container}>
      <Card size="small" bodyStyle={{ padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <Space>
            <Radio.Group value={diffMode} onChange={e => setDiffMode(e.target.value)} buttonStyle="solid">
              <Radio.Button value="lines">{t('modules.diff.lines')}</Radio.Button>
              <Radio.Button value="json">{t('modules.diff.json')}</Radio.Button>
            </Radio.Group>

            <Radio.Group value={splitView} onChange={e => setSplitView(e.target.value)} buttonStyle="solid">
              <Radio.Button value={true}>{t('modules.diff.split')}</Radio.Button>
              <Radio.Button value={false}>{t('modules.diff.unified')}</Radio.Button>
            </Radio.Group>
          </Space>

          <Space>
            <Button icon={<SwapOutlined />} onClick={handleSwap}>{t('modules.diff.swap')}</Button>
            <Button icon={<ClearOutlined />} onClick={handleClear}>{t('modules.diff.clear')}</Button>
          </Space>
        </div>
      </Card>

      <div className={styles.editorContainer} style={{ maxHeight: '200px', flex: 'none' }}>
        <div className={styles.inputColumn}>
          <div className={styles.diffHeader}>{t('modules.diff.original')}</div>
          <TextArea
            id="diff-original"
            name="diffOriginal"
            value={original}
            onChange={e => setOriginal(e.target.value)}
            placeholder={t('modules.diff.originalPlaceholder')}
            style={{ flex: 1, fontFamily: 'monospace', whiteSpace: 'pre', resize: 'none' }}
          />
        </div>
        <div className={styles.inputColumn}>
          <div className={styles.diffHeader}>{t('modules.diff.modified')}</div>
          <TextArea
            id="diff-modified"
            name="diffModified"
            value={modified}
            onChange={e => setModified(e.target.value)}
            placeholder={t('modules.diff.modifiedPlaceholder')}
            style={{ flex: 1, fontFamily: 'monospace', whiteSpace: 'pre', resize: 'none' }}
          />
        </div>
      </div>

      {diffResult && (
        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <div className={styles.diffHeader} style={{ marginTop: '16px', borderTop: '1px solid var(--border-color)', borderRadius: '6px 6px 0 0' }}>
            <Space>
              <Text strong>{t('modules.diff.result')}</Text>
              <span className={styles.added} style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                +{diffResult.addedCount} {t('modules.diff.added')}
              </span>
              <span className={styles.removed} style={{ padding: '2px 6px', borderRadius: '4px', fontSize: '12px' }}>
                -{diffResult.removedCount} {t('modules.diff.removed')}
              </span>
            </Space>
          </div>
          <DiffViewer changes={diffResult.changes} splitView={splitView} />
        </div>
      )}
    </div>
  );
};
