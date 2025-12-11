import { useContext } from 'react';
import { AppContext } from '../context/AppContext';

/**
 * 自定义Hook，用于访问应用上下文
 * @returns 应用上下文
 */
export const useAppContext = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};