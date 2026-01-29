import { useContext } from 'react';
import { ErrorContext } from '../context/definitions';

export const useErrorContext = () => {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error('useErrorContext must be used within ErrorProvider');
  }
  return context;
};
