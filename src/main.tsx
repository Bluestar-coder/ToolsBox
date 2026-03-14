import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/modules.css'
import './i18n'
import BootstrapFallback from './components/BootstrapFallback'
import { installRuntimeWarningFilter } from './utils/runtime-warnings'

const AppShell = lazy(() => import('./AppShell'))

installRuntimeWarningFilter()

if (import.meta.env.PROD) {
  void import('./utils/sentry').then(({ initSentry }) => {
    initSentry()
  })
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={<BootstrapFallback />}>
      <AppShell />
    </Suspense>
  </StrictMode>,
)
