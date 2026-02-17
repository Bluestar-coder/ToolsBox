import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@/test/utils';
import GeolocationTab from '../GeolocationTab';

vi.mock('../../../utils/geolocation-api', () => ({
  queryGeolocation: vi.fn(),
  batchQueryGeolocation: vi.fn(),
  queryMyIp: vi.fn(),
}));

import { queryGeolocation, batchQueryGeolocation, queryMyIp } from '../../../utils/geolocation-api';

const mockedQueryGeolocation = vi.mocked(queryGeolocation);
const mockedBatchQueryGeolocation = vi.mocked(batchQueryGeolocation);
const mockedQueryMyIp = vi.mocked(queryMyIp);

describe('GeolocationTab', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render textarea, query button, and query my IP button', () => {
    render(<GeolocationTab />);
    expect(screen.getByPlaceholderText('ipNetwork.geolocation.placeholder')).toBeInTheDocument();
    expect(screen.getByText('ipNetwork.geolocation.query')).toBeInTheDocument();
    expect(screen.getByText('ipNetwork.geolocation.queryMyIp')).toBeInTheDocument();
  });

  it('should show no results and no error initially', () => {
    render(<GeolocationTab />);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('should show error when querying with empty input', async () => {
    render(<GeolocationTab />);
    fireEvent.click(screen.getByText('ipNetwork.geolocation.query'));
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('should query single IP and display results table', async () => {
    mockedQueryGeolocation.mockResolvedValue({
      ip: '8.8.8.8',
      country: 'United States',
      region: 'California',
      city: 'Mountain View',
      isp: 'Google LLC',
      org: 'Google LLC',
      asNumber: 'AS15169 Google LLC',
      status: 'success',
    });

    render(<GeolocationTab />);
    const textarea = screen.getByPlaceholderText('ipNetwork.geolocation.placeholder');
    fireEvent.change(textarea, { target: { value: '8.8.8.8' } });
    fireEvent.click(screen.getByText('ipNetwork.geolocation.query'));

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    expect(mockedQueryGeolocation).toHaveBeenCalledWith('8.8.8.8');
    expect(screen.getAllByText('8.8.8.8').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('California')).toBeInTheDocument();
    expect(screen.getByText('Mountain View')).toBeInTheDocument();
  });

  it('should batch query multiple IPs', async () => {
    mockedBatchQueryGeolocation.mockResolvedValue([
      {
        ip: '8.8.8.8',
        country: 'United States',
        region: 'California',
        city: 'Mountain View',
        isp: 'Google LLC',
        org: 'Google LLC',
        asNumber: 'AS15169',
        status: 'success',
      },
      {
        ip: '1.1.1.1',
        country: 'Australia',
        region: 'Queensland',
        city: 'Brisbane',
        isp: 'Cloudflare',
        org: 'Cloudflare',
        asNumber: 'AS13335',
        status: 'success',
      },
    ]);

    render(<GeolocationTab />);
    const textarea = screen.getByPlaceholderText('ipNetwork.geolocation.placeholder');
    fireEvent.change(textarea, { target: { value: '8.8.8.8\n1.1.1.1' } });
    fireEvent.click(screen.getByText('ipNetwork.geolocation.query'));

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    expect(mockedBatchQueryGeolocation).toHaveBeenCalledWith(['8.8.8.8', '1.1.1.1']);
    expect(screen.getByText('United States')).toBeInTheDocument();
    expect(screen.getByText('Australia')).toBeInTheDocument();
  });

  it('should display private IP warning in results', async () => {
    mockedQueryGeolocation.mockResolvedValue({
      ip: '192.168.1.1',
      country: '',
      region: '',
      city: '',
      isp: '',
      org: '',
      asNumber: '',
      status: 'fail',
      message: 'Private or reserved IP address',
    });

    render(<GeolocationTab />);
    const textarea = screen.getByPlaceholderText('ipNetwork.geolocation.placeholder');
    fireEvent.change(textarea, { target: { value: '192.168.1.1' } });
    fireEvent.click(screen.getByText('ipNetwork.geolocation.query'));

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    expect(screen.getByText('Private or reserved IP address')).toBeInTheDocument();
  });

  it('should handle API error and display error message', async () => {
    mockedQueryGeolocation.mockRejectedValue(new Error('Network error'));

    render(<GeolocationTab />);
    const textarea = screen.getByPlaceholderText('ipNetwork.geolocation.placeholder');
    fireEvent.change(textarea, { target: { value: '8.8.8.8' } });
    fireEvent.click(screen.getByText('ipNetwork.geolocation.query'));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    expect(screen.getByText('Network error')).toBeInTheDocument();
  });

  it('should query my IP and display result', async () => {
    mockedQueryMyIp.mockResolvedValue({
      ip: '203.0.113.1',
      country: 'Japan',
      region: 'Tokyo',
      city: 'Tokyo',
      isp: 'Example ISP',
      org: 'Example Org',
      asNumber: 'AS12345',
      status: 'success',
    });

    render(<GeolocationTab />);
    fireEvent.click(screen.getByText('ipNetwork.geolocation.queryMyIp'));

    await waitFor(() => {
      expect(screen.getByRole('table')).toBeInTheDocument();
    });

    expect(mockedQueryMyIp).toHaveBeenCalled();
    expect(screen.getByText('Japan')).toBeInTheDocument();
    expect(screen.getAllByText('203.0.113.1').length).toBeGreaterThanOrEqual(1);
  });

  it('should show error when too many IPs are entered', async () => {
    const manyIps = Array.from({ length: 21 }, (_, i) => `1.2.3.${i}`).join('\n');

    render(<GeolocationTab />);
    const textarea = screen.getByPlaceholderText('ipNetwork.geolocation.placeholder');
    fireEvent.change(textarea, { target: { value: manyIps } });
    fireEvent.click(screen.getByText('ipNetwork.geolocation.query'));

    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
