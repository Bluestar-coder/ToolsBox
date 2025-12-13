// 常用正则表达式模板
export const regexTemplates = [
  { name: '邮箱', pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$', description: '匹配电子邮箱地址' },
  { name: '手机号(中国)', pattern: '^1[3-9]\\d{9}$', description: '匹配中国大陆手机号' },
  { name: '身份证号', pattern: '^[1-9]\\d{5}(18|19|20)\\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\\d|3[01])\\d{3}[\\dXx]$', description: '匹配18位身份证号' },
  { name: 'URL', pattern: '^https?:\\/\\/[\\w\\-]+(\\.[\\w\\-]+)+[/#?]?.*$', description: '匹配HTTP/HTTPS URL' },
  { name: 'IPv4地址', pattern: '^((25[0-5]|2[0-4]\\d|[01]?\\d\\d?)\\.){3}(25[0-5]|2[0-4]\\d|[01]?\\d\\d?)$', description: '匹配IPv4地址' },
  { name: 'IPv6地址', pattern: '^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$', description: '匹配完整IPv6地址' },
  { name: '日期(YYYY-MM-DD)', pattern: '^\\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\\d|3[01])$', description: '匹配日期格式' },
  { name: '时间(HH:MM:SS)', pattern: '^([01]\\d|2[0-3]):[0-5]\\d:[0-5]\\d$', description: '匹配24小时制时间' },
  { name: '中文字符', pattern: '[\\u4e00-\\u9fa5]+', description: '匹配中文字符' },
  { name: '数字', pattern: '^-?\\d+(\\.\\d+)?$', description: '匹配整数或小数' },
  { name: '正整数', pattern: '^[1-9]\\d*$', description: '匹配正整数' },
  { name: '用户名', pattern: '^[a-zA-Z][a-zA-Z0-9_]{2,15}$', description: '字母开头，3-16位字母数字下划线' },
  { name: '强密码', pattern: '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$', description: '至少8位，包含大小写字母、数字和特殊字符' },
  { name: 'HTML标签', pattern: '<[^>]+>', description: '匹配HTML标签' },
  { name: '十六进制颜色', pattern: '^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$', description: '匹配十六进制颜色值' },
  { name: 'MAC地址', pattern: '^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$', description: '匹配MAC地址' },
  { name: '邮政编码(中国)', pattern: '^[1-9]\\d{5}$', description: '匹配中国邮政编码' },
  { name: '车牌号(中国)', pattern: '^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4,5}[A-HJ-NP-Z0-9挂学警港澳]$', description: '匹配中国车牌号' },
];

// 正则标志选项
export const regexFlags = [
  { key: 'g', label: 'global (g)', description: '全局匹配' },
  { key: 'i', label: 'ignoreCase (i)', description: '忽略大小写' },
  { key: 'm', label: 'multiline (m)', description: '多行模式' },
  { key: 's', label: 'dotAll (s)', description: '点号匹配换行' },
  { key: 'u', label: 'unicode (u)', description: 'Unicode模式' },
];
