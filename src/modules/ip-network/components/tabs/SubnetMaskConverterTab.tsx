import React, { 
  useState, 
  useEffect, 
  useMemo, 
  useCallback, 
  useRef,
  useDeferredValue,
  useTransition,
  memo
} from 'react';
import { Card, Input, Row, Col, Typography, Divider, Tag, Table, Button, Space, Alert, Select, InputNumber } from 'antd';
import { CopyOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import type {
  SubnetMaskInfo,
  NetworkInfo,
  SubnetPlan
} from '../../utils/subnet-mask-converter';
import {
  getSubnetMaskInfo,
  calculateNetworkInfo,
  planSubnets,
  recommendSubnetMask
} from '../../utils/subnet-mask-converter';

const { Title, Text, Paragraph } = Typography;

// 使用 memo 缓存子组件，避免不必要的重渲染
const InfoCard = memo(({ 
  title, 
  children 
}: { 
  title: string; 
  children: React.ReactNode 
}) => (
  <Card title={title} size="small" style={{ marginBottom: 16 }}>
    {children}
  </Card>
));

InfoCard.displayName = 'InfoCard';

// 复制按钮组件 - 独立缓存
const CopyButton = memo(({ 
  text, 
  onCopy 
}: { 
  text: string; 
  onCopy: (text: string) => void 
}) => (
  <Button 
    type="text" 
    size="small" 
    icon={<CopyOutlined />} 
    onClick={() => onCopy(text)} 
  />
));

CopyButton.displayName = 'CopyButton';

// 信息项组件
const InfoItem = memo(({
  label,
  value,
  code = false,
  tag = false,
  onCopy,
  copyValue
}: {
  label: string;
  value: string | number;
  code?: boolean;
  tag?: boolean;
  onCopy?: (text: string) => void;
  copyValue?: string;
}) => (
  <div>
    <Text strong>{label}：</Text>
    <div>
      {tag ? (
        <Tag color="blue">{value}</Tag>
      ) : code ? (
        <Text code>{value}</Text>
      ) : (
        <Text>{value}</Text>
      )}
      {onCopy && copyValue && <CopyButton text={copyValue} onCopy={onCopy} />}
    </div>
  </div>
));

InfoItem.displayName = 'InfoItem';

/**
 * 子网掩码转换工具组件
 * 深度优化版本：组件拆分、useDeferredValue、useTransition
 */
const SubnetMaskConverterTab: React.FC = () => {
  const { t } = useTranslation();
  
  // 状态管理
  const [subnetMaskInput, setSubnetMaskInput] = useState<string>('24');
  const [ipAddress, setIpAddress] = useState<string>('192.168.1.1');
  const [subnetMaskInfo, setSubnetMaskInfo] = useState<SubnetMaskInfo | null>(null);
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo | null>(null);
  const [subnetPlans, setSubnetPlans] = useState<SubnetPlan[]>([]);
  const [subnetCidr, setSubnetCidr] = useState<number>(26);
  const [requiredHosts, setRequiredHosts] = useState<number>(10);
  const [recommendedCidr, setRecommendedCidr] = useState<number>(24);
  const [error, setError] = useState<string>('');
  
  // 使用 useTransition 处理非紧急更新
  const [isPending, startTransition] = useTransition();
  
  // 使用 useDeferredValue 延迟非关键更新
  const deferredSubnetMaskInput = useDeferredValue(subnetMaskInput);
  const deferredIpAddress = useDeferredValue(ipAddress);
  
  // 使用ref存储定时器
  const calculationTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // 格式化数字显示
  const formatNumber = useCallback((num: number): string => {
    return num.toLocaleString();
  }, []);
  
  // 复制到剪贴板
  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text).catch(() => {});
  }, []);
  
  // 计算子网掩码信息 - 使用 useCallback 缓存
  const calculateSubnetMaskInfo = useCallback(() => {
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current);
    }
    
    calculationTimeoutRef.current = setTimeout(() => {
      try {
        setError('');
        const info = getSubnetMaskInfo(deferredSubnetMaskInput);
        
        // 使用 startTransition 标记非紧急更新
        startTransition(() => {
          setSubnetMaskInfo(info);
          
          const netInfo = calculateNetworkInfo(deferredIpAddress, info.cidr);
          setNetworkInfo(netInfo);
          
          if (info.cidr < subnetCidr) {
            const plans = planSubnets(netInfo.networkAddress, info.cidr, subnetCidr);
            setSubnetPlans(plans);
          } else {
            setSubnetPlans([]);
          }
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : '计算失败');
        setSubnetMaskInfo(null);
        setNetworkInfo(null);
        setSubnetPlans([]);
      }
    }, 150); // 增加到150ms防抖
  }, [deferredSubnetMaskInput, deferredIpAddress, subnetCidr]);
  
  // 推荐子网掩码
  const calculateRecommendedCidr = useCallback(() => {
    const cidr = recommendSubnetMask(requiredHosts);
    setRecommendedCidr(cidr);
    setSubnetMaskInput(cidr.toString());
  }, [requiredHosts]);
  
  // 子网规划表格列定义
  const subnetPlanColumns = useMemo(() => [
    {
      title: t('modules.ipNetwork.subnetMaskConverter.index'),
      dataIndex: 'index',
      key: 'index',
      width: 60,
    },
    {
      title: t('modules.ipNetwork.subnetMaskConverter.networkAddress'),
      dataIndex: 'networkAddress',
      key: 'networkAddress',
      render: (text: string) => (
        <Space>
          <Text code>{text}</Text>
          <CopyButton text={text} onCopy={copyToClipboard} />
        </Space>
      ),
    },
    {
      title: t('modules.ipNetwork.subnetMaskConverter.broadcastAddress'),
      dataIndex: 'broadcastAddress',
      key: 'broadcastAddress',
      render: (text: string) => (
        <Space>
          <Text code>{text}</Text>
          <CopyButton text={text} onCopy={copyToClipboard} />
        </Space>
      ),
    },
    {
      title: t('modules.ipNetwork.subnetMaskConverter.ipRange'),
      key: 'ipRange',
      render: (record: SubnetPlan) => (
        <Space>
          <Text code>{record.firstUsableIp} - {record.lastUsableIp}</Text>
          <CopyButton 
            text={`${record.firstUsableIp} - ${record.lastUsableIp}`} 
            onCopy={copyToClipboard} 
          />
        </Space>
      ),
    },
    {
      title: t('modules.ipNetwork.subnetMaskConverter.subnetMaskLabel'),
      dataIndex: 'subnetMask',
      key: 'subnetMask',
      render: (text: string, record: SubnetPlan) => (
        <Space>
          <Text code>{text}</Text>
          <Text type="secondary">/{record.cidr}</Text>
        </Space>
      ),
    },
    {
      title: t('modules.ipNetwork.subnetMaskConverter.availableHosts'),
      dataIndex: 'hostCount',
      key: 'hostCount',
      render: (count: number) => <Text>{formatNumber(count)}</Text>,
    },
  ], [t, copyToClipboard, formatNumber]);
  
  // 初始计算
  useEffect(() => {
    calculateSubnetMaskInfo();
    
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current);
      }
    };
  }, []);
  
  // 当延迟输入变化时重新计算
  useEffect(() => {
    calculateSubnetMaskInfo();
  }, [calculateSubnetMaskInfo]);
  
  // 子网CIDR选项 - 使用 useMemo 缓存
  const subnetCidrOptions = useMemo(() => {
    if (!networkInfo) return [];
    const options = [];
    for (let cidr = networkInfo.subnetMask.cidr + 1; cidr <= 32; cidr++) {
      try {
        const info = getSubnetMaskInfo(cidr);
        options.push({
          value: cidr,
          label: `/${cidr} (${t('modules.ipNetwork.subnetMaskConverter.usableHosts')}: ${formatNumber(info.usableHosts)})`
        });
      } catch (e) {
        // 忽略无效CIDR
      }
    }
    return options;
  }, [networkInfo?.subnetMask.cidr, t, formatNumber]);
  
  // 计算推荐CIDR
  useEffect(() => {
    calculateRecommendedCidr();
  }, [calculateRecommendedCidr]);
  
  // 输入处理函数 - 立即更新输入值，延迟计算
  const handleSubnetMaskChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSubnetMaskInput(e.target.value);
  }, []);
  
  const handleIpAddressChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setIpAddress(e.target.value);
  }, []);
  
  return (
    <div style={{ padding: '16px' }}>
      <Title level={4}>{t('modules.ipNetwork.subnetMaskConverter.title')}</Title>
      <Paragraph type="secondary">
        {t('modules.ipNetwork.subnetMaskConverter.description')}
      </Paragraph>
      
      {/* 加载指示器 */}
      {isPending && (
        <div style={{ 
          position: 'fixed', 
          top: 16, 
          right: 16, 
          zIndex: 1000,
          padding: '8px 16px',
          background: '#1890ff',
          color: 'white',
          borderRadius: 4,
          fontSize: 12
        }}>
          计算中...
        </div>
      )}
      
      {/* 输入区域 */}
      <InfoCard title={t('modules.ipNetwork.subnetMaskConverter.inputTitle')}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <label>
              <Text strong>{t('modules.ipNetwork.subnetMaskConverter.subnetMaskInput')}：</Text>
              <Input
                placeholder={t('modules.ipNetwork.subnetMaskConverter.subnetMaskPlaceholder')}
                value={subnetMaskInput}
                onChange={handleSubnetMaskChange}
                style={{ marginTop: 8 }}
              />
            </label>
          </Col>
          <Col span={12}>
            <label>
              <Text strong>{t('modules.ipNetwork.subnetMaskConverter.ipAddress')}：</Text>
              <Input
                placeholder={t('modules.ipNetwork.subnetMaskConverter.ipAddressPlaceholder')}
                value={ipAddress}
                onChange={handleIpAddressChange}
                style={{ marginTop: 8 }}
              />
            </label>
          </Col>
        </Row>
        
        {error && (
          <Alert
            message={t('modules.ipNetwork.subnetMaskConverter.calculateError')}
            description={error}
            type="error"
            showIcon
            style={{ marginTop: 16 }}
          />
        )}
      </InfoCard>
      
      {/* 子网掩码信息 */}
      {subnetMaskInfo && (
        <InfoCard title={t('modules.ipNetwork.subnetMaskConverter.subnetMaskInfo')}>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <InfoItem 
                label={t('modules.ipNetwork.subnetMaskConverter.cidrNotation')}
                value={`/${subnetMaskInfo.cidr}`}
                tag
                onCopy={copyToClipboard}
                copyValue={subnetMaskInfo.cidr.toString()}
              />
            </Col>
            <Col span={6}>
              <InfoItem 
                label={t('modules.ipNetwork.subnetMaskConverter.dottedDecimal')}
                value={subnetMaskInfo.dottedDecimal}
                code
                onCopy={copyToClipboard}
                copyValue={subnetMaskInfo.dottedDecimal}
              />
            </Col>
            <Col span={6}>
              <InfoItem 
                label={t('modules.ipNetwork.subnetMaskConverter.binaryNotation')}
                value={subnetMaskInfo.binary}
                code
                onCopy={copyToClipboard}
                copyValue={subnetMaskInfo.binary}
              />
            </Col>
            <Col span={6}>
              <InfoItem 
                label={t('modules.ipNetwork.subnetMaskConverter.hexadecimal')}
                value={subnetMaskInfo.hexadecimal}
                code
                onCopy={copyToClipboard}
                copyValue={subnetMaskInfo.hexadecimal}
              />
            </Col>
          </Row>
          
          <Divider />
          
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <InfoItem 
                label={t('modules.ipNetwork.subnetMaskConverter.subnetBits')}
                value={subnetMaskInfo.subnetBits}
              />
            </Col>
            <Col span={6}>
              <InfoItem 
                label={t('modules.ipNetwork.subnetMaskConverter.hostBits')}
                value={subnetMaskInfo.hostBits}
              />
            </Col>
            <Col span={6}>
              <InfoItem 
                label={t('modules.ipNetwork.subnetMaskConverter.subnetCount')}
                value={formatNumber(subnetMaskInfo.subnetCount)}
              />
            </Col>
            <Col span={6}>
              <InfoItem 
                label={t('modules.ipNetwork.subnetMaskConverter.usableHosts')}
                value={formatNumber(subnetMaskInfo.usableHosts)}
              />
            </Col>
          </Row>
        </InfoCard>
      )}
      
      {/* 网络信息 */}
      {networkInfo && (
        <InfoCard title={t('modules.ipNetwork.subnetMaskConverter.networkInfo')}>
          <Row gutter={[16, 16]}>
            <Col span={6}>
              <InfoItem 
                label={t('modules.ipNetwork.subnetMaskConverter.networkAddress')}
                value={networkInfo.networkAddress}
                code
                onCopy={copyToClipboard}
                copyValue={networkInfo.networkAddress}
              />
            </Col>
            <Col span={6}>
              <InfoItem 
                label={t('modules.ipNetwork.subnetMaskConverter.broadcastAddress')}
                value={networkInfo.broadcastAddress}
                code
                onCopy={copyToClipboard}
                copyValue={networkInfo.broadcastAddress}
              />
            </Col>
            <Col span={6}>
              <InfoItem 
                label={t('modules.ipNetwork.subnetMaskConverter.usableIpRange')}
                value={`${networkInfo.firstUsableIp} - ${networkInfo.lastUsableIp}`}
                code
                onCopy={copyToClipboard}
                copyValue={`${networkInfo.firstUsableIp} - ${networkInfo.lastUsableIp}`}
              />
            </Col>
            <Col span={6}>
              <InfoItem 
                label={t('modules.ipNetwork.subnetMaskConverter.wildcardMask')}
                value={networkInfo.wildcardMask}
                code
                onCopy={copyToClipboard}
                copyValue={networkInfo.wildcardMask}
              />
            </Col>
          </Row>
        </InfoCard>
      )}
      
      {/* 子网规划工具 */}
      {networkInfo && (
        <InfoCard title={t('modules.ipNetwork.subnetMaskConverter.subnetPlanning')}>
          <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
            <Col span={8}>
              <Text strong>{t('modules.ipNetwork.subnetMaskConverter.subnetCidr')}：</Text>
              <Select
                value={subnetCidr}
                onChange={setSubnetCidr}
                style={{ width: '100%', marginTop: 8 }}
                options={subnetCidrOptions}
              />
            </Col>
            <Col span={8}>
              <Text strong>{t('modules.ipNetwork.subnetMaskConverter.subnetCountLabel')}：</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color="green">{formatNumber(Math.pow(2, subnetCidr - networkInfo.subnetMask.cidr))}</Tag>
              </div>
            </Col>
            <Col span={8}>
              <Text strong>{t('modules.ipNetwork.subnetMaskConverter.hostsPerSubnet')}：</Text>
              <div style={{ marginTop: 8 }}>
                <Tag color="blue">{formatNumber(getSubnetMaskInfo(subnetCidr).usableHosts)}</Tag>
              </div>
            </Col>
          </Row>
          
          {subnetPlans.length > 0 && (
            <Table
              columns={subnetPlanColumns}
              dataSource={subnetPlans}
              pagination={{ 
                pageSize: 10,
                showSizeChanger: true,
                pageSizeOptions: ['10', '20', '50', '100'],
                showTotal: (total) => `共 ${total} 条`
              }}
              size="small"
              rowKey="index"
              scroll={{ y: 400 }}
              virtual={subnetPlans.length > 50}
            />
          )}
        </InfoCard>
      )}
      
      {/* 子网掩码推荐工具 */}
      <InfoCard title={t('modules.ipNetwork.subnetMaskConverter.subnetMaskRecommendation')}>
        <Row gutter={[16, 16]}>
          <Col span={8}>
            <Text strong>{t('modules.ipNetwork.subnetMaskConverter.requiredHosts')}：</Text>
            <InputNumber
              min={1}
              max={16777214}
              value={requiredHosts}
              onChange={(value) => value && setRequiredHosts(value)}
              style={{ width: '100%', marginTop: 8 }}
            />
          </Col>
          <Col span={8}>
            <InfoItem 
              label={t('modules.ipNetwork.subnetMaskConverter.recommendedCidr')}
              value={`/${recommendedCidr}`}
              tag
              onCopy={copyToClipboard}
              copyValue={recommendedCidr.toString()}
            />
          </Col>
          <Col span={8}>
            <InfoItem 
              label={t('modules.ipNetwork.subnetMaskConverter.recommendedSubnetMask')}
              value={getSubnetMaskInfo(recommendedCidr).dottedDecimal}
              code
              onCopy={copyToClipboard}
              copyValue={getSubnetMaskInfo(recommendedCidr).dottedDecimal}
            />
          </Col>
        </Row>
      </InfoCard>
    </div>
  );
};

export default SubnetMaskConverterTab;
