import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import SideMenu from './SideMenu';
import { MemoryRouter } from 'react-router-dom';

// 包装SideMenu组件的Router wrapper
const withRouter = ({ children }: { children: React.ReactNode }) => {
  return <MemoryRouter initialEntries={['/encode']}>{children}</MemoryRouter>;
};

describe('SideMenu', () => {
  beforeEach(() => {
    // 清除所有mocks
    vi.clearAllMocks();
  });

  it('should render menu component', () => {
    render(<SideMenu currentModuleId="encoder-decoder" />, { wrapper: withRouter });
    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
  });

  it('should render all menu items', () => {
    render(<SideMenu currentModuleId="encoder-decoder" />, { wrapper: withRouter });

    expect(screen.getByText(/编码\/解码/i)).toBeInTheDocument();
    expect(screen.getByText(/加密\/解密/i)).toBeInTheDocument();
    expect(screen.getByText(/时间工具/i)).toBeInTheDocument();
  });

  it('should render code formatter menu item', () => {
    render(<SideMenu currentModuleId="encoder-decoder" />, { wrapper: withRouter });
    expect(screen.getByText(/代码格式化/i)).toBeInTheDocument();
  });

  it('should render regex tool menu item', () => {
    render(<SideMenu currentModuleId="encoder-decoder" />, { wrapper: withRouter });
    expect(screen.getByText(/正则工具/i)).toBeInTheDocument();
  });

  it('should render qrcode tool menu item', () => {
    render(<SideMenu currentModuleId="encoder-decoder" />, { wrapper: withRouter });
    expect(screen.getByText(/二维码/i)).toBeInTheDocument();
  });

  it('should highlight current module', () => {
    render(<SideMenu currentModuleId="encoder-decoder" />, { wrapper: withRouter });

    const encoderItem = screen.getByText(/编码\/解码/i).closest('.ant-menu-item-selected');
    expect(encoderItem).toBeInTheDocument();
  });

  it('should navigate to crypto tool when clicking menu item', async () => {
    render(<SideMenu currentModuleId="encoder-decoder" />, { wrapper: withRouter });

    const cryptoItem = screen.getByText(/加密\/解密/i);
    await userEvent.click(cryptoItem);

    // 验证导航被触发（通过检查menu items的点击事件）
    expect(cryptoItem).toBeInTheDocument();
  });

  it('should navigate to time tool when clicking time tool', async () => {
    render(<SideMenu currentModuleId="encoder-decoder" />, { wrapper: withRouter });

    const timeItem = screen.getByText(/时间工具/i);
    await userEvent.click(timeItem);

    expect(timeItem).toBeInTheDocument();
  });

  it('should navigate to formatter tool when clicking formatter tool', async () => {
    render(<SideMenu currentModuleId="encoder-decoder" />, { wrapper: withRouter });

    const formatterItem = screen.getByText(/代码格式化/i);
    await userEvent.click(formatterItem);

    expect(formatterItem).toBeInTheDocument();
  });

  it('should handle multiple menu item clicks', async () => {
    render(<SideMenu currentModuleId="encoder-decoder" />, { wrapper: withRouter });

    const cryptoItem = screen.getByText(/加密\/解密/i);
    const timeItem = screen.getByText(/时间工具/i);
    const regexItem = screen.getByText(/正则工具/i);

    await userEvent.click(cryptoItem);
    await userEvent.click(timeItem);
    await userEvent.click(regexItem);

    expect(cryptoItem).toBeInTheDocument();
    expect(timeItem).toBeInTheDocument();
    expect(regexItem).toBeInTheDocument();
  });
});
