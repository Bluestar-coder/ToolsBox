import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import AppProvider from './context/AppContext.tsx'
import { ThemeProvider } from './context/ThemeContext.tsx'
import { ErrorBoundaryClass, ErrorDisplay } from './components/ErrorBoundary.tsx'
import AntdThemeProvider from './components/AntdThemeProvider.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <AntdThemeProvider>
        <ErrorBoundaryClass>
          <AppProvider>
            <App />
            <ErrorDisplay />
          </AppProvider>
        </ErrorBoundaryClass>
      </AntdThemeProvider>
    </ThemeProvider>
  </StrictMode>,
)
