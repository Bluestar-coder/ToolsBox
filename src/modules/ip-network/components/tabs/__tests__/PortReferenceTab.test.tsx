import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import i18n from '@/i18n';
import PortReferenceTab from '../PortReferenceTab';

describe('PortReferenceTab', () => {
  const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);
  const getSearchButton = () => screen.getByRole('button', { name: /搜\s*索/ });
  const getHighFrequencyButton = () => screen.getByRole('button', { name: /高频端口/ });

  it('renders search mode selector and action buttons', () => {
    render(<PortReferenceTab />);

    expect(screen.getByRole('combobox')).toBeInTheDocument();
    expect(getSearchButton()).toBeInTheDocument();
    expect(getHighFrequencyButton()).toBeInTheDocument();
  });

  it('searches by port number', async () => {
    render(<PortReferenceTab />);

    const input = screen.getByPlaceholderText(t('modules.ipNetwork.portReference.placeholderPort'));
    fireEvent.change(input, { target: { value: '80' } });
    fireEvent.click(getSearchButton());

    await waitFor(() => {
      expect(screen.getByText('HTTP')).toBeInTheDocument();
    });
  });

  it('searches by service name after switching mode', async () => {
    render(<PortReferenceTab />);

    const modeSelector = screen.getByRole('combobox');
    fireEvent.mouseDown(modeSelector);
    fireEvent.click(await screen.findByText(t('modules.ipNetwork.portReference.modeService')));

    const input = screen.getByPlaceholderText(t('modules.ipNetwork.portReference.placeholderService'));
    fireEvent.change(input, { target: { value: 'ssh' } });
    fireEvent.click(getSearchButton());

    await waitFor(() => {
      expect(screen.getByText('SSH')).toBeInTheDocument();
    });
  });

  it('displays high-frequency ports when button is clicked', async () => {
    render(<PortReferenceTab />);

    fireEvent.click(getHighFrequencyButton());

    await waitFor(() => {
      expect(screen.getByText('SSH')).toBeInTheDocument();
      expect(screen.getByText('HTTP')).toBeInTheDocument();
      expect(screen.getByText('HTTPS')).toBeInTheDocument();
    });
  });

  it('shows no results message when search is invalid', async () => {
    render(<PortReferenceTab />);

    const input = screen.getByPlaceholderText(t('modules.ipNetwork.portReference.placeholderPort'));
    fireEvent.change(input, { target: { value: '99999' } });
    fireEvent.click(getSearchButton());

    await waitFor(() => {
      expect(screen.getByText(t('modules.ipNetwork.portReference.noResults'))).toBeInTheDocument();
    });
  });

  it('searches by port range', async () => {
    render(<PortReferenceTab />);

    const modeSelector = screen.getByRole('combobox');
    fireEvent.mouseDown(modeSelector);
    fireEvent.click(await screen.findByText(t('modules.ipNetwork.portReference.modeRange')));

    fireEvent.click(getSearchButton());

    await waitFor(() => {
      expect(screen.getByText('FTP')).toBeInTheDocument();
      expect(screen.getByText('SSH')).toBeInTheDocument();
    });
  });

  it('renders protocol and risk columns in table', async () => {
    render(<PortReferenceTab />);

    fireEvent.click(getHighFrequencyButton());

    await waitFor(() => {
      expect(screen.getAllByText(t('modules.ipNetwork.portReference.colProtocol')).length).toBeGreaterThan(0);
      expect(screen.getAllByText(t('modules.ipNetwork.portReference.colRiskLevel')).length).toBeGreaterThan(0);
    });
  });

  it('highlights high-frequency port number', async () => {
    render(<PortReferenceTab />);

    fireEvent.click(getHighFrequencyButton());

    await waitFor(() => {
      const port22Elements = screen.getAllByText('22');
      const highlighted = port22Elements.find((el) => el.tagName === 'CODE');
      expect(highlighted).toHaveStyle({ fontWeight: 'bold' });
    });
  });
});
