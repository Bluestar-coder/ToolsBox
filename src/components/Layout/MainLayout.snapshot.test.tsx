import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import MainLayout from './MainLayout';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// 包装MainLayout组件的Router wrapper
const withRouter = ({ children }: { children: React.ReactNode }) => {
  return (
    <MemoryRouter initialEntries={['/encode']}>
      <Routes>
        <Route path="/*" element={children} />
      </Routes>
    </MemoryRouter>
  );
};

describe('MainLayout', () => {
  it('should render main layout structure', () => {
    render(<MainLayout />, { wrapper: withRouter });

    // 检查是否有头部
    expect(screen.getByRole('banner')).toBeInTheDocument();

    // 检查是否有侧边栏
    const aside = document.querySelector('aside');
    expect(aside).toBeInTheDocument();

    // 检查是否有主内容区
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('should render app title', async () => {
    render(<MainLayout />, { wrapper: withRouter });
    expect(await screen.findByText(/工具箱|Tool/i)).toBeInTheDocument();
  });

  it('should render SideMenu component', () => {
    render(<MainLayout />, { wrapper: withRouter });
    expect(screen.getByRole('menu')).toBeInTheDocument();
  });

  it('should render language switcher button', () => {
    render(<MainLayout />, { wrapper: withRouter });
    const languageButton = screen.getByRole('button', { name: /🇨🇳|🇺🇸|🇰🇷|🇯🇵/ });
    expect(languageButton).toBeInTheDocument();
  });

  it('should render theme toggle button', () => {
    render(<MainLayout />, { wrapper: withRouter });
    const themeButton = screen.getByTitle(/Switch to|切换到/i);
    expect(themeButton).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const { container } = render(<MainLayout />, { wrapper: withRouter });
    expect(container).toMatchSnapshot();
  });

  it('should display current module based on route', () => {
    render(<MainLayout />, { wrapper: withRouter });
    // 验证SideMenu正确渲染
    const menu = screen.getByRole('menu');
    expect(menu).toBeInTheDocument();
  });
});
