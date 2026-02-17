import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, within } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import MessageLog from '../MessageLog';
import type { WsMessage } from '../../../utils/types';

function makeMsg(overrides: Partial<WsMessage> = {}): WsMessage {
  return {
    id: '1',
    direction: 'sent',
    type: 'text',
    content: 'hello',
    timestamp: Date.now(),
    ...overrides,
  };
}

const defaultProps = {
  messages: [] as WsMessage[],
  onClear: vi.fn(),
};

describe('MessageLog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should show empty state when no messages', () => {
    render(<MessageLog {...defaultProps} />);
    expect(screen.getByText('暂无消息')).toBeInTheDocument();
  });

  it('should show title "消息记录"', () => {
    render(<MessageLog {...defaultProps} />);
    expect(screen.getByText('消息记录')).toBeInTheDocument();
  });

  it('should disable clear button when no messages', () => {
    render(<MessageLog {...defaultProps} />);
    const clearBtn = screen.getByText('清空').closest('button');
    expect(clearBtn).toBeDisabled();
  });

  it('should enable clear button when messages exist', () => {
    render(<MessageLog {...defaultProps} messages={[makeMsg()]} />);
    const clearBtn = screen.getByText('清空').closest('button');
    expect(clearBtn).not.toBeDisabled();
  });

  it('should call onClear after confirming clear', async () => {
    const user = userEvent.setup();
    const onClear = vi.fn();
    render(<MessageLog messages={[makeMsg()]} onClear={onClear} />);

    await user.click(screen.getByText('清空'));
    // Ant Design Popconfirm renders button text with a space (e.g. "确 定")
    const confirmBtn = screen.getByRole('button', { name: /确\s*定/ });
    await user.click(confirmBtn);

    expect(onClear).toHaveBeenCalledTimes(1);
  });

  it('should render sent message with up arrow icon', () => {
    const msg = makeMsg({ direction: 'sent', content: 'sent msg' });
    render(<MessageLog messages={[msg]} onClear={vi.fn()} />);

    expect(screen.getByText('sent msg')).toBeInTheDocument();
    // ArrowUpOutlined renders an svg with role="img"
    const list = screen.getByTestId('message-log-list');
    const icons = list.querySelectorAll('[aria-label="arrow-up"]');
    expect(icons.length).toBe(1);
  });

  it('should render received message with down arrow icon', () => {
    const msg = makeMsg({ direction: 'received', content: 'recv msg' });
    render(<MessageLog messages={[msg]} onClear={vi.fn()} />);

    expect(screen.getByText('recv msg')).toBeInTheDocument();
    const list = screen.getByTestId('message-log-list');
    const icons = list.querySelectorAll('[aria-label="arrow-down"]');
    expect(icons.length).toBe(1);
  });

  it('should display text type tag for text messages', () => {
    const msg = makeMsg({ type: 'text' });
    render(<MessageLog messages={[msg]} onClear={vi.fn()} />);
    expect(screen.getByText('文本')).toBeInTheDocument();
  });

  it('should display binary type tag for binary messages', () => {
    const msg = makeMsg({ type: 'binary', content: '48656c6c6f' });
    render(<MessageLog messages={[msg]} onClear={vi.fn()} />);
    expect(screen.getByText('二进制')).toBeInTheDocument();
  });

  it('should use monospace font for binary message content', () => {
    const msg = makeMsg({ type: 'binary', content: 'aabb' });
    render(<MessageLog messages={[msg]} onClear={vi.fn()} />);
    const contentEl = screen.getByText('aabb');
    expect(contentEl.style.fontFamily).toBe('monospace');
  });

  it('should display formatted timestamp', () => {
    // Create a message at a known time
    const ts = new Date(2024, 0, 15, 14, 30, 45).getTime();
    const msg = makeMsg({ timestamp: ts });
    render(<MessageLog messages={[msg]} onClear={vi.fn()} />);
    expect(screen.getByText('14:30:45')).toBeInTheDocument();
  });

  it('should render multiple messages in order', () => {
    const msgs: WsMessage[] = [
      makeMsg({ id: '1', direction: 'sent', content: 'first', timestamp: 1000 }),
      makeMsg({ id: '2', direction: 'received', content: 'second', timestamp: 2000 }),
      makeMsg({ id: '3', direction: 'sent', content: 'third', timestamp: 3000 }),
    ];
    render(<MessageLog messages={msgs} onClear={vi.fn()} />);

    const list = screen.getByTestId('message-log-list');
    const contents = within(list).getAllByText(/first|second|third/);
    expect(contents).toHaveLength(3);
    expect(contents[0]).toHaveTextContent('first');
    expect(contents[1]).toHaveTextContent('second');
    expect(contents[2]).toHaveTextContent('third');
  });

  it('should visually distinguish sent vs received messages via alignment', () => {
    const msgs: WsMessage[] = [
      makeMsg({ id: '1', direction: 'sent', content: 'sent-content' }),
      makeMsg({ id: '2', direction: 'received', content: 'recv-content' }),
    ];
    render(<MessageLog messages={msgs} onClear={vi.fn()} />);

    const sentBubble = screen.getByText('sent-content').parentElement!;
    const recvBubble = screen.getByText('recv-content').parentElement!;

    expect(sentBubble.style.alignItems).toBe('flex-end');
    expect(recvBubble.style.alignItems).toBe('flex-start');
  });

  it('should not show empty state when messages exist', () => {
    render(<MessageLog messages={[makeMsg()]} onClear={vi.fn()} />);
    expect(screen.queryByText('暂无消息')).not.toBeInTheDocument();
  });
});
