import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import SubnetDividerTab from '../SubnetDividerTab';

describe('SubnetDividerTab', () => {
  it('should render CIDR input, mode selector, and calculate button', () => {
    render(<SubnetDividerTab />);
    expect(screen.getByPlaceholderText('ipNetwork.subnet.cidrPlaceholder')).toBeInTheDocument();
    expect(screen.getByText('ipNetwork.subnet.modeByCount')).toBeInTheDocument();
    expect(screen.getByText('ipNetwork.subnet.modeByHosts')).toBeInTheDocument();
    expect(screen.getByText('ipNetwork.subnet.calculate')).toBeInTheDocument();
  });

  it('should show no results and no error initially', () => {
    render(<SubnetDividerTab />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('should show error when calculating with empty input', () => {
    render(<SubnetDividerTab />);
    fireEvent.click(screen.getByText('ipNetwork.subnet.calculate'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should show error for invalid CIDR input', () => {
    render(<SubnetDividerTab />);
    const input = screen.getByPlaceholderText('ipNetwork.subnet.cidrPlaceholder');
    fireEvent.change(input, { target: { value: '999.999.999.999/24' } });
    fireEvent.click(screen.getByText('ipNetwork.subnet.calculate'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should divide by subnet count and display results table', () => {
    render(<SubnetDividerTab />);
    const input = screen.getByPlaceholderText('ipNetwork.subnet.cidrPlaceholder');
    fireEvent.change(input, { target: { value: '192.168.0.0/24' } });

    // Default mode is byCount, default count is 2
    fireEvent.click(screen.getByText('ipNetwork.subnet.calculate'));

    // Table should appear with subnet data
    expect(screen.getByRole('table')).toBeInTheDocument();
    // Two /25 subnets: 192.168.0.0/25 and 192.168.0.128/25
    expect(screen.getByText('192.168.0.0/25')).toBeInTheDocument();
    expect(screen.getByText('192.168.0.128/25')).toBeInTheDocument();
  });

  it('should switch to byHosts mode and divide accordingly', () => {
    render(<SubnetDividerTab />);
    const input = screen.getByPlaceholderText('ipNetwork.subnet.cidrPlaceholder');
    fireEvent.change(input, { target: { value: '10.0.0.0/24' } });

    // Switch to byHosts mode
    fireEvent.click(screen.getByText('ipNetwork.subnet.modeByHosts'));

    fireEvent.click(screen.getByText('ipNetwork.subnet.calculate'));

    // Default hostsPerSubnet is 2, so /30 subnets (2 usable hosts each)
    expect(screen.getByRole('table')).toBeInTheDocument();
    expect(screen.getByText('10.0.0.0/30')).toBeInTheDocument();
  });

  it('should show error when subnet count exceeds maximum', () => {
    render(<SubnetDividerTab />);
    const input = screen.getByPlaceholderText('ipNetwork.subnet.cidrPlaceholder');
    fireEvent.change(input, { target: { value: '192.168.0.0/30' } });

    // /30 has max 4 subnets (/32), try requesting more
    const numberInput = screen.getByRole('spinbutton');
    fireEvent.change(numberInput, { target: { value: '8' } });

    fireEvent.click(screen.getByText('ipNetwork.subnet.calculate'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should clear previous error when a valid calculation succeeds', () => {
    render(<SubnetDividerTab />);
    const input = screen.getByPlaceholderText('ipNetwork.subnet.cidrPlaceholder');

    // First trigger an error
    fireEvent.click(screen.getByText('ipNetwork.subnet.calculate'));
    expect(screen.getByRole('alert')).toBeInTheDocument();

    // Now enter valid input and calculate
    fireEvent.change(input, { target: { value: '192.168.0.0/24' } });
    fireEvent.click(screen.getByText('ipNetwork.subnet.calculate'));

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('table')).toBeInTheDocument();
  });
});
