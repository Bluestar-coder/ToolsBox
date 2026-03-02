import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import i18n from '@/i18n';
import IpConverterTab from '../IpConverterTab';

describe('IpConverterTab', () => {
  const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);

  it('should render input field with placeholder', () => {
    render(<IpConverterTab />);
    expect(screen.getByPlaceholderText(t('modules.ipNetwork.converter.placeholder'))).toBeInTheDocument();
  });

  it('should show no results and no error when input is empty', () => {
    render(<IpConverterTab />);
    expect(screen.queryByText(t('modules.ipNetwork.converter.ipv4ResultTitle'))).not.toBeInTheDocument();
    expect(screen.queryByText(t('modules.ipNetwork.converter.ipv6ResultTitle'))).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('should detect dotted format and show IPv4 results', () => {
    render(<IpConverterTab />);
    const input = screen.getByPlaceholderText(t('modules.ipNetwork.converter.placeholder'));
    fireEvent.change(input, { target: { value: '192.168.1.1' } });

    // Format tag should show dotted
    expect(screen.getAllByText(t('modules.ipNetwork.converter.formatDotted')).length).toBeGreaterThan(0);

    // IPv4 results should be displayed
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('C0A80101')).toBeInTheDocument();
    expect(screen.getByText('0xC0.0xA8.0x01.0x01')).toBeInTheDocument();
    expect(screen.getByText('11000000.10101000.00000001.00000001')).toBeInTheDocument();
    expect(screen.getByText('3232235777')).toBeInTheDocument();
  });

  it('should detect hex format and show IPv4 results', () => {
    render(<IpConverterTab />);
    const input = screen.getByPlaceholderText(t('modules.ipNetwork.converter.placeholder'));
    fireEvent.change(input, { target: { value: 'C0A80101' } });

    expect(screen.getAllByText(t('modules.ipNetwork.converter.formatHex')).length).toBeGreaterThan(0);
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('should detect integer format and show IPv4 results', () => {
    render(<IpConverterTab />);
    const input = screen.getByPlaceholderText(t('modules.ipNetwork.converter.placeholder'));
    fireEvent.change(input, { target: { value: '3232235777' } });

    expect(screen.getAllByText(t('modules.ipNetwork.converter.formatInteger')).length).toBeGreaterThan(0);
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('should detect binary format and show IPv4 results', () => {
    render(<IpConverterTab />);
    const input = screen.getByPlaceholderText(t('modules.ipNetwork.converter.placeholder'));
    fireEvent.change(input, { target: { value: '11000000.10101000.00000001.00000001' } });

    expect(screen.getAllByText(t('modules.ipNetwork.converter.formatBinary')).length).toBeGreaterThan(0);
    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
  });

  it('should detect IPv6 format and show IPv6 results', () => {
    render(<IpConverterTab />);
    const input = screen.getByPlaceholderText(t('modules.ipNetwork.converter.placeholder'));
    fireEvent.change(input, { target: { value: '2001:0db8::1' } });

    expect(screen.getByText(t('modules.ipNetwork.converter.formatIpv6'))).toBeInTheDocument();
    // Full form
    expect(screen.getByText('2001:0db8:0000:0000:0000:0000:0000:0001')).toBeInTheDocument();
    // Compressed form
    expect(screen.getByText('2001:db8::1')).toBeInTheDocument();
  });

  it('should show error alert for invalid input', () => {
    render(<IpConverterTab />);
    const input = screen.getByPlaceholderText(t('modules.ipNetwork.converter.placeholder'));
    fireEvent.change(input, { target: { value: 'not-an-ip' } });

    expect(screen.getByText(t('modules.ipNetwork.converter.formatUnknown'))).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should clear results when input is cleared', () => {
    render(<IpConverterTab />);
    const input = screen.getByPlaceholderText(t('modules.ipNetwork.converter.placeholder'));

    // Enter valid IP
    fireEvent.change(input, { target: { value: '192.168.1.1' } });
    expect(screen.getByText('C0A80101')).toBeInTheDocument();

    // Clear input
    fireEvent.change(input, { target: { value: '' } });
    expect(screen.queryByText('C0A80101')).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
