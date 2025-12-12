// 完整时区列表
export const timezones = [
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
export const languages = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'go', label: 'Go' },
  { value: 'php', label: 'PHP' },
  { value: 'csharp', label: 'C#' },
];

// 标签页配置
export const tabItems = [
  { key: 'smart', label: '🔍 智能解析' },
  { key: 'code', label: '💻 代码生成' },
  { key: 'calc', label: '🧮 时间计算' },
  { key: 'batch', label: '📋 批量转换' },
  { key: 'timezone', label: '🌍 时区专家' },
  { key: 'uuid', label: '🔑 随机唯一值' },
];
