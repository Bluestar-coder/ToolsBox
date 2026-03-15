import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/modules.css'
import { i18nReady } from './i18n'
import AppShell from './AppShell'
import { installRuntimeWarningFilter } from './utils/runtime-warnings'

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
      <AppShell />
    </StrictMode>,
  )
}

void bootstrap()
