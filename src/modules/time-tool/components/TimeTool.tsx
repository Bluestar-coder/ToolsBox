import React, { useState, useEffect } from 'react';
import {
  Card,
  Input,
  Select,
  Button,
  Space,
  Row,
  Col,
  Typography,
  message,
  Tabs,
  InputNumber,
} from 'antd';
import { CopyOutlined, ReloadOutlined } from '@ant-design/icons';

const { TextArea } = Input;
const { Text } = Typography;

// 完整时区列表
const timezones = [
  // GMT-12 到 GMT-9
  { value: 'Pacific/Baker', label: '🇺🇸 贝克岛 (GMT-12)', offset: -12 },
  { value: 'Pacific/Midway', label: '🇺🇸 中途岛 (GMT-11)', offset: -11 },
  { value: 'Pacific/Honolulu', label: '🇺🇸 夏威夷 (GMT-10)', offset: -10 },
  { value: 'America/Adak', label: '🇺🇸 阿达克 (GMT-10)', offset: -10 },
  { value: 'America/Anchorage', label: '🇺🇸 安克雷奇 (GMT-9)', offset: -9 },
  // GMT-8 到 GMT-5
  { value: 'America/Los_Angeles', label: '🇺🇸 洛杉矶 (PST, GMT-8)', offset: -8 },
  { value: 'America/Vancouver', label: '🇨🇦 温哥华 (PST, GMT-8)', offset: -8 },
  { value: 'America/Denver', label: '🇺🇸 丹佛 (MST, GMT-7)', offset: -7 },
  { value: 'America/Phoenix', label: '🇺🇸 凤凰城 (MST, GMT-7)', offset: -7 },
  { value: 'America/Chicago', label: '🇺🇸 芝加哥 (CST, GMT-6)', offset: -6 },
  { value: 'America/Mexico_City', label: '🇲🇽 墨西哥城 (CST, GMT-6)', offset: -6 },
  { value: 'America/New_York', label: '🇺🇸 纽约 (EST, GMT-5)', offset: -5 },
  { value: 'America/Toronto', label: '🇨🇦 多伦多 (EST, GMT-5)', offset: -5 },
  { value: 'America/Bogota', label: '🇨🇴 波哥大 (GMT-5)', offset: -5 },
  // GMT-4 到 GMT-3
  { value: 'America/Caracas', label: '🇻🇪 加拉加斯 (GMT-4)', offset: -4 },
  { value: 'America/Santiago', label: '🇨🇱 圣地亚哥 (GMT-4)', offset: -4 },
  { value: 'America/Halifax', label: '🇨🇦 哈利法克斯 (GMT-4)', offset: -4 },
  { value: 'America/St_Johns', label: '🇨🇦 圣约翰斯 (GMT-3:30)', offset: -3.5 },
  { value: 'America/Buenos_Aires', label: '🇦🇷 布宜诺斯艾利斯 (GMT-3)', offset: -3 },
  { value: 'America/Sao_Paulo', label: '🇧🇷 圣保罗 (GMT-3)', offset: -3 },
  // GMT-2 到 GMT-1
  { value: 'Atlantic/South_Georgia', label: '🇬🇸 南乔治亚 (GMT-2)', offset: -2 },
  { value: 'Atlantic/Azores', label: '🇵🇹 亚速尔群岛 (GMT-1)', offset: -1 },
  { value: 'Atlantic/Cape_Verde', label: '🇨🇻 佛得角 (GMT-1)', offset: -1 },
  // GMT+0
  { value: 'UTC', label: '🌍 UTC (GMT+0)', offset: 0 },
  { value: 'Europe/London', label: '🇬🇧 伦敦 (GMT+0)', offset: 0 },
  { value: 'Europe/Dublin', label: '🇮🇪 都柏林 (GMT+0)', offset: 0 },
  { value: 'Europe/Lisbon', label: '🇵🇹 里斯本 (GMT+0)', offset: 0 },
  { value: 'Africa/Casablanca', label: '🇲🇦 卡萨布兰卡 (GMT+0)', offset: 0 },
  // GMT+1
  { value: 'Europe/Berlin', label: '🇩🇪 柏林 (CET, GMT+1)', offset: 1 },
  { value: 'Europe/Paris', label: '🇫🇷 巴黎 (CET, GMT+1)', offset: 1 },
  { value: 'Europe/Rome', label: '🇮🇹 罗马 (CET, GMT+1)', offset: 1 },
  { value: 'Europe/Madrid', label: '🇪🇸 马德里 (CET, GMT+1)', offset: 1 },
  { value: 'Europe/Amsterdam', label: '🇳🇱 阿姆斯特丹 (CET, GMT+1)', offset: 1 },
  { value: 'Europe/Brussels', label: '🇧🇪 布鲁塞尔 (CET, GMT+1)', offset: 1 },
  { value: 'Africa/Lagos', label: '🇳🇬 拉各斯 (GMT+1)', offset: 1 },
  // GMT+2
  { value: 'Europe/Athens', label: '🇬🇷 雅典 (EET, GMT+2)', offset: 2 },
  { value: 'Europe/Helsinki', label: '🇫🇮 赫尔辛基 (EET, GMT+2)', offset: 2 },
  { value: 'Europe/Kiev', label: '🇺🇦 基辅 (EET, GMT+2)', offset: 2 },
  { value: 'Africa/Cairo', label: '🇪🇬 开罗 (GMT+2)', offset: 2 },
  { value: 'Africa/Johannesburg', label: '🇿🇦 约翰内斯堡 (GMT+2)', offset: 2 },
  { value: 'Asia/Jerusalem', label: '🇮🇱 耶路撒冷 (GMT+2)', offset: 2 },
  // GMT+3
  { value: 'Europe/Moscow', label: '🇷🇺 莫斯科 (MSK, GMT+3)', offset: 3 },
  { value: 'Europe/Istanbul', label: '🇹🇷 伊斯坦布尔 (GMT+3)', offset: 3 },
  { value: 'Asia/Baghdad', label: '🇮🇶 巴格达 (GMT+3)', offset: 3 },
  { value: 'Asia/Riyadh', label: '🇸🇦 利雅得 (GMT+3)', offset: 3 },
  { value: 'Africa/Nairobi', label: '🇰🇪 内罗毕 (GMT+3)', offset: 3 },
  // GMT+3:30 到 GMT+4
  { value: 'Asia/Tehran', label: '🇮🇷 德黑兰 (GMT+3:30)', offset: 3.5 },
  { value: 'Asia/Dubai', label: '🇦🇪 迪拜 (GMT+4)', offset: 4 },
  { value: 'Asia/Baku', label: '🇦🇿 巴库 (GMT+4)', offset: 4 },
  // GMT+4:30 到 GMT+5
  { value: 'Asia/Kabul', label: '🇦🇫 喀布尔 (GMT+4:30)', offset: 4.5 },
  { value: 'Asia/Karachi', label: '🇵🇰 卡拉奇 (GMT+5)', offset: 5 },
  { value: 'Asia/Tashkent', label: '🇺🇿 塔什干 (GMT+5)', offset: 5 },
  // GMT+5:30 到 GMT+6
  { value: 'Asia/Kolkata', label: '🇮🇳 印度 (IST, GMT+5:30)', offset: 5.5 },
  { value: 'Asia/Colombo', label: '🇱🇰 科伦坡 (GMT+5:30)', offset: 5.5 },
  { value: 'Asia/Kathmandu', label: '🇳🇵 加德满都 (GMT+5:45)', offset: 5.75 },
  { value: 'Asia/Dhaka', label: '🇧🇩 达卡 (GMT+6)', offset: 6 },
  { value: 'Asia/Almaty', label: '🇰🇿 阿拉木图 (GMT+6)', offset: 6 },
  // GMT+6:30 到 GMT+7
  { value: 'Asia/Yangon', label: '🇲🇲 仰光 (GMT+6:30)', offset: 6.5 },
  { value: 'Asia/Bangkok', label: '🇹🇭 曼谷 (GMT+7)', offset: 7 },
  { value: 'Asia/Jakarta', label: '🇮🇩 雅加达 (GMT+7)', offset: 7 },
  { value: 'Asia/Ho_Chi_Minh', label: '🇻🇳 胡志明市 (GMT+7)', offset: 7 },
  // GMT+8
  { value: 'Asia/Shanghai', label: '🇨🇳 中国 (CST, GMT+8)', offset: 8 },
  { value: 'Asia/Hong_Kong', label: '🇭🇰 香港 (GMT+8)', offset: 8 },
  { value: 'Asia/Taipei', label: '🇹🇼 台北 (GMT+8)', offset: 8 },
  { value: 'Asia/Singapore', label: '🇸🇬 新加坡 (GMT+8)', offset: 8 },
  { value: 'Asia/Kuala_Lumpur', label: '🇲🇾 吉隆坡 (GMT+8)', offset: 8 },
  { value: 'Australia/Perth', label: '🇦🇺 珀斯 (GMT+8)', offset: 8 },
  { value: 'Asia/Manila', label: '🇵🇭 马尼拉 (GMT+8)', offset: 8 },
  // GMT+9
  { value: 'Asia/Tokyo', label: '🇯🇵 东京 (JST, GMT+9)', offset: 9 },
  { value: 'Asia/Seoul', label: '🇰🇷 首尔 (KST, GMT+9)', offset: 9 },
  // GMT+9:30 到 GMT+10
  { value: 'Australia/Darwin', label: '🇦🇺 达尔文 (GMT+9:30)', offset: 9.5 },
  { value: 'Australia/Adelaide', label: '🇦🇺 阿德莱德 (GMT+9:30)', offset: 9.5 },
  { value: 'Australia/Sydney', label: '🇦🇺 悉尼 (AEST, GMT+10)', offset: 10 },
  { value: 'Australia/Melbourne', label: '🇦🇺 墨尔本 (AEST, GMT+10)', offset: 10 },
  { value: 'Australia/Brisbane', label: '🇦🇺 布里斯班 (GMT+10)', offset: 10 },
  { value: 'Pacific/Guam', label: '🇬🇺 关岛 (GMT+10)', offset: 10 },
  // GMT+11 到 GMT+12
  { value: 'Pacific/Noumea', label: '🇳🇨 努美阿 (GMT+11)', offset: 11 },
  { value: 'Pacific/Auckland', label: '🇳🇿 奥克兰 (NZST, GMT+12)', offset: 12 },
  { value: 'Pacific/Fiji', label: '🇫🇯 斐济 (GMT+12)', offset: 12 },
  // GMT+13 到 GMT+14
  { value: 'Pacific/Tongatapu', label: '🇹🇴 汤加 (GMT+13)', offset: 13 },
  { value: 'Pacific/Kiritimati', label: '🇰🇮 基里巴斯 (GMT+14)', offset: 14 },
];

// 编程语言选项
const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'php', label: 'PHP' },
  { value: 'csharp', label: 'C#' },
];

// UUID 生成函数
// UUID v1 (基于时间戳)
const generateUUIDv1 = (): string => {
  const now = Date.now();
  const timeHex = now.toString(16).padStart(12, '0');
  const clockSeq = Math.floor(Math.random() * 0x3fff) | 0x8000;
  const node = Array.from({ length: 6 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
  return `${timeHex.slice(0, 8)}-${timeHex.slice(8, 12)}-1${timeHex.slice(9, 12)}-${clockSeq.toString(16)}-${node}`;
};

// UUID v4 (随机)
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// GUID (大写)
const generateGUID = (): string => generateUUID().toUpperCase();

// UUID 无连字符
const generateUUIDNoDash = (): string => generateUUID().replace(/-/g, '');

// 短 UUID (基于时间戳+随机)
const generateShortUUID = (): string => Date.now().toString(36) + Math.random().toString(36).substring(2, 10);

// NanoID 风格 (21字符)
const generateNanoID = (size: number = 21): string => {
  const alphabet = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_';
  return Array.from({ length: size }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
};

// ULID (时间排序的唯一ID)
const generateULID = (): string => {
  const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
  const now = Date.now();
  let timeStr = '';
  let t = now;
  for (let i = 0; i < 10; i++) {
    timeStr = ENCODING[t % 32] + timeStr;
    t = Math.floor(t / 32);
  }
  const randomStr = Array.from({ length: 16 }, () => ENCODING[Math.floor(Math.random() * 32)]).join('');
  return timeStr + randomStr;
};

// Snowflake ID (模拟)
const generateSnowflakeID = (): string => {
  const epoch = 1609459200000; // 2021-01-01
  const timestamp = Date.now() - epoch;
  const workerId = Math.floor(Math.random() * 32);
  const datacenterId = Math.floor(Math.random() * 32);
  const sequence = Math.floor(Math.random() * 4096);
  const id = BigInt(timestamp) << BigInt(22) | BigInt(datacenterId) << BigInt(17) | BigInt(workerId) << BigInt(12) | BigInt(sequence);
  return id.toString();
};

// ObjectId (MongoDB风格)
const generateObjectId = (): string => {
  const timestamp = Math.floor(Date.now() / 1000).toString(16).padStart(8, '0');
  const machineId = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
  const processId = Math.floor(Math.random() * 65536).toString(16).padStart(4, '0');
  const counter = Math.floor(Math.random() * 16777216).toString(16).padStart(6, '0');
  return timestamp + machineId + processId + counter;
};

// CUID (碰撞安全ID)
const generateCUID = (): string => {
  const timestamp = Date.now().toString(36);
  const counter = Math.floor(Math.random() * 1679616).toString(36).padStart(4, '0');
  const fingerprint = Math.floor(Math.random() * 1679616).toString(36).padStart(4, '0');
  const random = Math.random().toString(36).substring(2, 10);
  return 'c' + timestamp + counter + fingerprint + random;
};

// KSUID (K-Sortable Unique ID)
const generateKSUID = (): string => {
  const epoch = 1400000000;
  const timestamp = Math.floor(Date.now() / 1000) - epoch;
  const payload = Array.from({ length: 16 }, () => Math.floor(Math.random() * 256));
  const timestampBytes = [(timestamp >> 24) & 0xff, (timestamp >> 16) & 0xff, (timestamp >> 8) & 0xff, timestamp & 0xff];
  const allBytes = [...timestampBytes, ...payload];
  return allBytes.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
};

// 随机字符串
const generateRandomString = (length: number = 16, charset: string = 'alphanumeric'): string => {
  const charsets: Record<string, string> = {
    alphanumeric: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    numeric: '0123456789',
    hex: '0123456789abcdef',
  };
  const chars = charsets[charset] || charsets.alphanumeric;
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

// 智能解析时间
const parseSmartTime = (input: string): Date | null => {
  if (!input.trim()) return null;
  const trimmed = input.trim().toLowerCase();
  
  // 特殊关键字
  if (trimmed === 'now' || trimmed === 'today') return new Date();
  if (trimmed === 'yesterday') {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d;
  }
  
  // 时间戳 (秒或毫秒)
  if (/^\d{10}$/.test(trimmed)) return new Date(parseInt(trimmed) * 1000);
  if (/^\d{13}$/.test(trimmed)) return new Date(parseInt(trimmed));
  
  // 标准格式
  const parsed = new Date(input);
  if (!isNaN(parsed.getTime())) return parsed;
  
  return null;
};

// 生成代码
const generateCode = (timestamp: number, lang: string): string => {
  const codes: Record<string, string> = {
    javascript: `// JavaScript\nconst date = new Date(${timestamp});\nconsole.log(date.toISOString());`,
    python: `# Python\nimport datetime\ndate = datetime.datetime.fromtimestamp(${Math.floor(timestamp / 1000)})\nprint(date)`,
    java: `// Java\nimport java.util.Date;\nDate date = new Date(${timestamp}L);\nSystem.out.println(date);`,
    go: `// Go\nimport "time"\nt := time.Unix(${Math.floor(timestamp / 1000)}, 0)\nfmt.Println(t)`,
    php: `<?php\n$date = date('Y-m-d H:i:s', ${Math.floor(timestamp / 1000)});\necho $date;`,
    csharp: `// C#\nDateTime date = DateTimeOffset.FromUnixTimeMilliseconds(${timestamp}).DateTime;\nConsole.WriteLine(date);`,
  };
  return codes[lang] || '';
};

const TimeTool: React.FC = () => {
  const [activeTab, setActiveTab] = useState('smart');
  
  // 当前时间状态
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // 智能解析状态
  const [smartInput, setSmartInput] = useState('');
  const [smartResult, setSmartResult] = useState('');
  
  // 代码生成状态
  const [codeInput, setCodeInput] = useState('');
  const [codeLang, setCodeLang] = useState('javascript');
  const [generatedCode, setGeneratedCode] = useState('');
  
  // 时间计算状态
  const [calcStart, setCalcStart] = useState('');
  const [calcEnd, setCalcEnd] = useState('');
  const [calcDiffResult, setCalcDiffResult] = useState('');
  const [calcBaseTime, setCalcBaseTime] = useState('');
  const [calcOperation, setCalcOperation] = useState<'add' | 'subtract'>('add');
  const [calcAmount, setCalcAmount] = useState<number>(1);
  const [calcUnit, setCalcUnit] = useState<'seconds' | 'minutes' | 'hours' | 'days'>('days');
  const [calcOpResult, setCalcOpResult] = useState('');
  
  // 批量转换状态
  const [batchInput, setBatchInput] = useState('');
  const [batchResult, setBatchResult] = useState('');
  
  // 时区转换状态
  const [tzInput, setTzInput] = useState('');
  const [fromTz, setFromTz] = useState('Asia/Shanghai');
  const [toTz, setToTz] = useState('UTC');
  const [tzResult, setTzResult] = useState('');
  
  // UUID 状态
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

  // 更新当前时间
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const copyToClipboard = async (text: string) => {
    if (!text) { message.warning('没有可复制的内容'); return; }
    try {
      await navigator.clipboard.writeText(text);
      message.success('已复制');
    } catch { message.error('复制失败'); }
  };

  const formatDateTime = (d: Date) => {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  // 智能解析
  const handleSmartParse = () => {
    const parsed = parseSmartTime(smartInput);
    if (parsed) {
      setSmartResult(`本地时间: ${formatDateTime(parsed)}\nUnix时间戳(秒): ${Math.floor(parsed.getTime() / 1000)}\nUnix时间戳(毫秒): ${parsed.getTime()}\nISO 8601: ${parsed.toISOString()}`);
    } else {
      setSmartResult('无法解析输入的时间格式');
    }
  };

  // 生成代码
  const handleGenerateCode = () => {
    const parsed = parseSmartTime(codeInput);
    if (parsed) {
      setGeneratedCode(generateCode(parsed.getTime(), codeLang));
    } else {
      message.error('请输入有效的时间');
    }
  };

  // 计算时间差
  const handleCalcDiff = () => {
    const start = parseSmartTime(calcStart);
    const end = parseSmartTime(calcEnd);
    if (!start || !end) { message.error('请输入有效的时间'); return; }
    const diffMs = end.getTime() - start.getTime();
    const diffSec = Math.abs(Math.floor(diffMs / 1000));
    const days = Math.floor(diffSec / 86400);
    const hours = Math.floor((diffSec % 86400) / 3600);
    const minutes = Math.floor((diffSec % 3600) / 60);
    const seconds = diffSec % 60;
    setCalcDiffResult(`相差: ${days}天 ${hours}小时 ${minutes}分钟 ${seconds}秒\n总秒数: ${diffSec}秒\n总毫秒数: ${Math.abs(diffMs)}毫秒`);
  };

  // 时间加减运算
  const handleCalcOp = () => {
    const base = parseSmartTime(calcBaseTime);
    if (!base) { message.error('请输入有效的基准时间'); return; }
    const multiplier = calcOperation === 'add' ? 1 : -1;
    const msMap = { seconds: 1000, minutes: 60000, hours: 3600000, days: 86400000 };
    const result = new Date(base.getTime() + multiplier * calcAmount * msMap[calcUnit]);
    setCalcOpResult(formatDateTime(result));
  };

  // 批量转换
  const handleBatchConvert = () => {
    const lines = batchInput.split('\n').filter(l => l.trim());
    const results = lines.map(line => {
      const parsed = parseSmartTime(line.trim());
      if (parsed) return `${line.trim()} → ${formatDateTime(parsed)} (${Math.floor(parsed.getTime() / 1000)})`;
      return `${line.trim()} → 无法解析`;
    });
    setBatchResult(results.join('\n'));
  };

  // 时区转换
  const handleTzConvert = () => {
    const parsed = parseSmartTime(tzInput);
    if (!parsed) { message.error('请输入有效的时间'); return; }
    const fromOffset = timezones.find(t => t.value === fromTz)?.offset || 0;
    const toOffset = timezones.find(t => t.value === toTz)?.offset || 0;
    const utcTime = parsed.getTime() - fromOffset * 3600000;
    const targetTime = new Date(utcTime + toOffset * 3600000);
    setTzResult(formatDateTime(targetTime));
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

  const tabItems = [
    { key: 'smart', label: '🔍 智能解析' },
    { key: 'code', label: '💻 代码生成' },
    { key: 'calc', label: '🧮 时间计算' },
    { key: 'batch', label: '📋 批量转换' },
    { key: 'timezone', label: '🌍 时区专家' },
    { key: 'uuid', label: '🔑 随机唯一值' },
  ];

  return (
    <Card title="时间处理工具" bordered={false}>
      <Tabs activeKey={activeTab} onChange={setActiveTab} items={tabItems} style={{ marginBottom: 16 }} />

      {/* 智能解析 */}
      {activeTab === 'smart' && (
        <>
          {/* 快捷操作 */}
          <Card size="small" title="⚡ 快捷操作" style={{ marginBottom: 16 }}>
            <Space wrap>
              <Button onClick={() => setSmartInput('now')}>当前时间</Button>
              <Button onClick={() => setSmartInput('today')}>今天开始</Button>
              <Button onClick={() => setSmartInput('yesterday')}>昨天</Button>
              <Button onClick={() => {
                const d = new Date();
                d.setDate(d.getDate() - d.getDay());
                setSmartInput(formatDateTime(d));
              }}>本周开始</Button>
              <Button onClick={() => {
                const d = new Date();
                d.setDate(1);
                setSmartInput(formatDateTime(d));
              }}>本月开始</Button>
            </Space>
          </Card>
          
          <Row gutter={16}>
            <Col span={12}>
              {/* 当前时间显示 */}
              <Card size="small" title="⏰ 当前时间" style={{ marginBottom: 16 }} extra={<Button size="small" icon={<ReloadOutlined />} onClick={() => setCurrentTime(new Date())}>刷新</Button>}>
                <Row gutter={8}>
                  <Col span={8}>
                    <div style={{ fontSize: 12, color: '#999' }}>当前本地时间</div>
                    <Input value={formatDateTime(currentTime)} readOnly size="small" />
                  </Col>
                  <Col span={8}>
                    <div style={{ fontSize: 12, color: '#999' }}>Unix时间戳(秒)</div>
                    <Input value={Math.floor(currentTime.getTime() / 1000)} readOnly size="small" />
                  </Col>
                  <Col span={8}>
                    <div style={{ fontSize: 12, color: '#999' }}>Unix时间戳(毫秒)</div>
                    <Input value={currentTime.getTime()} readOnly size="small" />
                  </Col>
                </Row>
              </Card>
              
              {/* 输入时间 */}
              <Card size="small" title="📝 输入时间（支持多种格式）">
                <TextArea
                  value={smartInput}
                  onChange={(e) => setSmartInput(e.target.value)}
                  placeholder={`试试输入：\n• 1749722690 (时间戳)\n• 2025-06-12 18:06:25\n• now / today / yesterday\n• 2025/06/12\n• Jun 12, 2025`}
                  rows={6}
                  style={{ marginBottom: 8 }}
                />
                <Space>
                  <Button type="primary" onClick={handleSmartParse}>🔍 解析</Button>
                  <Button onClick={() => { setSmartInput(''); setSmartResult(''); }}>清空</Button>
                </Space>
              </Card>
            </Col>
            <Col span={12}>
              <Card size="small" title="📊 解析结果">
                <TextArea value={smartResult} readOnly rows={10} placeholder="解析结果将显示在这里" />
                {smartResult && (
                  <Button size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(smartResult)} style={{ marginTop: 8 }}>
                    复制结果
                  </Button>
                )}
              </Card>
            </Col>
          </Row>
        </>
      )}

      {/* 代码生成 */}
      {activeTab === 'code' && (
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="⚡ 时间输入与语言选择">
              <div style={{ marginBottom: 12 }}>
                <div style={{ marginBottom: 4 }}>输入时间戳或时间字符串（如：1699999999）</div>
                <Input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  placeholder="输入时间戳或时间字符串"
                />
              </div>
              <div style={{ marginBottom: 12 }}>
                <div style={{ marginBottom: 4 }}>选择语言</div>
                <Select value={codeLang} onChange={setCodeLang} style={{ width: '100%' }} options={languages} />
              </div>
              <Button type="primary" block onClick={handleGenerateCode}>🔧 生成代码</Button>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="💻 生成的代码（点击代码块可复制）">
              <TextArea
                value={generatedCode}
                readOnly
                rows={8}
                style={{ fontFamily: 'monospace', cursor: 'pointer' }}
                onClick={() => generatedCode && copyToClipboard(generatedCode)}
              />
            </Card>
          </Col>
        </Row>
      )}

      {/* 时间计算 */}
      {activeTab === 'calc' && (
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="⏱️ 时间差计算">
              <Space direction="vertical" style={{ width: '100%' }}>
                <div>
                  <span style={{ marginRight: 8 }}>从</span>
                  <Input
                    value={calcStart}
                    onChange={(e) => setCalcStart(e.target.value)}
                    placeholder="开始时间（如：2024-01-01 10:00:00）"
                    style={{ width: 'calc(100% - 30px)' }}
                  />
                </div>
                <div>
                  <span style={{ marginRight: 8 }}>到</span>
                  <Input
                    value={calcEnd}
                    onChange={(e) => setCalcEnd(e.target.value)}
                    placeholder="结束时间（如：2024-01-02 15:30:00）"
                    style={{ width: 'calc(100% - 30px)' }}
                  />
                </div>
                <Button type="primary" block onClick={handleCalcDiff}>📊 计算时间差</Button>
                <TextArea value={calcDiffResult} readOnly rows={3} placeholder="计算结果" />
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="➕➖ 时间加减运算">
              <Space direction="vertical" style={{ width: '100%' }}>
                <Input
                  value={calcBaseTime}
                  onChange={(e) => setCalcBaseTime(e.target.value)}
                  placeholder="基准时间（如：2024-01-01 10:00:00）"
                />
                <Space>
                  <Select value={calcOperation} onChange={setCalcOperation} style={{ width: 80 }}>
                    <Select.Option value="add">+ 增加</Select.Option>
                    <Select.Option value="subtract">- 减少</Select.Option>
                  </Select>
                  <InputNumber value={calcAmount} onChange={(v) => setCalcAmount(v || 0)} min={0} style={{ width: 80 }} />
                  <Select value={calcUnit} onChange={setCalcUnit} style={{ width: 80 }}>
                    <Select.Option value="seconds">秒</Select.Option>
                    <Select.Option value="minutes">分钟</Select.Option>
                    <Select.Option value="hours">小时</Select.Option>
                    <Select.Option value="days">天</Select.Option>
                  </Select>
                </Space>
                <Button type="primary" style={{ backgroundColor: '#52c41a' }} block onClick={handleCalcOp}>📊 计算结果</Button>
                <Input value={calcOpResult} readOnly placeholder="计算结果" />
              </Space>
            </Card>
          </Col>
        </Row>
      )}

      {/* 批量转换 */}
      {activeTab === 'batch' && (
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="📝 批量时间输入（每行一个）">
              <TextArea
                value={batchInput}
                onChange={(e) => setBatchInput(e.target.value)}
                placeholder={`输入多个时间值，每行一个：\n1699999999\n2024-01-15 10:30:45\nnow\ntoday\n2024/01/15`}
                rows={10}
                style={{ marginBottom: 8 }}
              />
              <Space>
                <Button type="primary" block onClick={handleBatchConvert}>📊 批量转换</Button>
                <Button onClick={() => { setBatchInput(''); setBatchResult(''); }}>清空</Button>
              </Space>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="📋 转换结果">
              <TextArea value={batchResult} readOnly rows={12} placeholder="转换结果将显示在这里" />
            </Card>
          </Col>
        </Row>
      )}

      {/* 时区专家 */}
      {activeTab === 'timezone' && (
        <Row gutter={16}>
          <Col span={12}>
            <Card size="small" title="🌍 时区转换设置">
              <div style={{ marginBottom: 12 }}>
                <div style={{ marginBottom: 4 }}>输入时间</div>
                <Input
                  value={tzInput}
                  onChange={(e) => setTzInput(e.target.value)}
                  placeholder="输入时间（如：2024-01-15 10:30:00）"
                />
              </div>
              <Row gutter={16} style={{ marginBottom: 12 }}>
                <Col span={12}>
                  <div style={{ marginBottom: 4 }}>从时区</div>
                  <Select value={fromTz} onChange={setFromTz} style={{ width: '100%' }} options={timezones.map(t => ({ value: t.value, label: t.label }))} />
                </Col>
                <Col span={12}>
                  <div style={{ marginBottom: 4 }}>到时区</div>
                  <Select value={toTz} onChange={setToTz} style={{ width: '100%' }} options={timezones.map(t => ({ value: t.value, label: t.label }))} />
                </Col>
              </Row>
              <Button type="primary" block onClick={handleTzConvert}>🔄 转换时区</Button>
            </Card>
          </Col>
          <Col span={12}>
            <Card size="small" title="🎯 转换结果">
              <Input value={tzResult} readOnly size="large" style={{ fontSize: 18 }} />
            </Card>
          </Col>
        </Row>
      )}

      {/* 随机唯一值 */}
      {activeTab === 'uuid' && (
        <>
          <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'flex-end' }}>
            <Button icon={<ReloadOutlined />} onClick={refreshAllUUIDs}>刷新全部</Button>
          </div>
          <Row gutter={[16, 16]}>
            {[
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
            ].map(item => (
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
      )}
    </Card>
  );
};

export default TimeTool;
