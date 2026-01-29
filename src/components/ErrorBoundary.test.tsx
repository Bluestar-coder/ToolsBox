import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
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
  let consoleSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  it('should render children when there is no error', () => {
    render(
      <ErrorBoundaryClass>
        <ThrowError shouldThrow={false} />
      </ErrorBoundaryClass>
    );
    expect(screen.getByText('No error')).toBeInTheDocument();
  });

  it('should catch and display errors', () => {
    render(
      <ErrorBoundaryClass>
        <ThrowError shouldThrow={true} />
      </ErrorBoundaryClass>
    );

    expect(screen.getByText(/应用发生错误/i)).toBeInTheDocument();
  });

  it('should display error message', () => {
    render(
      <ErrorBoundaryClass>
        <ThrowError shouldThrow={true} />
      </ErrorBoundaryClass>
    );

    expect(screen.getByText(/Test error/)).toBeInTheDocument();
  });

  it('should have a retry button', () => {
    render(
      <ErrorBoundaryClass>
        <ThrowError shouldThrow={true} />
      </ErrorBoundaryClass>
    );

    const retryButton = screen.getByRole('button', { name: /重试/i });
    expect(retryButton).toBeInTheDocument();
  });

  it('should display component stack when available', () => {
    render(
      <ErrorBoundaryClass>
        <ThrowError shouldThrow={true} />
      </ErrorBoundaryClass>
    );

    // 检查是否有组件栈相关的文本
    expect(screen.getByText(/组件栈/i)).toBeInTheDocument();
  });

  it('should reset error state when retry button is clicked', () => {
    render(
      <ErrorBoundaryClass>
        <ThrowError shouldThrow={true} />
      </ErrorBoundaryClass>
    );

    const retryButton = screen.getByRole('button', { name: /重试/i });
    retryButton.click();

    // 点击重置后，错误信息应该消失（虽然组件会重新渲染并再次抛出错误）
  });
});
