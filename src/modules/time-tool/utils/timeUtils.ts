// 时间工具函数

// 时间格式类型
export type TimeFormat = 'YYYY-MM-DD HH:MI:SS' | 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD' | 'HH:MI:SS' | 'timestamp' | 'timestamp_ms';

// 时间处理结果类型
export interface TimeResult {
  success: boolean;
  result: string;
  error?: string;
}

/**
 * 获取当前Unix时间戳（秒级）
 * @returns 秒级时间戳
 */
export const getUnixTimestamp = (): number => {
  return Math.floor(Date.now() / 1000);
};

/**
 * 获取当前Unix时间戳（毫秒级）
 * @returns 毫秒级时间戳
 */
export const getUnixTimestampMs = (): number => {
  return Date.now();
};

/**
 * 格式化日期对象为指定格式
 * @param date 日期对象
 * @param format 格式化字符串
 * @returns 格式化后的时间字符串
 */
export const formatDate = (date: Date, format: string): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  // 使用占位符避免重复替换问题
  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('MI', minutes)  // 使用 MI 表示分钟，避免与 MM 冲突
    .replace('SS', seconds);
};

/**
 * 解析时间字符串为Date对象
 * @param timeStr 时间字符串
 * @param format 时间格式
 * @returns Date对象或null
 */
export const parseDate = (timeStr: string, format: string): Date | null => {
  try {
    // 简单的时间解析实现，支持常用格式
    if (format === 'YYYY-MM-DD HH:MI:SS') {
      const parts = timeStr.split(/[- :]/);
      return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]), Number(parts[3]), Number(parts[4]), Number(parts[5]));
    } else if (format === 'MM/DD/YYYY') {
      const parts = timeStr.split('/');
      return new Date(Number(parts[2]), Number(parts[0]) - 1, Number(parts[1]));
    } else if (format === 'DD/MM/YYYY') {
      const parts = timeStr.split('/');
      return new Date(Number(parts[2]), Number(parts[1]) - 1, Number(parts[0]));
    } else if (format === 'YYYY-MM-DD') {
      return new Date(timeStr);
    } else if (format === 'timestamp') {
      return new Date(Number(timeStr) * 1000);
    } else if (format === 'timestamp_ms') {
      return new Date(Number(timeStr));
    }
    return null;
  } catch {
    return null;
  }
};

/**
 * 时间格式转换
 * @param input 输入时间字符串
 * @param fromFormat 输入格式
 * @param toFormat 输出格式
 * @returns 转换结果
 */
export const convertTimeFormat = (input: string, fromFormat: string, toFormat: string): TimeResult => {
  try {
    // 处理时间戳情况
    if (fromFormat === 'timestamp') {
      const date = new Date(Number(input) * 1000);
      if (toFormat === 'timestamp_ms') {
        return { success: true, result: date.getTime().toString() };
      }
      return { success: true, result: formatDate(date, toFormat) };
    }

    if (fromFormat === 'timestamp_ms') {
      const date = new Date(Number(input));
      if (toFormat === 'timestamp') {
        return { success: true, result: Math.floor(date.getTime() / 1000).toString() };
      }
      return { success: true, result: formatDate(date, toFormat) };
    }

    // 解析输入时间
    const date = parseDate(input, fromFormat);
    if (!date) {
      return { success: false, result: '', error: '无法解析输入时间格式' };
    }

    // 转换为目标格式
    if (toFormat === 'timestamp') {
      return { success: true, result: Math.floor(date.getTime() / 1000).toString() };
    }

    if (toFormat === 'timestamp_ms') {
      return { success: true, result: date.getTime().toString() };
    }

    const result = formatDate(date, toFormat);
    return { success: true, result };
  } catch (error) {
    return { success: false, result: '', error: error instanceof Error ? error.message : '时间格式转换失败' };
  }
};

/**
 * 转换为UTC时间
 * @param date 本地日期对象
 * @returns UTC日期对象
 */
export const toUTC = (date: Date): Date => {
  return new Date(
    date.getUTCFullYear(),
    date.getUTCMonth(),
    date.getUTCDate(),
    date.getUTCHours(),
    date.getUTCMinutes(),
    date.getUTCSeconds()
  );
};

/**
 * 转换为本地时间
 * @param utcDate UTC日期对象
 * @returns 本地日期对象
 */
export const toLocalTime = (utcDate: Date): Date => {
  // 直接返回原始日期，因为 Date 对象本身就是本地时间
  return new Date(utcDate.getTime());
};

/**
 * 获取当前时间
 * @param format 时间格式
 * @returns 当前时间字符串
 */
export const getCurrentTime = (format: string): string => {
  return formatDate(new Date(), format);
};

/**
 * 计算两个时间的差值
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @returns 时间差值（毫秒）
 */
export const getTimeDifference = (startTime: Date, endTime: Date): number => {
  return endTime.getTime() - startTime.getTime();
};

/**
 * 时间加减计算
 * @param date 基准日期
 * @param milliseconds 毫秒数（正数为加，负数为减）
 * @returns 计算后的日期对象
 */
export const addTime = (date: Date, milliseconds: number): Date => {
  return new Date(date.getTime() + milliseconds);
};
