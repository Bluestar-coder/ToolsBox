import type { PortEntry } from './types';

/**
 * 常用端口数据库
 */
const PORT_DATABASE: PortEntry[] = [
  // 系统端口 (0-1023)
  { port: 20, protocol: 'TCP', service: 'FTP-DATA', description: 'FTP 数据传输', riskLevel: 'medium' },
  { port: 21, protocol: 'TCP', service: 'FTP', description: 'FTP 控制连接', riskLevel: 'high' },
  { port: 22, protocol: 'TCP', service: 'SSH', description: 'SSH 远程登录', riskLevel: 'high' },
  { port: 23, protocol: 'TCP', service: 'Telnet', description: 'Telnet 远程登录', riskLevel: 'high' },
  { port: 25, protocol: 'TCP', service: 'SMTP', description: '简单邮件传输协议', riskLevel: 'medium' },
  { port: 53, protocol: 'TCP/UDP', service: 'DNS', description: '域名系统', riskLevel: 'high' },
  { port: 67, protocol: 'UDP', service: 'DHCP-Server', description: 'DHCP 服务器', riskLevel: 'low' },
  { port: 68, protocol: 'UDP', service: 'DHCP-Client', description: 'DHCP 客户端', riskLevel: 'low' },
  { port: 69, protocol: 'UDP', service: 'TFTP', description: '简单文件传输协议', riskLevel: 'medium' },
  { port: 80, protocol: 'TCP', service: 'HTTP', description: '超文本传输协议', riskLevel: 'high' },
  { port: 110, protocol: 'TCP', service: 'POP3', description: '邮局协议版本3', riskLevel: 'medium' },
  { port: 111, protocol: 'TCP/UDP', service: 'RPC', description: '远程过程调用', riskLevel: 'high' },
  { port: 123, protocol: 'UDP', service: 'NTP', description: '网络时间协议', riskLevel: 'low' },
  { port: 135, protocol: 'TCP', service: 'MS-RPC', description: 'Microsoft RPC', riskLevel: 'high' },
  { port: 137, protocol: 'UDP', service: 'NetBIOS-NS', description: 'NetBIOS 名称服务', riskLevel: 'medium' },
  { port: 138, protocol: 'UDP', service: 'NetBIOS-DGM', description: 'NetBIOS 数据报服务', riskLevel: 'medium' },
  { port: 139, protocol: 'TCP', service: 'NetBIOS-SSN', description: 'NetBIOS 会话服务', riskLevel: 'high' },
  { port: 143, protocol: 'TCP', service: 'IMAP', description: 'Internet 消息访问协议', riskLevel: 'medium' },
  { port: 161, protocol: 'UDP', service: 'SNMP', description: '简单网络管理协议', riskLevel: 'high' },
  { port: 162, protocol: 'UDP', service: 'SNMP-Trap', description: 'SNMP 陷阱', riskLevel: 'medium' },
  { port: 389, protocol: 'TCP', service: 'LDAP', description: '轻量级目录访问协议', riskLevel: 'high' },
  { port: 443, protocol: 'TCP', service: 'HTTPS', description: 'HTTP 安全传输', riskLevel: 'high' },
  { port: 445, protocol: 'TCP', service: 'SMB', description: 'Server Message Block', riskLevel: 'high' },
  { port: 465, protocol: 'TCP', service: 'SMTPS', description: 'SMTP 安全传输', riskLevel: 'medium' },
  { port: 514, protocol: 'UDP', service: 'Syslog', description: '系统日志', riskLevel: 'low' },
  { port: 515, protocol: 'TCP', service: 'LPD', description: '行式打印机守护进程', riskLevel: 'low' },
  { port: 587, protocol: 'TCP', service: 'SMTP-Submission', description: 'SMTP 邮件提交', riskLevel: 'medium' },
  { port: 636, protocol: 'TCP', service: 'LDAPS', description: 'LDAP 安全传输', riskLevel: 'medium' },
  { port: 873, protocol: 'TCP', service: 'Rsync', description: '远程同步', riskLevel: 'medium' },
  { port: 993, protocol: 'TCP', service: 'IMAPS', description: 'IMAP 安全传输', riskLevel: 'medium' },
  { port: 995, protocol: 'TCP', service: 'POP3S', description: 'POP3 安全传输', riskLevel: 'medium' },
  { port: 1080, protocol: 'TCP', service: 'SOCKS', description: 'SOCKS 代理', riskLevel: 'high' },
  { port: 1433, protocol: 'TCP', service: 'MS-SQL', description: 'Microsoft SQL Server', riskLevel: 'high' },
  { port: 1521, protocol: 'TCP', service: 'Oracle', description: 'Oracle 数据库', riskLevel: 'high' },
  { port: 2049, protocol: 'TCP/UDP', service: 'NFS', description: '网络文件系统', riskLevel: 'high' },
  { port: 3306, protocol: 'TCP', service: 'MySQL', description: 'MySQL 数据库', riskLevel: 'high' },
  { port: 3389, protocol: 'TCP', service: 'RDP', description: '远程桌面协议', riskLevel: 'high' },
  { port: 5432, protocol: 'TCP', service: 'PostgreSQL', description: 'PostgreSQL 数据库', riskLevel: 'high' },
  { port: 5900, protocol: 'TCP', service: 'VNC', description: '虚拟网络计算', riskLevel: 'high' },
  { port: 6379, protocol: 'TCP', service: 'Redis', description: 'Redis 数据库', riskLevel: 'high' },
  { port: 8080, protocol: 'TCP', service: 'HTTP-Proxy', description: 'HTTP 代理', riskLevel: 'medium' },
  { port: 8443, protocol: 'TCP', service: 'HTTPS-Alt', description: 'HTTPS 备用端口', riskLevel: 'medium' },
  { port: 9200, protocol: 'TCP', service: 'Elasticsearch', description: 'Elasticsearch HTTP', riskLevel: 'high' },
  { port: 27017, protocol: 'TCP', service: 'MongoDB', description: 'MongoDB 数据库', riskLevel: 'high' },
];

export function searchByPort(port: number): PortEntry[] {
  return PORT_DATABASE.filter((entry) => entry.port === port);
}

export function searchByService(keyword: string): PortEntry[] {
  const lowerKeyword = keyword.toLowerCase();
  return PORT_DATABASE.filter(
    (entry) =>
      entry.service.toLowerCase().includes(lowerKeyword) ||
      entry.description.toLowerCase().includes(lowerKeyword)
  );
}

export function filterByPortRange(start: number, end: number): PortEntry[] {
  return PORT_DATABASE.filter((entry) => entry.port >= start && entry.port <= end);
}

export function getHighFrequencyPorts(): PortEntry[] {
  const highFrequencyPortNumbers = [
    20, 21, 22, 23, 25, 53, 80, 110, 143, 443, 445, 3306, 3389, 5432, 6379, 8080, 8443, 9200, 27017,
  ];
  return PORT_DATABASE.filter((entry) => highFrequencyPortNumbers.includes(entry.port));
}
