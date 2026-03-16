import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, userEvent, waitFor } from '@/test/utils';
import { message } from 'antd';
import UUIDTab from './UUIDTab';

vi.mock('@ant-design/icons', () => ({
  CopyOutlined: () => <span>copy-icon</span>,
  ReloadOutlined: () => <span>reload-icon</span>,
}));

vi.mock('antd', async (importOriginal) => {
  const actual = await importOriginal<typeof import('antd')>();
  const message = {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  };

  return {
    ...actual,
    message,
    Button: ({
      children,
      icon,
      onClick,
      disabled,
    }: {
      children?: React.ReactNode;
      icon?: React.ReactNode;
      onClick?: () => void;
      disabled?: boolean;
    }) => (
      <button type="button" onClick={onClick} disabled={disabled}>
        {children ?? icon}
      </button>
    ),
    Card: ({ children, title }: { children?: React.ReactNode; title?: React.ReactNode }) => (
      <section>
        {title}
        {children}
      </section>
    ),
    Space: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Row: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Col: ({ children }: { children?: React.ReactNode }) => <div>{children}</div>,
    Typography: {
      Text: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
    },
  };
});

const generatorMocks = vi.hoisted(() => {
  const sequence = (prefix: string) => {
    let count = 0;
    return vi.fn(() => {
      count += 1;
      return `${prefix}-${count}`;
    });
  };

  return {
    generateUUIDv1: sequence('uuidv1'),
    generateUUID: sequence('uuidv4'),
    generateGUID: sequence('guid'),
    generateUUIDNoDash: sequence('uuidnodash'),
    generateShortUUID: sequence('short'),
    generateNanoID: sequence('nano'),
    generateULID: sequence('ulid'),
    generateSnowflakeID: sequence('snowflake'),
    generateObjectId: sequence('object'),
    generateCUID: sequence('cuid'),
    generateKSUID: sequence('ksuid'),
    generateRandomString: vi.fn(() => ''),
  };
});

vi.mock('../../utils/generators', () => ({
  generateUUIDv1: generatorMocks.generateUUIDv1,
  generateUUID: generatorMocks.generateUUID,
  generateGUID: generatorMocks.generateGUID,
  generateUUIDNoDash: generatorMocks.generateUUIDNoDash,
  generateShortUUID: generatorMocks.generateShortUUID,
  generateNanoID: generatorMocks.generateNanoID,
  generateULID: generatorMocks.generateULID,
  generateSnowflakeID: generatorMocks.generateSnowflakeID,
  generateObjectId: generatorMocks.generateObjectId,
  generateCUID: generatorMocks.generateCUID,
  generateKSUID: generatorMocks.generateKSUID,
  generateRandomString: generatorMocks.generateRandomString,
}));

describe('UUIDTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('navigator', {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('refreshes all ids and allows per-item refresh', async () => {
    render(<UUIDTab />);

    const initialValue = screen.getAllByText(/uuidv1-/i)[0].textContent;
    expect(initialValue).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: /刷新全部/i }));
    const refreshedValue = screen.getAllByText(/uuidv1-/i)[0].textContent;
    expect(refreshedValue).toBeTruthy();
    expect(refreshedValue).not.toBe(initialValue);

    await userEvent.click(screen.getAllByRole('button', { name: /reload-icon/i })[0]);
    const singleRefreshValue = screen.getAllByText(/uuidv1-/i)[0].textContent;
    expect(singleRefreshValue).toBeTruthy();
    expect(singleRefreshValue).not.toBe(refreshedValue);
  });

  it('copies populated ids and surfaces clipboard failures', async () => {
    render(<UUIDTab />);
    const firstValue = screen.getAllByText(/uuidv1-/i)[0].textContent;

    await userEvent.click(screen.getAllByRole('button', { name: /copy-icon/i })[0]);
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(firstValue);
      expect(message.success).toHaveBeenCalledWith('已复制');
    });

    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('denied'));
    await userEvent.click(screen.getAllByRole('button', { name: /copy-icon/i })[1]);
    await waitFor(() => {
      expect(message.error).toHaveBeenCalledWith('复制失败');
    });
  });

  it('warns when attempting to copy an empty generated value', async () => {
    render(<UUIDTab />);

    const copyButtons = screen.getAllByRole('button', { name: /copy-icon/i });
    await userEvent.click(copyButtons[copyButtons.length - 1]);

    expect(message.warning).toHaveBeenCalledWith('没有可复制的内容');
  });
});
