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
      colorPrimary: '#0ea5e9',
      colorInfo: '#0ea5e9',
      colorSuccess: '#14b8a6',
      colorWarning: '#f59e0b',
      colorError: '#ef4444',
      
      // Background Colors
      colorBgContainer: '#f8fcff',
      colorBgElevated: '#ffffff',
      colorBgLayout: '#edf4fb',
      colorBgSpotlight: '#e2eef8',
      
      // Text Colors
      colorText: '#0b2033',
      colorTextSecondary: '#3e5b74',
      colorTextTertiary: '#60738a',
      colorTextQuaternary: '#8396ad',
      
      // Border
      colorBorder: '#c4d7e6',
      colorBorderSecondary: '#e2edf7',
      
      // Typography
      fontFamily: "'Manrope', 'IBM Plex Sans', 'Segoe UI', sans-serif",
      fontFamilyCode: "'JetBrains Mono', 'IBM Plex Mono', 'SF Mono', monospace",
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
      boxShadow: '0 12px 28px rgba(6, 34, 58, 0.12)',
      boxShadowSecondary: '0 18px 36px rgba(6, 34, 58, 0.14)',
      
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
        primaryShadow: '0 6px 16px rgba(14, 165, 233, 0.35)',
        fontWeight: 500,
      },
      Menu: {
        itemBorderRadius: 10,
        itemMarginInline: 8,
        itemPaddingInline: 16,
      },
      Tabs: {
        inkBarColor: '#0ea5e9',
        itemSelectedColor: '#0ea5e9',
        itemHoverColor: '#0ea5e9',
      },
      Input: {
        activeBorderColor: '#0ea5e9',
        hoverBorderColor: '#0ea5e9',
        activeShadow: '0 0 0 3px rgba(14, 165, 233, 0.2)',
      },
      Select: {
        optionSelectedBg: 'rgba(14, 165, 233, 0.12)',
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
      colorPrimary: '#22d3ee',
      colorInfo: '#22d3ee',
      colorSuccess: '#2dd4bf',
      colorWarning: '#fbbf24',
      colorError: '#fb7185',
      
      // Background Colors
      colorBgContainer: '#0f2031',
      colorBgElevated: '#13263a',
      colorBgLayout: '#070f1d',
      colorBgSpotlight: '#1d334b',
      
      // Text Colors
      colorText: '#eaf4ff',
      colorTextSecondary: '#a8bfd5',
      colorTextTertiary: '#7e9db6',
      colorTextQuaternary: '#6584a0',
      
      // Border
      colorBorder: '#2a4662',
      colorBorderSecondary: '#17314a',
      
      // Typography
      fontFamily: "'Manrope', 'IBM Plex Sans', 'Segoe UI', sans-serif",
      fontFamilyCode: "'JetBrains Mono', 'IBM Plex Mono', 'SF Mono', monospace",
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
      boxShadow: '0 14px 30px rgba(0, 7, 16, 0.6)',
      boxShadowSecondary: '0 20px 46px rgba(0, 7, 16, 0.65)',
      
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
        primaryShadow: '0 8px 18px rgba(34, 211, 238, 0.35)',
        fontWeight: 500,
      },
      Menu: {
        itemBorderRadius: 10,
        itemMarginInline: 8,
        itemPaddingInline: 16,
        darkItemBg: 'transparent',
        darkItemSelectedBg: 'rgba(34, 211, 238, 0.18)',
        darkItemHoverBg: 'rgba(34, 211, 238, 0.12)',
      },
      Tabs: {
        inkBarColor: '#22d3ee',
        itemSelectedColor: '#22d3ee',
        itemHoverColor: '#22d3ee',
      },
      Input: {
        activeBorderColor: '#22d3ee',
        hoverBorderColor: '#22d3ee',
        activeShadow: '0 0 0 3px rgba(34, 211, 238, 0.2)',
      },
      Select: {
        optionSelectedBg: 'rgba(34, 211, 238, 0.2)',
      },
      Message: {
        contentBg: '#0f2031',
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
