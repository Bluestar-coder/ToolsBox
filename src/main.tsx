import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/modules.css'
import { i18nReady } from './i18n'
import BootstrapFallback from './components/BootstrapFallback'
import { installRuntimeWarningFilter } from './utils/runtime-warnings'

const AppShell = lazy(() => import('./AppShell'))
const sentryEnabled = import.meta.env.PROD && !!import.meta.env.VITE_SENTRY_DSN

installRuntimeWarningFilter()

async function bootstrap() {
  await i18nReady

  if (sentryEnabled) {
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
}

void bootstrap()
