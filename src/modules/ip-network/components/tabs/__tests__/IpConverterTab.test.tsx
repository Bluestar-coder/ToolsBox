import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import IpConverterTab from '../IpConverterTab';

describe('IpConverterTab', () => {
  it('should render input field with placeholder', () => {
    render(<IpConverterTab />);
    expect(screen.getByPlaceholderText('ipNetwork.converter.placeholder')).toBeInTheDocument();
  });

  it('should show no results and no error when input is empty', () => {
    render(<IpConverterTab />);
    expect(screen.queryByText('ipNetwork.converter.ipv4ResultTitle')).not.toBeInTheDocument();
    expect(screen.queryByText('ipNetwork.converter.ipv6ResultTitle')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should detect dotted format and show IPv4 results', () => {
    render(<IpConverterTab />);
    const input = screen.getByPlaceholderText('ipNetwork.converter.placeholder');
    fireEvent.change(input, { target: { value: '192.168.1.1' } });

    // Format tag should show dotted
    expect(screen.getByText('ipNetwork.converter.formatDotted')).toBeInTheDocument();

    // IPv4 results should be displayed
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('C0A80101')).toBeInTheDocument();
    expect(screen.getByText('0xC0.0xA8.0x01.0x01')).toBeInTheDocument();
    expect(screen.getByText('11000000.10101000.00000001.00000001')).toBeInTheDocument();
    expect(screen.getByText('3232235777')).toBeInTheDocument();
  });

  it('should detect hex format and show IPv4 results', () => {
    render(<IpConverterTab />);
    const input = screen.getByPlaceholderText('ipNetwork.converter.placeholder');
    fireEvent.change(input, { target: { value: 'C0A80101' } });

    expect(screen.getByText('ipNetwork.converter.formatHex')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('should detect integer format and show IPv4 results', () => {
    render(<IpConverterTab />);
    const input = screen.getByPlaceholderText('ipNetwork.converter.placeholder');
    fireEvent.change(input, { target: { value: '3232235777' } });

    expect(screen.getByText('ipNetwork.converter.formatInteger')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('should detect binary format and show IPv4 results', () => {
    render(<IpConverterTab />);
    const input = screen.getByPlaceholderText('ipNetwork.converter.placeholder');
    fireEvent.change(input, { target: { value: '11000000.10101000.00000001.00000001' } });

    expect(screen.getByText('ipNetwork.converter.formatBinary')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('should detect IPv6 format and show IPv6 results', () => {
    render(<IpConverterTab />);
    const input = screen.getByPlaceholderText('ipNetwork.converter.placeholder');
    fireEvent.change(input, { target: { value: '2001:0db8::1' } });

    expect(screen.getByText('ipNetwork.converter.formatIpv6')).toBeInTheDocument();
    // Full form
    expect(screen.getByText('2001:0db8:0000:0000:0000:0000:0000:0001')).toBeInTheDocument();
    // Compressed form
    expect(screen.getByText('2001:db8::1')).toBeInTheDocument();
  });

  it('should show error alert for invalid input', () => {
    render(<IpConverterTab />);
    const input = screen.getByPlaceholderText('ipNetwork.converter.placeholder');
    fireEvent.change(input, { target: { value: 'not-an-ip' } });

    expect(screen.getByText('ipNetwork.converter.formatUnknown')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should clear results when input is cleared', () => {
    render(<IpConverterTab />);
    const input = screen.getByPlaceholderText('ipNetwork.converter.placeholder');

    // Enter valid IP
    fireEvent.change(input, { target: { value: '192.168.1.1' } });
    expect(screen.getByText('C0A80101')).toBeInTheDocument();

    // Clear input
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.queryByText('C0A80101')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
