import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IpNetworkTool from '../IpNetworkTool';

// Mock i18n
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'modules.ipNetwork.title': 'IP/Network Tools',
        'modules.ipNetwork.tabs.converter': 'IP Converter',
        'modules.ipNetwork.tabs.cidr': 'CIDR Calculator',
        'modules.ipNetwork.tabs.subnet': 'Subnet Divider',
        'modules.ipNetwork.tabs.geolocation': 'Geolocation',
        'modules.ipNetwork.tabs.port': 'Port Reference',
      };
      return translations[key] || key;
    },
  }),
}));

// Mock tab components
vi.mock('../tabs/IpConverterTab', () => ({
  default: () => <div data-testid="ip-converter-tab">IP Converter Tab</div>,
}));

vi.mock('../tabs/CidrCalculatorTab', () => ({
  default: () => <div data-testid="cidr-calculator-tab">CIDR Calculator Tab</div>,
}));

vi.mock('../tabs/SubnetDividerTab', () => ({
  default: () => <div data-testid="subnet-divider-tab">Subnet Divider Tab</div>,
}));

vi.mock('../tabs/GeolocationTab', () => ({
  default: () => <div data-testid="geolocation-tab">Geolocation Tab</div>,
}));

vi.mock('../tabs/PortReferenceTab', () => ({
  default: () => <div data-testid="port-reference-tab">Port Reference Tab</div>,
}));

describe('IpNetworkTool', () => {
  it('renders with title', () => {
    render(<IpNetworkTool />);
    expect(screen.getByText('IP/Network Tools')).toBeInTheDocument();
  });

  it('renders all five tab labels', () => {
    render(<IpNetworkTool />);
    expect(screen.getByText('IP Converter')).toBeInTheDocument();
    expect(screen.getByText('CIDR Calculator')).toBeInTheDocument();
    expect(screen.getByText('Subnet Divider')).toBeInTheDocument();
    expect(screen.getByText('Geolocation')).toBeInTheDocument();
    expect(screen.getByText('Port Reference')).toBeInTheDocument();
  });

  it('displays IP Converter tab by default', () => {
    render(<IpNetworkTool />);
    expect(screen.getByTestId('ip-converter-tab')).toBeInTheDocument();
  });

  it('switches to CIDR Calculator tab when clicked', async () => {
    const user = userEvent.setup();
    render(<IpNetworkTool />);
    
    await user.click(screen.getByText('CIDR Calculator'));
    expect(screen.getByTestId('cidr-calculator-tab')).toBeInTheDocument();
  });

  it('switches to Subnet Divider tab when clicked', async () => {
    const user = userEvent.setup();
    render(<IpNetworkTool />);
    
    await user.click(screen.getByText('Subnet Divider'));
    expect(screen.getByTestId('subnet-divider-tab')).toBeInTheDocument();
  });

  it('switches to Geolocation tab when clicked', async () => {
    const user = userEvent.setup();
    render(<IpNetworkTool />);
    
    await user.click(screen.getByText('Geolocation'));
    expect(screen.getByTestId('geolocation-tab')).toBeInTheDocument();
  });

  it('switches to Port Reference tab when clicked', async () => {
    const user = userEvent.setup();
    render(<IpNetworkTool />);
    
    await user.click(screen.getByText('Port Reference'));
    expect(screen.getByTestId('port-reference-tab')).toBeInTheDocument();
  });
});
