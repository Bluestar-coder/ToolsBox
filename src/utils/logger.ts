/**
 * 统一日志工具
 * 在开发环境输出日志，生产环境只输出错误
 */

const isDevelopment = import.meta.env.DEV;

type LogLevel = 'log' | 'warn' | 'error' | 'debug';

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  message: string;
  data?: unknown[];
}

class Logger {
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private formatMessage(level: LogLevel, args: unknown[]): string {
    const firstArg = args[0];
    if (typeof firstArg === 'string') {
      return firstArg;
    }
    return JSON.stringify(firstArg);
  }

  private createLogEntry(level: LogLevel, args: unknown[]): LogEntry {
    return {
      level,
      timestamp: new Date().toISOString(),
      message: this.formatMessage(level, args),
      data: args.length > 1 ? (args.slice(1) as unknown[]) : undefined,
    };
  }

  private addLog(entry: LogEntry) {
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }
  }

  log(...args: unknown[]) {
    if (isDevelopment) {
      const entry = this.createLogEntry('log', args);
      this.addLog(entry);
      console.log('[DEBUG]', ...args);
    }
  }

  warn(...args: unknown[]) {
    if (isDevelopment) {
      const entry = this.createLogEntry('warn', args);
      this.addLog(entry);
      console.warn('[WARN]', ...args);
    }
  }

  error(...args: unknown[]) {
    const entry = this.createLogEntry('error', args);
    this.addLog(entry);
    console.error('[ERROR]', ...args);

    // TODO: 在生产环境发送到错误追踪服务（如Sentry）
    // if (!isDevelopment) {
    //   this.sendToErrorTracking(entry);
    // }
  }

  debug(...args: unknown[]) {
    if (isDevelopment) {
      const entry = this.createLogEntry('debug', args);
      this.addLog(entry);
      console.debug('[DEBUG]', ...args);
    }
  }

  /**
   * 获取最近的日志
   */
  getLogs(count?: number): LogEntry[] {
    if (count) {
      return this.logs.slice(-count);
    }
    return [...this.logs];
  }

  /**
   * 清空日志
   */
  clearLogs() {
    this.logs = [];
  }

  /**
   * 导出日志为JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }
}

// 导出单例
export const logger = new Logger();

// 便捷导出
export const log = (...args: unknown[]) => logger.log(...args);
export const warn = (...args: unknown[]) => logger.warn(...args);
export const error = (...args: unknown[]) => logger.error(...args);
export const debug = (...args: unknown[]) => logger.debug(...args);

export default logger;
