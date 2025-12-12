import React, { useState } from 'react';
import { Card, Button, Space, Row, Col, Typography, message } from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';
import {
  generateUUIDv1,
  generateUUID,
  generateGUID,
  generateUUIDNoDash,
  generateShortUUID,
  generateNanoID,
  generateULID,
  generateSnowflakeID,
  generateObjectId,
  generateCUID,
  generateKSUID,
  generateRandomString,
} from '../../utils/generators';

const { Text } = Typography;

const UUIDTab: React.FC = () => {
  const [uuidv1, setUuidv1] = useState(generateUUIDv1());
  const [uuid, setUuid] = useState(generateUUID());
  const [guid, setGuid] = useState(generateGUID());
  const [uuidNoDash, setUuidNoDash] = useState(generateUUIDNoDash());
  const [shortUuid, setShortUuid] = useState(generateShortUUID());
  const [nanoId, setNanoId] = useState(generateNanoID());
  const [ulid, setUlid] = useState(generateULID());
  const [snowflake, setSnowflake] = useState(generateSnowflakeID());
  const [objectId, setObjectId] = useState(generateObjectId());
  const [cuid, setCuid] = useState(generateCUID());
  const [ksuid, setKsuid] = useState(generateKSUID());
  const [randomStr, setRandomStr] = useState(generateRandomString());

  const copyToClipboard = async (text: string) => {
    if (!text) { message.warning('没有可复制的内容'); return; }
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制');
    } catch { message.error('复制失败'); }
  };

  const refreshAllUUIDs = () => {
    setUuidv1(generateUUIDv1());
    setUuid(generateUUID());
    setGuid(generateGUID());
    setUuidNoDash(generateUUIDNoDash());
    setShortUuid(generateShortUUID());
    setNanoId(generateNanoID());
    setUlid(generateULID());
    setSnowflake(generateSnowflakeID());
    setObjectId(generateObjectId());
    setCuid(generateCUID());
    setKsuid(generateKSUID());
    setRandomStr(generateRandomString());
  };

  const items = [
    { title: 'UUID v1 (时间戳)', value: uuidv1, gen: () => setUuidv1(generateUUIDv1()), desc: '基于时间戳生成' },
    { title: 'UUID v4 (随机)', value: uuid, gen: () => setUuid(generateUUID()), desc: '完全随机生成' },
    { title: 'GUID (大写)', value: guid, gen: () => setGuid(generateGUID()), desc: 'UUID v4 大写格式' },
    { title: 'UUID (无连字符)', value: uuidNoDash, gen: () => setUuidNoDash(generateUUIDNoDash()), desc: '32位无连字符' },
    { title: '短 UUID', value: shortUuid, gen: () => setShortUuid(generateShortUUID()), desc: '时间戳+随机' },
    { title: 'NanoID', value: nanoId, gen: () => setNanoId(generateNanoID()), desc: '21字符URL安全' },
    { title: 'ULID', value: ulid, gen: () => setUlid(generateULID()), desc: '时间排序唯一ID' },
    { title: 'Snowflake ID', value: snowflake, gen: () => setSnowflake(generateSnowflakeID()), desc: '分布式ID (Twitter)' },
    { title: 'ObjectId', value: objectId, gen: () => setObjectId(generateObjectId()), desc: 'MongoDB风格' },
    { title: 'CUID', value: cuid, gen: () => setCuid(generateCUID()), desc: '碰撞安全ID' },
    { title: 'KSUID', value: ksuid, gen: () => setKsuid(generateKSUID()), desc: 'K-Sortable ID' },
    { title: '随机字符串', value: randomStr, gen: () => setRandomStr(generateRandomString()), desc: '16位字母数字' },
  ];

  return (
    <>
      <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
        <Button icon={<ReloadOutlined />} onClick={refreshAllUUIDs}>刷新全部</Button>
      </div>
      <Row gutter={[16, 16]}>
        {items.map(item => (
          <Col span={12} key={item.title}>
            <Card size="small" title={<span>{item.title} <Text type="secondary" style={{ fontSize: 11, fontWeight: 'normal' }}>({item.desc})</Text></span>}>
              <Space style={{ width: '100%', justifyContent: 'space-between' }}>
                <Text code style={{ fontSize: 11, wordBreak: 'break-all', maxWidth: 280, display: 'inline-block' }}>{item.value}</Text>
                <Space>
                  <Button size="small" icon={<ReloadOutlined />} onClick={item.gen} />
                  <Button size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(item.value)} />
                </Space>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  );
};

export default UUIDTab;
