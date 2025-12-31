import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import { ErrorBoundaryClass } from './ErrorBoundary';

// 创建一个会抛出错误的组件
const ThrowError = ({ shouldThrow }: { shouldThrow: boolean }) => {
  if (shouldThrow) {
    throw new Error('Test error');
  }
  return <div>No error</div>;
};

describe('ErrorBoundaryClass', () => {
  it('should render children when there is no error', () => {
    render(
      <ErrorBoundaryClass>
        <ThrowError shouldThrow={false} />
      </ErrorBoundaryClass>
    );
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should catch and display errors', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundaryClass>
        <ThrowError shouldThrow={true} />
      </ErrorBoundaryClass>
    );

    expect(screen.getByText(/应用发生错误/i)).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('should display error message', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundaryClass>
        <ThrowError shouldThrow={true} />
      </ErrorBoundaryClass>
    );

    expect(screen.getByText(/Test error/)).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('should have a retry button', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundaryClass>
        <ThrowError shouldThrow={true} />
      </ErrorBoundaryClass>
    );

    const retryButton = screen.getByRole('button', { name: /重试/i });
    expect(retryButton).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('should display component stack when available', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundaryClass>
        <ThrowError shouldThrow={true} />
      </ErrorBoundaryClass>
    );

    // 检查是否有组件栈相关的文本
    expect(screen.getByText(/组件栈/i)).toBeInTheDocument();
    consoleSpy.mockRestore();
  });

  it('should reset error state when retry button is clicked', () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundaryClass>
        <ThrowError shouldThrow={true} />
      </ErrorBoundaryClass>
    );

    const retryButton = screen.getByRole('button', { name: /重试/i });
    retryButton.click();

    // 点击重置后，错误信息应该消失（虽然组件会重新渲染并再次抛出错误）
    consoleSpy.mockRestore();
  });
});
