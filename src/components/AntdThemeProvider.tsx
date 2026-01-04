import React from 'react';
import { ConfigProvider, theme, App } from 'antd';
import { useTheme } from '../hooks/useTheme';

interface AntdThemeProviderProps {
  children: React.ReactNode;
}

const AntdThemeProvider: React.FC<AntdThemeProviderProps> = ({ children }) => {
  const { isDark } = useTheme();

  // Modern Developer Tool Theme Configuration
  const lightTheme = {
    algorithm: theme.defaultAlgorithm,
    token: {
      // Brand Colors
      colorPrimary: '#3B82F6',
      colorInfo: '#3B82F6',
      colorSuccess: '#10B981',
      colorWarning: '#F59E0B',
      colorError: '#EF4444',
      
      // Background Colors
      colorBgContainer: '#FFFFFF',
      colorBgElevated: '#FFFFFF',
      colorBgLayout: '#F8FAFC',
      colorBgSpotlight: '#F1F5F9',
      
      // Text Colors
      colorText: '#0F172A',
      colorTextSecondary: '#475569',
      colorTextTertiary: '#64748B',
      colorTextQuaternary: '#94A3B8',
      
      // Border
      colorBorder: '#E2E8F0',
      colorBorderSecondary: '#F1F5F9',
      
      // Typography
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontFamilyCode: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
      fontSize: 14,
      fontSizeHeading1: 32,
      fontSizeHeading2: 24,
      fontSizeHeading3: 20,
      fontSizeHeading4: 16,
      
      // Border Radius
      borderRadius: 10,
      borderRadiusLG: 16,
      borderRadiusSM: 6,
      borderRadiusXS: 4,
      
      // Shadows
      boxShadow: '0 1px 3px rgba(15, 23, 42, 0.08)',
      boxShadowSecondary: '0 4px 12px rgba(15, 23, 42, 0.12)',
      
      // Motion
      motionDurationFast: '150ms',
      motionDurationMid: '250ms',
      motionDurationSlow: '350ms',
      
      // Control
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
    },
    components: {
      Card: {
        headerBg: 'transparent',
        paddingLG: 24,
      },
      Button: {
        primaryShadow: '0 2px 4px rgba(59, 130, 246, 0.3)',
        fontWeight: 500,
      },
      Menu: {
        itemBorderRadius: 10,
        itemMarginInline: 8,
        itemPaddingInline: 16,
      },
      Tabs: {
        inkBarColor: '#3B82F6',
        itemSelectedColor: '#3B82F6',
        itemHoverColor: '#3B82F6',
      },
      Input: {
        activeBorderColor: '#3B82F6',
        hoverBorderColor: '#3B82F6',
        activeShadow: '0 0 0 3px rgba(59, 130, 246, 0.15)',
      },
      Select: {
        optionSelectedBg: 'rgba(59, 130, 246, 0.1)',
      },
      Message: {
        contentBg: '#FFFFFF',
      },
    },
  };

  const darkTheme = {
    algorithm: theme.darkAlgorithm,
    token: {
      // Brand Colors
      colorPrimary: '#60A5FA',
      colorInfo: '#60A5FA',
      colorSuccess: '#34D399',
      colorWarning: '#FBBF24',
      colorError: '#F87171',
      
      // Background Colors
      colorBgContainer: '#1E293B',
      colorBgElevated: '#1E293B',
      colorBgLayout: '#0F172A',
      colorBgSpotlight: '#334155',
      
      // Text Colors
      colorText: '#F1F5F9',
      colorTextSecondary: '#94A3B8',
      colorTextTertiary: '#64748B',
      colorTextQuaternary: '#475569',
      
      // Border
      colorBorder: '#334155',
      colorBorderSecondary: '#1E293B',
      
      // Typography
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
      fontFamilyCode: "'JetBrains Mono', 'SF Mono', 'Fira Code', monospace",
      fontSize: 14,
      fontSizeHeading1: 32,
      fontSizeHeading2: 24,
      fontSizeHeading3: 20,
      fontSizeHeading4: 16,
      
      // Border Radius
      borderRadius: 10,
      borderRadiusLG: 16,
      borderRadiusSM: 6,
      borderRadiusXS: 4,
      
      // Shadows
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.3)',
      boxShadowSecondary: '0 4px 12px rgba(0, 0, 0, 0.4)',
      
      // Motion
      motionDurationFast: '150ms',
      motionDurationMid: '250ms',
      motionDurationSlow: '350ms',
      
      // Control
      controlHeight: 36,
      controlHeightLG: 44,
      controlHeightSM: 28,
    },
    components: {
      Card: {
        headerBg: 'transparent',
        paddingLG: 24,
      },
      Button: {
        primaryShadow: '0 2px 4px rgba(96, 165, 250, 0.3)',
        fontWeight: 500,
      },
      Menu: {
        itemBorderRadius: 10,
        itemMarginInline: 8,
        itemPaddingInline: 16,
        darkItemBg: 'transparent',
        darkItemSelectedBg: 'rgba(96, 165, 250, 0.15)',
        darkItemHoverBg: 'rgba(96, 165, 250, 0.1)',
      },
      Tabs: {
        inkBarColor: '#60A5FA',
        itemSelectedColor: '#60A5FA',
        itemHoverColor: '#60A5FA',
      },
      Input: {
        activeBorderColor: '#60A5FA',
        hoverBorderColor: '#60A5FA',
        activeShadow: '0 0 0 3px rgba(96, 165, 250, 0.2)',
      },
      Select: {
        optionSelectedBg: 'rgba(96, 165, 250, 0.15)',
      },
      Message: {
        contentBg: '#1E293B',
      },
    },
  };

  return (
    <ConfigProvider theme={isDark ? darkTheme : lightTheme}>
      <App message={{ maxCount: 3, duration: 2 }}>
        {children}
      </App>
    </ConfigProvider>
  );
};

export default AntdThemeProvider;
