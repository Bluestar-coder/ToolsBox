import { render, type RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { ThemeProvider } from '../context/ThemeContext';
import { AppProvider } from '../context/AppContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

/**
 * 全局Provider包装组件
 * 包含路由、主题、国际化等全局上下文
 */
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <BrowserRouter>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider>
          <AppProvider>
            <ConfigProvider
              locale={zhCN}
              theme={{
                algorithm: theme.defaultAlgorithm,
              }}
            >
              {children}
            </ConfigProvider>
          </AppProvider>
        </ThemeProvider>
      </I18nextProvider>
    </BrowserRouter>
  );
};

/**
 * 自定义render函数，自动包装所有必要的Provider
 * @param ui 要渲染的React元素
 * @param options 渲染选项
 * @returns 渲染结果
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

// 重新导出常用函数
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
