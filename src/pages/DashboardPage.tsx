import React, { useMemo } from 'react';
import { Typography, Card, Row, Col, theme, Space } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useModules } from '../hooks/useModules';
import { moduleIdToPath } from '../router/constants';
import { useTheme } from '../hooks/useTheme';

const { Title, Paragraph } = Typography;

const moduleI18nKeys: Record<string, string> = {
  'encoder-decoder': 'modules.encoder',
  'time-tool': 'modules.time',
  'crypto-tool': 'modules.crypto',
  'code-formatter': 'modules.formatter',
  'regex-tool': 'modules.regex',
  'qrcode-tool': 'modules.qrcode',
  'diff-tool': 'modules.diff',
};

// Define module order same as SideMenu
const moduleOrder = [
  'encoder-decoder',
  'crypto-tool',
  'time-tool',
  'regex-tool',
  'code-formatter',
  'qrcode-tool',
  'diff-tool',
];

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const { isDark } = useTheme();

  const modules = useModules();

  const sortedModules = useMemo(() => {
    return [...modules].sort((a, b) => {
      const indexA = moduleOrder.indexOf(a.id);
      const indexB = moduleOrder.indexOf(b.id);
      return indexA - indexB;
    });
  }, [modules]);

  const handleCardClick = (moduleId: string) => {
    const path = moduleIdToPath[moduleId];
    if (path) {
      navigate(path);
    }
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <Title level={2} style={{ marginBottom: '16px' }}>
          {t('home.welcome')}
        </Title>
        <Paragraph type="secondary" style={{ fontSize: '16px' }}>
          {t('home.description')}
        </Paragraph>
      </div>

      <Title level={4} style={{ marginBottom: '24px' }}>
        {t('home.quickStart')}
      </Title>

      <Row gutter={[24, 24]}>
        {sortedModules.map((module) => (
          <Col xs={24} sm={12} md={8} lg={6} key={module.id}>
            <Card
              hoverable
              onClick={() => handleCardClick(module.id)}
              style={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                cursor: 'pointer',
                transition: 'all 0.3s',
                border: isDark ? `1px solid ${token.colorBorder}` : undefined,
              }}
              styles={{
                body: {
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  padding: '32px 24px',
                }
              }}
            >
              <div
                style={{
                  fontSize: '48px',
                  marginBottom: '16px',
                  color: token.colorPrimary,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {module.icon}
              </div>
              <Title level={5} style={{ marginBottom: '8px' }}>
                {t(`${moduleI18nKeys[module.id]}.name`, module.name)}
              </Title>
              <Paragraph
                type="secondary"
                style={{
                  marginBottom: 0,
                  fontSize: '14px',
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                }}
              >
                {t(`${moduleI18nKeys[module.id]}.description`, module.description)}
              </Paragraph>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default DashboardPage;
