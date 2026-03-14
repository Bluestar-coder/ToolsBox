import { describe, it, expect } from 'vitest';
import { render, screen, userEvent } from '@/test/utils';
import TimeTool from './TimeTool';

describe('TimeTool', () => {
  it('renders and switches time tabs', async () => {
    render(<TimeTool initialTab="smart" />);

    expect(await screen.findByText(/快捷操作/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /代码生成/i }));
    expect(await screen.findByText(/输入时间戳或时间字符串/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /时间计算/i }));
    expect(await screen.findByText(/时间差计算/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /批量转换/i }));
    expect(await screen.findByText(/批量时间输入/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /时区专家/i }));
    expect(await screen.findByText(/时区转换设置/i)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('tab', { name: /随机唯一值/i }));
    expect(await screen.findByText(/UUID v1/i)).toBeInTheDocument();
  });
});
