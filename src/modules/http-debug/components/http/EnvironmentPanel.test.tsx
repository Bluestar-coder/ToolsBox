import { render, screen, fireEvent, userEvent, waitFor, within } from '@/test/utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import EnvironmentPanel from './EnvironmentPanel';
import type { Environment } from '../../utils/types';

describe('EnvironmentPanel', () => {
  beforeEach(() => {
    vi.stubGlobal('crypto', {
      randomUUID: vi.fn(() => 'env-new'),
    });
  });

  it('creates a new environment and switches active env', async () => {
    const onEnvironmentsChange = vi.fn();
    const onActiveEnvChange = vi.fn();

    render(
      <EnvironmentPanel
        environments={[]}
        activeEnvId={null}
        onEnvironmentsChange={onEnvironmentsChange}
        onActiveEnvChange={onActiveEnvChange}
      />
    );

    await userEvent.click(screen.getByRole('button', { name: /新建环境/ }));

    expect(onEnvironmentsChange).toHaveBeenCalledWith([
      expect.objectContaining({
        id: 'env-new',
        name: '新环境 1',
        variables: [],
      }),
    ]);
    expect(onActiveEnvChange).toHaveBeenCalledWith('env-new');
  });

  it('updates env name, variables, removes variables, and deletes active env', async () => {
    const env: Environment = {
      id: 'env-1',
      name: 'Dev',
      variables: [{ key: 'TOKEN', value: 'abc', enabled: true }],
    };
    const onEnvironmentsChange = vi.fn();
    const onActiveEnvChange = vi.fn();

    render(
      <EnvironmentPanel
        environments={[env]}
        activeEnvId="env-1"
        onEnvironmentsChange={onEnvironmentsChange}
        onActiveEnvChange={onActiveEnvChange}
      />
    );

    fireEvent.change(screen.getByPlaceholderText(/环境名称/), {
      target: { value: 'Prod' },
    });
    expect(onEnvironmentsChange).toHaveBeenCalledWith([
      expect.objectContaining({ name: 'Prod' }),
    ]);

    fireEvent.click(screen.getByRole('switch'));
    expect(onEnvironmentsChange).toHaveBeenLastCalledWith([
      expect.objectContaining({
        variables: [expect.objectContaining({ enabled: false })],
      }),
    ]);

    fireEvent.change(screen.getByPlaceholderText(/变量名/), {
      target: { value: 'API_KEY' },
    });
    expect(onEnvironmentsChange).toHaveBeenLastCalledWith([
      expect.objectContaining({
        variables: [expect.objectContaining({ key: 'API_KEY' })],
      }),
    ]);

    fireEvent.change(screen.getByPlaceholderText(/变量值/), {
      target: { value: 'secret' },
    });
    expect(onEnvironmentsChange).toHaveBeenLastCalledWith([
      expect.objectContaining({
        variables: [expect.objectContaining({ value: 'secret' })],
      }),
    ]);

    await userEvent.click(screen.getByRole('button', { name: /添加变量/ }));
    expect(onEnvironmentsChange).toHaveBeenLastCalledWith([
      expect.objectContaining({
        variables: [
          expect.objectContaining({ key: 'TOKEN', value: 'abc', enabled: true }),
          expect.objectContaining({ key: '', value: '', enabled: true }),
        ],
      }),
    ]);

    const iconButtons = screen.getAllByRole('button').filter((button) => button.textContent === '');
    await userEvent.click(iconButtons[0]);
    const confirm = within(document.body).getByRole('button', { name: /确\s*定/ });
    await userEvent.click(confirm);

    await waitFor(() => {
      expect(onEnvironmentsChange).toHaveBeenLastCalledWith([]);
    });
    expect(onActiveEnvChange).toHaveBeenLastCalledWith(null);
  });
});
