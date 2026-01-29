import { useContext } from 'react';
import { PluginContext } from '../context/definitions';

export const usePluginContext = () => {
  const context = useContext(PluginContext);
  if (!context) {
    throw new Error('usePluginContext must be used within PluginProvider');
  }
  return context;
};
