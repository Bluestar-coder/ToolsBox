import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { HistoryEntry } from '../../utils/types';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (_key: string, defaultValue?: string) => defaultValue ?? _key,
  }),
}));

vi.mock('antd', () => ({
  Button: ({ children, onClick, disabled }: { children?: React.ReactNode; onClick?: () => void; disabled?: boolean }) => (
    <button type="button" onClick={onClick} disabled={disabled}>
      {children}
    </button>
  ),
  Tag: ({ children }: { children?: React.ReactNode }) => <span>{children}</span>,
  List: Object.assign(
    ({
      dataSource,
      renderItem,
    }: {
      dataSource: HistoryEntry[];
      renderItem: (entry: HistoryEntry) => React.ReactNode;
    }) => <ul>{dataSource.map((entry) => renderItem(entry))}</ul>,
    {
      Item: ({ children, onClick, style }: { children?: React.ReactNode; onClick?: () => void; style?: React.CSSProperties }) => (
        <li onClick={onClick} style={style}>
          {children}
        </li>
      ),
    }
  ),
  Empty: ({ description }: { description?: React.ReactNode }) => <div>{description}</div>,
  Popconfirm: ({
    children,
    onConfirm,
  }: {
    children: React.ReactElement<{ onClick?: () => void }>;
    onConfirm?: () => void;
  }) =>
    React.cloneElement(children, {
      onClick: () => {
        onConfirm?.();
      },
    }),
  Typography: {
    Text: ({ children, onClick, title, strong }: { children?: React.ReactNode; onClick?: () => void; title?: string; strong?: boolean }) => (
      <span onClick={onClick} title={title} data-strong={strong ? 'true' : 'false'}>
        {children}
      </span>
    ),
  },
}));

import HistoryPanel from './HistoryPanel';

describe('HistoryPanel', () => {
  it('shows empty state and disables clear action when history is empty', () => {
    render(<HistoryPanel history={[]} onSelect={vi.fn()} onClear={vi.fn()} />);

    expect(screen.getByText('暂无历史记录')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /清空/ })).toBeDisabled();
  });

  it('selects entries and clears all after confirmation', async () => {
    const onSelect = vi.fn();
    const onClear = vi.fn();
    const entry: HistoryEntry = {
      id: 'history-1',
      timestamp: Date.now() - 30_000,
      request: {
        method: 'GET',
        url: 'https://example.com/some/really/long/path?foo=bar&baz=qux',
        headers: [],
        bodyType: 'none',
        body: '',
      },
    };

    render(<HistoryPanel history={[entry]} onSelect={onSelect} onClear={onClear} />);

    expect(screen.getByText('GET')).toBeInTheDocument();
    expect(screen.getByText(/ago/)).toBeInTheDocument();

    await userEvent.click(screen.getByText(/https:\/\/example.com\/some\/really\/long\/path/));
    expect(onSelect).toHaveBeenCalledWith(entry);

    await userEvent.click(screen.getByRole('button', { name: /清空/ }));
    expect(onClear).toHaveBeenCalled();
  });
});
