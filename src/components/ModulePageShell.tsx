import React, { type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  CodeOutlined,
  LockOutlined,
  ClockCircleOutlined,
  FormatPainterOutlined,
  FileSearchOutlined,
  QrcodeOutlined,
  DiffOutlined,
  ApiOutlined,
  GlobalOutlined,
  DatabaseOutlined,
} from '@ant-design/icons';
import styles from './ModulePageShell.module.css';

type ModulePageId =
  | 'encoder-decoder'
  | 'crypto-tool'
  | 'time-tool'
  | 'code-formatter'
  | 'regex-tool'
  | 'qrcode-tool'
  | 'diff-tool'
  | 'http-debug'
  | 'ip-network'
  | 'recipe-tool';

interface ModulePageMeta {
  icon: ReactNode;
  titleKey: string;
  descriptionKey: string;
  fallbackTitle: string;
  fallbackDescription: string;
}

const MODULE_PAGE_META: Record<ModulePageId, ModulePageMeta> = {
  'encoder-decoder': {
    icon: <CodeOutlined />,
    titleKey: 'modules.encoder.name',
    descriptionKey: 'modules.encoder.description',
    fallbackTitle: '编码/解码',
    fallbackDescription: '支持多种编码格式的编码和解码工具',
  },
  'crypto-tool': {
    icon: <LockOutlined />,
    titleKey: 'modules.crypto.name',
    descriptionKey: 'modules.crypto.description',
    fallbackTitle: '加密/解密',
    fallbackDescription: '支持AES、DES、3DES等多种加密算法的加密解密工具',
  },
  'time-tool': {
    icon: <ClockCircleOutlined />,
    titleKey: 'modules.time.name',
    descriptionKey: 'modules.time.description',
    fallbackTitle: '时间工具',
    fallbackDescription: '时间格式转换、时间戳获取、UTC与本地时间转换等功能',
  },
  'code-formatter': {
    icon: <FormatPainterOutlined />,
    titleKey: 'modules.formatter.name',
    descriptionKey: 'modules.formatter.description',
    fallbackTitle: '代码格式化',
    fallbackDescription: '支持多种语言的代码格式化和压缩工具',
  },
  'regex-tool': {
    icon: <FileSearchOutlined />,
    titleKey: 'modules.regex.name',
    descriptionKey: 'modules.regex.description',
    fallbackTitle: '正则工具',
    fallbackDescription: '正则表达式测试、替换和分割工具',
  },
  'qrcode-tool': {
    icon: <QrcodeOutlined />,
    titleKey: 'modules.qrcode.name',
    descriptionKey: 'modules.qrcode.description',
    fallbackTitle: '二维码工具',
    fallbackDescription: '二维码生成与识别工具',
  },
  'diff-tool': {
    icon: <DiffOutlined />,
    titleKey: 'modules.diff.name',
    descriptionKey: 'modules.diff.description',
    fallbackTitle: 'Diff Tool',
    fallbackDescription: 'Compare text, code, or JSON files to find differences.',
  },
  'http-debug': {
    icon: <ApiOutlined />,
    titleKey: 'modules.httpDebug.name',
    descriptionKey: 'modules.httpDebug.description',
    fallbackTitle: '网络调试',
    fallbackDescription: 'HTTP 接口调试与 WebSocket 调试工具',
  },
  'ip-network': {
    icon: <GlobalOutlined />,
    titleKey: 'modules.ipNetwork.name',
    descriptionKey: 'modules.ipNetwork.description',
    fallbackTitle: 'IP/网络工具',
    fallbackDescription: 'IP 地址转换、CIDR 计算、子网划分、归属地查询、端口速查',
  },
  'recipe-tool': {
    icon: <DatabaseOutlined />,
    titleKey: 'modules.recipe.name',
    descriptionKey: 'modules.recipe.description',
    fallbackTitle: 'Recipe工具',
    fallbackDescription: '基于CyberChef设计理念的操作链式处理工具',
  },
};

interface ModulePageShellProps {
  moduleId: ModulePageId;
  children: ReactNode;
}

const ModulePageShell: React.FC<ModulePageShellProps> = ({ moduleId, children }) => {
  const { t } = useTranslation();
  const meta = MODULE_PAGE_META[moduleId];

  return (
    <div className={styles.pageShell}>
      <section className={styles.pageHeader}>
        <div className={styles.iconWrap} aria-hidden="true">
          {meta.icon}
        </div>
        <div className={styles.headerContent}>
          <h2 className={styles.headerTitle}>
            {t(meta.titleKey, meta.fallbackTitle)}
          </h2>
          <p className={styles.headerDesc}>
            {t(meta.descriptionKey, meta.fallbackDescription)}
          </p>
        </div>
        <span className={styles.moduleBadge}>MODULE</span>
      </section>

      <section className={styles.operationSurface}>
        {children}
      </section>
    </div>
  );
};

export default ModulePageShell;
