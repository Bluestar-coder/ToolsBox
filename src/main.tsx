import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { ConfigProvider } from 'antd'
import './index.css'
import App from './App.tsx'
import AppProvider from './context/AppContext.tsx'
import { ErrorBoundaryClass, ErrorDisplay } from './components/ErrorBoundary.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: '#1890ff',
          borderRadius: 4,
        },
      }}
    >
      <ErrorBoundaryClass>
        <AppProvider>
          <App />
          <ErrorDisplay />
        </AppProvider>
      </ErrorBoundaryClass>
    </ConfigProvider>
  </StrictMode>,
)
