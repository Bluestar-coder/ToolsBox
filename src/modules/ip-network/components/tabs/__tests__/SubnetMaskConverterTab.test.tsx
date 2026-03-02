/**
 * 子网掩码转换工具UI组件测试
 */

import React from 'react';
import { screen, fireEvent, waitFor } from '@testing-library/react';
import { render } from '@/test/utils';
import i18n from '@/i18n';
import SubnetMaskConverterTab from '../SubnetMaskConverterTab';

describe('SubnetMaskConverterTab', () => {
  const t = (key: string, options?: Record<string, unknown>) => i18n.t(key, options);

  it('应该正确渲染子网掩码转换工具', async () => {
    render(<SubnetMaskConverterTab />);
    
    // 检查标题
    expect(screen.getByText(t('modules.ipNetwork.subnetMaskConverter.title'))).toBeInTheDocument();
    
    // 检查输入区域
    expect(screen.getByText(t('modules.ipNetwork.subnetMaskConverter.inputTitle'))).toBeInTheDocument();
    
    // 初始渲染存在150ms防抖，等待结果区域出现
    await waitFor(() => {
      expect(screen.getByText(t('modules.ipNetwork.subnetMaskConverter.subnetMaskInfo'))).toBeInTheDocument();
    });
    expect(screen.getByText(t('modules.ipNetwork.subnetMaskConverter.networkInfo'))).toBeInTheDocument();
    expect(screen.getByText(t('modules.ipNetwork.subnetMaskConverter.subnetPlanning'))).toBeInTheDocument();
    expect(screen.getByText(t('modules.ipNetwork.subnetMaskConverter.subnetMaskRecommendation'))).toBeInTheDocument();
  });

  it('应该正确处理子网掩码输入', async () => {
    render(<SubnetMaskConverterTab />);
    
    // 获取子网掩码输入框
    const subnetMaskInput = screen.getByPlaceholderText(t('modules.ipNetwork.subnetMaskConverter.subnetMaskPlaceholder'));
    
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
    const subnetMaskInput = screen.getByPlaceholderText(t('modules.ipNetwork.subnetMaskConverter.subnetMaskPlaceholder'));
    
    // 输入无效的子网掩码
    fireEvent.change(subnetMaskInput, { target: { value: '33' } });
    
    // 等待错误提示
    await waitFor(() => {
      expect(screen.getByText(t('modules.ipNetwork.subnetMaskConverter.calculateError'))).toBeInTheDocument();
    });
  });
});
