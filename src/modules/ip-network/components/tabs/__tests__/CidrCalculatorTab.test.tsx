import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import CidrCalculatorTab from '../CidrCalculatorTab';

describe('CidrCalculatorTab', () => {
  it('should render CIDR input field with placeholder', () => {
    render(<CidrCalculatorTab />);
    expect(screen.getByPlaceholderText('ipNetwork.cidr.placeholder')).toBeInTheDocument();
  });

  it('should show no results and no error when input is empty', () => {
    render(<CidrCalculatorTab />);
    expect(screen.queryByText('ipNetwork.cidr.resultTitle')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should calculate and display CIDR info for valid input', () => {
    render(<CidrCalculatorTab />);
    const input = screen.getByPlaceholderText('ipNetwork.cidr.placeholder');
    fireEvent.change(input, { target: { value: '192.168.1.0/24' } });

    // Result card should appear
    expect(screen.getByText('ipNetwork.cidr.resultTitle')).toBeInTheDocument();

    // Check computed values
    expect(screen.getByText('192.168.1.0')).toBeInTheDocument();       // network address
    expect(screen.getByText('192.168.1.255')).toBeInTheDocument();     // broadcast address
    expect(screen.getByText('255.255.255.0')).toBeInTheDocument();     // subnet mask
    expect(screen.getByText('0.0.0.255')).toBeInTheDocument();         // wildcard mask
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();       // first host
    expect(screen.getByText('192.168.1.254')).toBeInTheDocument();     // last host
    expect(screen.getByText('254')).toBeInTheDocument();               // usable hosts
    expect(screen.getByText('/24')).toBeInTheDocument();               // prefix length
  });

  it('should show error for invalid CIDR input', () => {
    render(<CidrCalculatorTab />);
    const input = screen.getByPlaceholderText('ipNetwork.cidr.placeholder');
    fireEvent.change(input, { target: { value: '192.168.1.0/33' } });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.queryByText('ipNetwork.cidr.resultTitle')).not.toBeInTheDocument();
  });

  it('should update results in real-time when CIDR changes', () => {
    render(<CidrCalculatorTab />);
    const input = screen.getByPlaceholderText('ipNetwork.cidr.placeholder');

    fireEvent.change(input, { target: { value: '10.0.0.0/8' } });
    expect(screen.getByText('10.0.0.0')).toBeInTheDocument();
    expect(screen.getByText('10.255.255.255')).toBeInTheDocument();

    // Change to /16
    fireEvent.change(input, { target: { value: '10.0.0.0/16' } });
    expect(screen.getByText('10.0.255.255')).toBeInTheDocument();
  });

  it('should clear results when input is cleared', () => {
    render(<CidrCalculatorTab />);
    const input = screen.getByPlaceholderText('ipNetwork.cidr.placeholder');

    fireEvent.change(input, { target: { value: '192.168.1.0/24' } });
    expect(screen.getByText('ipNetwork.cidr.resultTitle')).toBeInTheDocument();

    fireEvent.change(input, { target: { value: '' } });
    expect(screen.queryByText('ipNetwork.cidr.resultTitle')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should render minimum CIDR section with two IP inputs and button', () => {
    render(<CidrCalculatorTab />);
    expect(screen.getByPlaceholderText('ipNetwork.cidr.ip1Placeholder')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('ipNetwork.cidr.ip2Placeholder')).toBeInTheDocument();
    expect(screen.getByText('ipNetwork.cidr.calculateMinCidr')).toBeInTheDocument();
  });

  it('should calculate minimum CIDR for two valid IPs', () => {
    render(<CidrCalculatorTab />);
    const ip1Input = screen.getByPlaceholderText('ipNetwork.cidr.ip1Placeholder');
    const ip2Input = screen.getByPlaceholderText('ipNetwork.cidr.ip2Placeholder');
    const button = screen.getByText('ipNetwork.cidr.calculateMinCidr');

    fireEvent.change(ip1Input, { target: { value: '192.168.1.0' } });
    fireEvent.change(ip2Input, { target: { value: '192.168.2.0' } });
    fireEvent.click(button);

    expect(screen.getByText('192.168.0.0/22')).toBeInTheDocument();
  });

  it('should show error when minimum CIDR IPs are missing', () => {
    render(<CidrCalculatorTab />);
    const button = screen.getByText('ipNetwork.cidr.calculateMinCidr');
    fireEvent.click(button);

    expect(screen.getByText('ipNetwork.cidr.errorBothIpsRequired')).toBeInTheDocument();
  });

  it('should show error for invalid IP in minimum CIDR calculation', () => {
    render(<CidrCalculatorTab />);
    const ip1Input = screen.getByPlaceholderText('ipNetwork.cidr.ip1Placeholder');
    const ip2Input = screen.getByPlaceholderText('ipNetwork.cidr.ip2Placeholder');
    const button = screen.getByText('ipNetwork.cidr.calculateMinCidr');

    fireEvent.change(ip1Input, { target: { value: 'invalid' } });
    fireEvent.change(ip2Input, { target: { value: '192.168.1.1' } });
    fireEvent.click(button);

    // Should show an error alert in the min CIDR section
    const alerts = screen.getAllByRole('alert');
    expect(alerts.length).toBeGreaterThan(0);
  });
});
