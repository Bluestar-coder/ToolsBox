import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import './styles/modules.css'
import './i18n'
import App from './App.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { ErrorProvider } from './context/ErrorContext.tsx'
import { PluginProvider } from './context/PluginContext.tsx'
import { EncodingProvider } from './context/EncodingContext.tsx'
import { ErrorBoundaryClass } from './components/ErrorBoundary.tsx'
import AntdThemeProvider from './components/AntdThemeProvider.tsx'
import ErrorDisplay from './components/ErrorDisplayNew.tsx'
import { initSentry } from './utils/sentry'

// 初始化Sentry错误监控
initSentry()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <ThemeProvider>
        <AntdThemeProvider>
          <ErrorBoundaryClass>
            <EncodingProvider>
              <PluginProvider>
                <ErrorProvider>
                  <App />
                  <ErrorDisplay />
                </ErrorProvider>
              </PluginProvider>
            </EncodingProvider>
          </ErrorBoundaryClass>
        </AntdThemeProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
)
