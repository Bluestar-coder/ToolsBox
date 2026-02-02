// 格式化日期时间
export const formatDateTime = (d: Date): string => {
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
};

// 智能解析时间
export const parseSmartTime = (input: string): Date | null => {
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

// 计算指定时区在某个时间点的偏移（小时）
export const getTimeZoneOffsetHours = (timeZone: string, date: Date): number => {
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone,
      hour12: false,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const parts = formatter.formatToParts(date);
    const values: Record<string, string> = {};
    for (const part of parts) {
      if (part.type !== 'literal') {
        values[part.type] = part.value;
      }
    }
    const asUtc = new Date(
      `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}Z`
    );
    return (asUtc.getTime() - date.getTime()) / 3600000;
  } catch {
    return 0;
  }
};

// 将“时区内的本地时间”转换为 UTC 毫秒
export const zonedTimeToUtcMillis = (localTime: Date, timeZone: string): number => {
  const year = localTime.getFullYear();
  const month = localTime.getMonth();
  const day = localTime.getDate();
  const hour = localTime.getHours();
  const minute = localTime.getMinutes();
  const second = localTime.getSeconds();

  const utcGuess = Date.UTC(year, month, day, hour, minute, second);
  const offset1 = getTimeZoneOffsetHours(timeZone, new Date(utcGuess));
  const utc1 = utcGuess - offset1 * 3600000;
  const offset2 = getTimeZoneOffsetHours(timeZone, new Date(utc1));
  if (offset1 !== offset2) {
    return utcGuess - offset2 * 3600000;
  }
  return utc1;
};

// 生成代码
export const generateCode = (timestamp: number, lang: string): string => {
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

// 复制到剪贴板
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
