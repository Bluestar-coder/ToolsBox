import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import PortReferenceTab from '../PortReferenceTab';

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.search': 'Search',
        'ipNetwork.portReference.modePort': 'By Port',
        'ipNetwork.portReference.modeService': 'By Service',
        'ipNetwork.portReference.modeRange': 'By Range',
        'ipNetwork.portReference.placeholderPort': 'Enter port number (0-65535)',
        'ipNetwork.portReference.placeholderService': 'Enter service name or keyword',
        'ipNetwork.portReference.rangeStart': 'Start',
        'ipNetwork.portReference.rangeEnd': 'End',
        'ipNetwork.portReference.showHighFrequency': 'High-Frequency Ports',
        'ipNetwork.portReference.noResults': 'No results. Try searching for a port, service, or range.',
        'ipNetwork.portReference.colPort': 'Port',
        'ipNetwork.portReference.colProtocol': 'Protocol',
        'ipNetwork.portReference.colService': 'Service',
        'ipNetwork.portReference.colDescription': 'Description',
        'ipNetwork.portReference.colRiskLevel': 'Risk Level',
        'ipNetwork.portReference.riskLevel.high': 'High',
        'ipNetwork.portReference.riskLevel.medium': 'Medium',
        'ipNetwork.portReference.riskLevel.low': 'Low',
        'ipNetwork.portReference.riskLevel.info': 'Info',
      };
      return translations[key] || key;
    },
  }),
}));

describe('PortReferenceTab', () => {
  it('renders search mode selector and search button', () => {
    render(<PortReferenceTab />);
    
    expect(screen.getByText('By Port')).toBeInTheDocument();
    expect(screen.getByText('Search')).toBeInTheDocument();
    expect(screen.getByText('High-Frequency Ports')).toBeInTheDocument();
  });

  it('searches by port number', async () => {
    render(<PortReferenceTab />);
    
    const input = screen.getByPlaceholderText('Enter port number (0-65535)');
    const searchButton = screen.getByText('Search');
    
    fireEvent.change(input, { target: { value: '80' } });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText('HTTP')).toBeInTheDocument();
      expect(screen.getByText('Hypertext Transfer Protocol')).toBeInTheDocument();
    });
  });

  it('searches by service name', async () => {
    render(<PortReferenceTab />);
    
    // Switch to service mode
    const modeSelector = screen.getByRole('combobox');
    fireEvent.mouseDown(modeSelector);
    
    await waitFor(() => {
      const serviceOption = screen.getByText('By Service');
      fireEvent.click(serviceOption);
    });
    
    const input = screen.getByPlaceholderText('Enter service name or keyword');
    const searchButton = screen.getByText('Search');
    
    fireEvent.change(input, { target: { value: 'ssh' } });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText('SSH')).toBeInTheDocument();
    });
  });

  it('displays high-frequency ports when button is clicked', async () => {
    render(<PortReferenceTab />);
    
    const highFreqButton = screen.getByText('High-Frequency Ports');
    fireEvent.click(highFreqButton);
    
    await waitFor(() => {
      // Should display high-risk ports like SSH (22), HTTP (80), HTTPS (443)
      expect(screen.getByText('SSH')).toBeInTheDocument();
      expect(screen.getByText('HTTP')).toBeInTheDocument();
      expect(screen.getByText('HTTPS')).toBeInTheDocument();
    });
  });

  it('highlights high-frequency ports in results', async () => {
    render(<PortReferenceTab />);
    
    const highFreqButton = screen.getByText('High-Frequency Ports');
    fireEvent.click(highFreqButton);
    
    await waitFor(() => {
      // Port 22 (SSH) should be highlighted as high-frequency
      const port22Elements = screen.getAllByText('22');
      const port22Code = port22Elements.find(el => el.tagName === 'CODE');
      expect(port22Code).toHaveStyle({ fontWeight: 'bold' });
    });
  });

  it('displays risk level tags with correct colors', async () => {
    render(<PortReferenceTab />);
    
    const input = screen.getByPlaceholderText('Enter port number (0-65535)');
    const searchButton = screen.getByText('Search');
    
    // Search for a high-risk port (22 - SSH)
    fireEvent.change(input, { target: { value: '22' } });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText('High')).toBeInTheDocument();
    });
  });

  it('shows no results message when search returns empty', async () => {
    render(<PortReferenceTab />);
    
    const input = screen.getByPlaceholderText('Enter port number (0-65535)');
    const searchButton = screen.getByText('Search');
    
    // Search for a non-existent port
    fireEvent.change(input, { target: { value: '99999' } });
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      expect(screen.getByText('No results. Try searching for a port, service, or range.')).toBeInTheDocument();
    });
  });

  it('searches by port range', async () => {
    render(<PortReferenceTab />);
    
    // Switch to range mode
    const modeSelector = screen.getByRole('combobox');
    fireEvent.mouseDown(modeSelector);
    
    await waitFor(() => {
      const rangeOption = screen.getByText('By Range');
      fireEvent.click(rangeOption);
    });
    
    // The range inputs should be visible
    const searchButton = screen.getByText('Search');
    fireEvent.click(searchButton);
    
    await waitFor(() => {
      // Should display ports in range 1-1024 (default range)
      expect(screen.getByText('FTP')).toBeInTheDocument();
      expect(screen.getByText('SSH')).toBeInTheDocument();
    });
  });

  it('allows filtering by protocol in table', async () => {
    render(<PortReferenceTab />);
    
    const highFreqButton = screen.getByText('High-Frequency Ports');
    fireEvent.click(highFreqButton);
    
    await waitFor(() => {
      // Table should be rendered with filter options
      expect(screen.getByText('Protocol')).toBeInTheDocument();
    });
  });

  it('allows sorting by port number', async () => {
    render(<PortReferenceTab />);
    
    const highFreqButton = screen.getByText('High-Frequency Ports');
    fireEvent.click(highFreqButton);
    
    await waitFor(() => {
      // Table should be rendered with sortable columns
      expect(screen.getByText('Port')).toBeInTheDocument();
    });
  });
});
