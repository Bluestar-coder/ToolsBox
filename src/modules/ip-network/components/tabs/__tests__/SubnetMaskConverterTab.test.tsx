/**
 * 子网掩码转换工具UI组件测试
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '@/test/utils';
import SubnetMaskConverterTab from '../SubnetMaskConverterTab';

describe('SubnetMaskConverterTab', () => {
  it('应该正确渲染子网掩码转换工具', () => {
    render(<SubnetMaskConverterTab />);
    
    // 检查标题
    expect(screen.getByText('子网掩码转换工具')).toBeInTheDocument();
    
    // 检查输入区域
    expect(screen.getByText('输入参数')).toBeInTheDocument();
    
    // 检查初始计算结果
    expect(screen.getByText('子网掩码信息')).toBeInTheDocument();
    expect(screen.getByText('网络信息')).toBeInTheDocument();
    expect(screen.getByText('子网规划')).toBeInTheDocument();
    expect(screen.getByText('子网掩码推荐')).toBeInTheDocument();
  });

  it('应该正确处理子网掩码输入', async () => {
    render(<SubnetMaskConverterTab />);
    
    // 获取子网掩码输入框
    const subnetMaskInput = screen.getByPlaceholderText(/输入CIDR/);
    
    // 输入新的子网掩码
    fireEvent.change(subnetMaskInput, { target: { value: '16' } });
    
    // 等待计算完成
    await waitFor(() => {
      expect(screen.getByText('255.255.0.0')).toBeInTheDocument();
    });
  });

  it('应该正确处理无效输入', async () => {
    render(<SubnetMaskConverterTab />);
    
    // 获取子网掩码输入框
    const subnetMaskInput = screen.getByPlaceholderText(/输入CIDR/);
    
    // 输入无效的子网掩码
    fireEvent.change(subnetMaskInput, { target: { value: '33' } });
    
    // 等待错误提示
    await waitFor(() => {
      expect(screen.getByText('计算错误')).toBeInTheDocument();
    });
  });
});