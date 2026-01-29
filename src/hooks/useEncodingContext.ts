import { useContext } from 'react';
import { EncodingContext } from '../context/definitions';

export const useEncodingContext = () => {
  const context = useContext(EncodingContext);
  if (!context) {
    throw new Error('useEncodingContext must be used within EncodingProvider');
  }
  return context;
};
