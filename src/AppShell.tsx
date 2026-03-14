import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorProvider } from './context/ErrorContext';
import { PluginProvider } from './context/PluginContext';
import { ErrorBoundaryClass } from './components/ErrorBoundary';

const AppShell: React.FC = () => {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ErrorBoundaryClass>
          <PluginProvider>
            <ErrorProvider>
              <App />
            </ErrorProvider>
          </PluginProvider>
        </ErrorBoundaryClass>
      </ThemeProvider>
    </BrowserRouter>
  );
};

export default AppShell;
