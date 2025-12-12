import React from 'react';
import { ConfigProvider, theme, App } from 'antd';
import { useTheme } from '../hooks/useTheme';

interface AntdThemeProviderProps {
  children: React.ReactNode;
}

const AntdThemeProvider: React.FC<AntdThemeProviderProps> = ({ children }) => {
  const { isDark } = useTheme();

  return (
    <ConfigProvider
      theme={{
        algorithm: isDark ? theme.darkAlgorithm : theme.defaultAlgorithm,
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 4,
        },
      }}
    >
      <App message={{ maxCount: 3, duration: 2 }}>
        {children}
      </App>
    </ConfigProvider>
  );
};

export default AntdThemeProvider;
