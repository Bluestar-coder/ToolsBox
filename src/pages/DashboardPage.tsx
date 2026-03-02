import React, { useMemo } from 'react';
import { Typography, Card, Row, Col } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useModules } from '../hooks/useModules';
import { moduleIdToPath } from '../router/constants';
import styles from './DashboardPage.module.css';

const { Title, Paragraph } = Typography;

const moduleI18nKeys: Record<string, string> = {
  'encoder-decoder': 'modules.encoder',
  'time-tool': 'modules.time',
  'crypto-tool': 'modules.crypto',
  'code-formatter': 'modules.formatter',
  'regex-tool': 'modules.regex',
  'qrcode-tool': 'modules.qrcode',
  'diff-tool': 'modules.diff',
  'http-debug': 'modules.httpDebug',
  'ip-network': 'modules.ipNetwork',
  'recipe-tool': 'modules.recipe',
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
  'http-debug',
  'ip-network',
  'recipe-tool',
];

const DashboardPage: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

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
    <div className={styles.pageShell}>
      <section className={styles.heroPanel}>
        <span className={styles.heroPulse} aria-hidden="true" />
        <Title level={2} className={styles.heroTitle}>
          {t('home.welcome')}
        </Title>
        <Paragraph className={styles.heroDescription}>
          {t('home.description')}
        </Paragraph>
      </section>

      <Title level={4} className={styles.sectionTitle}>
        {t('home.quickStart')}
      </Title>

      <Row gutter={[24, 24]}>
        {sortedModules.map((module, index) => (
          <Col xs={24} sm={12} md={8} lg={6} key={module.id}>
            <Card
              hoverable
              onClick={() => handleCardClick(module.id)}
              className={styles.moduleCard}
              style={{ ['--card-delay' as string]: `${index * 50}ms` }}
              styles={{
                body: {
                  height: '100%',
                  padding: '26px 22px',
                },
              }}
            >
              <div className={styles.moduleCardBody}>
                <div className={styles.moduleIcon}>
                  {module.icon}
                </div>
                <Title level={5} className={styles.moduleName}>
                  {t(`${moduleI18nKeys[module.id]}.name`, module.name)}
                </Title>
                <Paragraph className={styles.moduleDescription}>
                  {t(`${moduleI18nKeys[module.id]}.description`, module.description)}
                </Paragraph>
              </div>
            </Card>
          </Col>
        ))}
      </Row>
    </div>
  );
};

export default DashboardPage;
