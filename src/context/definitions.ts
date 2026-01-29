import { createContext } from 'react';
import type { ThemeMode, ResolvedTheme } from '../utils/theme-utils';
import type { PluginConfig, PluginLoadResult } from '../plugins/types';
import { pluginManager } from '../plugins/PluginManager';
import type { EncoderType, OperationType } from '../modules/encoder-decoder/utils/encoders';
import {
  type EncodingState,
  type EncodingAction,
  initialEncodingState,
  type ErrorState,
  type ErrorAction,
  initialErrorState,
  type PluginState,
  type PluginAction,
  initialPluginState
} from './types';

// Theme Context Definition
export interface ThemeContextType {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  isDark: boolean;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
}
export const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

// Encoding Context Definition
export const EncodingContext = createContext<{
  state: EncodingState;
  dispatch: React.Dispatch<EncodingAction>;
  setInput: (input: string) => void;
  setOutput: (output: string) => void;
  setType: (type: EncoderType) => void;
  setOperation: (operation: OperationType) => void;
}>({
  state: initialEncodingState,
  dispatch: () => {},
  setInput: () => {},
  setOutput: () => {},
  setType: () => {},
  setOperation: () => {},
});

// Error Context Definition
export const ErrorContext = createContext<{
  state: ErrorState;
  dispatch: React.Dispatch<ErrorAction>;
  setError: (message: string, type: string, stack?: string) => void;
  clearError: () => void;
}>({
  state: initialErrorState,
  dispatch: () => {},
  setError: () => {},
  clearError: () => {},
});

// Plugin Context Definition
export const PluginContext = createContext<{
  state: PluginState;
  dispatch: React.Dispatch<PluginAction>;
  loadPlugin: (pluginConfig: PluginConfig) => Promise<PluginLoadResult>;
  enablePlugin: (pluginId: string) => Promise<boolean>;
  disablePlugin: (pluginId: string) => Promise<boolean>;
  unloadPlugin: (pluginId: string) => Promise<boolean>;
  pluginManager: typeof pluginManager;
}>({
  state: initialPluginState,
  dispatch: () => {},
  loadPlugin: async () => ({ success: false, error: '插件管理器未初始化' }),
  enablePlugin: async () => false,
  disablePlugin: async () => false,
  unloadPlugin: async () => false,
  pluginManager: pluginManager,
});
