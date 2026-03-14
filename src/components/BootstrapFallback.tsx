import React from 'react';

const BootstrapFallback: React.FC = () => (
  <div
    style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 12,
      color: '#294257',
      background: 'linear-gradient(180deg, #f5f7fb, #eef3f9)',
    }}
  >
    <div
      aria-hidden="true"
      style={{
        width: 28,
        height: 28,
        borderRadius: '999px',
        border: '2px solid rgba(14, 165, 233, 0.18)',
        borderTopColor: '#0ea5e9',
        animation: 'spinFallback 1s linear infinite',
      }}
    />
    <span style={{ fontSize: 14, fontWeight: 600, letterSpacing: '0.04em' }}>Loading ToolsBox…</span>
    <span style={{ fontSize: 12, opacity: 0.72 }}>If this screen persists, startup failed before AppShell mounted.</span>
  </div>
);

export default BootstrapFallback;
