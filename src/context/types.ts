import type { EncoderType, OperationType } from '../modules/encoder-decoder/utils/encoders';
import type { PluginMetadata } from '../plugins/types';

// ==========================================
// Encoding Context Types
// ==========================================
export interface EncodingState {
  currentInput: string;
  currentOutput: string;
  currentType: EncoderType;
  currentOperation: OperationType;
}

export type EncodingAction =
  | { type: 'SET_CURRENT_INPUT'; payload: string }
  | { type: 'SET_CURRENT_OUTPUT'; payload: string }
  | { type: 'SET_CURRENT_TYPE'; payload: EncoderType }
  | { type: 'SET_CURRENT_OPERATION'; payload: OperationType };

export const initialEncodingState: EncodingState = {
  currentInput: '',
  currentOutput: '',
  currentType: 'base64',
  currentOperation: 'encode',
};

// ==========================================
// Error Context Types
// ==========================================
export interface ErrorInfo {
  message: string;
  type: string;
  stack?: string;
}

export interface ErrorState {
  error: ErrorInfo | null;
}

export type ErrorAction =
  | { type: 'SET_ERROR'; payload: ErrorInfo }
  | { type: 'CLEAR_ERROR' };

export const initialErrorState: ErrorState = {
  error: null,
};

// ==========================================
// Plugin Context Types
// ==========================================
export interface PluginState {
  loaded: boolean;
  list: PluginMetadata[];
}

export type PluginAction =
  | { type: 'SET_PLUGINS_LOADED'; payload: boolean }
  | { type: 'UPDATE_PLUGINS_LIST'; payload: PluginMetadata[] };

export const initialPluginState: PluginState = {
  loaded: false,
  list: [],
};
