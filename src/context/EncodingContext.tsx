import React, { createContext, useReducer, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { EncoderType, OperationType } from '../modules/encoder-decoder/utils/encoders';
import { storage, STORAGE_KEYS } from '../utils/storage';
import { useMultiKeyPersistedState } from '../hooks/usePersistedState';

// 编码输入输出状态类型
interface EncodingState {
  currentInput: string;
  currentOutput: string;
  currentType: EncoderType;
  currentOperation: OperationType;
}

// Action类型
type EncodingAction =
  | { type: 'SET_CURRENT_INPUT'; payload: string }
  | { type: 'SET_CURRENT_OUTPUT'; payload: string }
  | { type: 'SET_CURRENT_TYPE'; payload: EncoderType }
  | { type: 'SET_CURRENT_OPERATION'; payload: OperationType };

// 初始状态
const initialState: EncodingState = {
  currentInput: '',
  currentOutput: '',
  currentType: 'base64',
  currentOperation: 'encode',
};

// 从localStorage加载初始状态
const loadInitialState = (): EncodingState => {
  const savedInput = storage.get<string>(STORAGE_KEYS.ENCODING_INPUT);
  const savedOutput = storage.get<string>(STORAGE_KEYS.ENCODING_OUTPUT);
  const savedType = storage.get<EncoderType>(STORAGE_KEYS.ENCODING_TYPE);
  const savedOperation = storage.get<OperationType>(STORAGE_KEYS.ENCODING_OPERATION);

  return {
    currentInput: savedInput ?? '',
    currentOutput: savedOutput ?? '',
    currentType: savedType ?? 'base64',
    currentOperation: savedOperation ?? 'encode',
  };
};

// 创建上下文
const EncodingContext = createContext<{
  state: EncodingState;
  dispatch: React.Dispatch<EncodingAction>;
  setInput: (input: string) => void;
  setOutput: (output: string) => void;
  setType: (type: EncoderType) => void;
  setOperation: (operation: OperationType) => void;
}>({
  state: initialState,
  dispatch: () => {},
  setInput: () => {},
  setOutput: () => {},
  setType: () => {},
  setOperation: () => {},
});

// Reducer函数
const encodingReducer = (state: EncodingState, action: EncodingAction): EncodingState => {
  switch (action.type) {
    case 'SET_CURRENT_INPUT':
      return { ...state, currentInput: action.payload };
    case 'SET_CURRENT_OUTPUT':
      return { ...state, currentOutput: action.payload };
    case 'SET_CURRENT_TYPE':
      return { ...state, currentType: action.payload };
    case 'SET_CURRENT_OPERATION':
      return { ...state, currentOperation: action.payload };
    default:
      return state;
  }
};

// 上下文提供者组件
interface EncodingProviderProps {
  children: ReactNode;
}

export const EncodingProvider: React.FC<EncodingProviderProps> = ({ children }) => {
  const [state, dispatch] = useReducer(encodingReducer, loadInitialState());

  // 统一持久化状态到localStorage（使用新的持久化Hook）
  useMultiKeyPersistedState({
    fields: {
      currentInput: STORAGE_KEYS.ENCODING_INPUT,
      currentOutput: STORAGE_KEYS.ENCODING_OUTPUT,
      currentType: STORAGE_KEYS.ENCODING_TYPE,
      currentOperation: STORAGE_KEYS.ENCODING_OPERATION,
    } as Record<string, string>,
    state: state as unknown as Record<string, unknown>,
  });

  // 辅助函数
  const setInput = useCallback((input: string) => {
    dispatch({ type: 'SET_CURRENT_INPUT', payload: input });
  }, []);

  const setOutput = useCallback((output: string) => {
    dispatch({ type: 'SET_CURRENT_OUTPUT', payload: output });
  }, []);

  const setType = useCallback((type: EncoderType) => {
    dispatch({ type: 'SET_CURRENT_TYPE', payload: type });
  }, []);

  const setOperation = useCallback((operation: OperationType) => {
    dispatch({ type: 'SET_CURRENT_OPERATION', payload: operation });
  }, []);

  const value = useMemo(
    () => ({
      state,
      dispatch,
      setInput,
      setOutput,
      setType,
      setOperation,
    }),
    [state, setInput, setOutput, setType, setOperation]
  );

  return <EncodingContext.Provider value={value}>{children}</EncodingContext.Provider>;
};

// 导出hook
export const useEncodingContext = () => {
  const context = React.useContext(EncodingContext);
  if (!context) {
    throw new Error('useEncodingContext must be used within EncodingProvider');
  }
  return context;
};

export { EncodingContext };
export default EncodingProvider;
