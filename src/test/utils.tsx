/* eslint-disable react-refresh/only-export-components */
import { render as rtlRender, type RenderOptions, act } from '@testing-library/react';
import type { ReactElement } from 'react';
import { ConfigProvider, theme } from 'antd';
import zhCN from 'antd/locale/zh_CN';
import { ThemeProvider } from '../context/ThemeContext';
import { EncodingProvider } from '../context/EncodingContext';
import { PluginProvider } from '../context/PluginContext';
import { ErrorProvider } from '../context/ErrorContext';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';

void i18n.changeLanguage('zh-CN');

/**
 * 全局Provider包装组件
 * 包含路由、主题、国际化等全局上下文
 */
const AllProviders = ({ children }: { children: React.ReactNode }) => {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <EncodingProvider>
          <PluginProvider>
            <ErrorProvider>
              <ConfigProvider
                locale={zhCN}
                theme={{
                  algorithm: theme.defaultAlgorithm,
                }}
              >
                {children}
              </ConfigProvider>
            </ErrorProvider>
          </PluginProvider>
        </EncodingProvider>
      </ThemeProvider>
    </I18nextProvider>
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
  options?: Omit<RenderOptions, 'wrapper'> & { wrapper?: React.ComponentType<{ children: React.ReactNode }> }
) {
  const { wrapper: UserWrapper, ...rest } = options ?? {};
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <AllProviders>
      {UserWrapper ? <UserWrapper>{children}</UserWrapper> : children}
    </AllProviders>
  );
  let result: ReturnType<typeof rtlRender> | undefined;
  act(() => {
    result = rtlRender(ui, { wrapper: Wrapper, ...rest });
  });
  return result as ReturnType<typeof rtlRender>;
}

export function render(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  return renderWithProviders(ui, options);
}

// 重新导出常用函数
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';
