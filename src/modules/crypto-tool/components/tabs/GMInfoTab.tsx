import React from 'react';
import { Card } from 'antd';

const GMInfoTab: React.FC = () => {
  return (
    <Card size="small" title="国密算法说明" style={{ marginBottom: 16 }}>
      <div style={{ lineHeight: 2 }}>
        <h4 style={{ color: '#1890ff', marginBottom: 8 }}>✅ 已实现的国密算法</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: 8, border: '1px solid #d9d9d9', textAlign: 'left' }}>算法</th>
              <th style={{ padding: 8, border: '1px solid #d9d9d9', textAlign: 'left' }}>类型</th>
              <th style={{ padding: 8, border: '1px solid #d9d9d9', textAlign: 'left' }}>说明</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: 8, border: '1px solid #d9d9d9', fontWeight: 500, color: '#722ed1' }}>SM2</td>
              <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>非对称加密</td>
              <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>椭圆曲线公钥密码，支持加密/解密、签名/验签</td>
            </tr>
            <tr>
              <td style={{ padding: 8, border: '1px solid #d9d9d9', fontWeight: 500, color: '#722ed1' }}>SM3</td>
              <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>哈希算法</td>
              <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>密码杂凑算法，256位输出，安全性与 SHA-256 相当</td>
            </tr>
            <tr>
              <td style={{ padding: 8, border: '1px solid #d9d9d9', fontWeight: 500, color: '#722ed1' }}>SM4</td>
              <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>对称加密</td>
              <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>分组密码，128位密钥/分组，支持 ECB/CBC 模式</td>
            </tr>
            <tr>
              <td style={{ padding: 8, border: '1px solid #d9d9d9', fontWeight: 500, color: '#722ed1' }}>ZUC</td>
              <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>流密码</td>
              <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>祖冲之算法，128位密钥/IV，用于 3GPP LTE 加密（EEA3/EIA3）</td>
            </tr>
          </tbody>
        </table>

        <h4 style={{ color: '#faad14', marginBottom: 8 }}>⚠️ 无法实现的国密算法</h4>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 16 }}>
          <thead>
            <tr style={{ backgroundColor: '#f0f0f0' }}>
              <th style={{ padding: 8, border: '1px solid #d9d9d9', textAlign: 'left' }}>算法</th>
              <th style={{ padding: 8, border: '1px solid #d9d9d9', textAlign: 'left' }}>类型</th>
              <th style={{ padding: 8, border: '1px solid #d9d9d9', textAlign: 'left' }}>无法实现原因</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td style={{ padding: 8, border: '1px solid #d9d9d9', fontWeight: 500, color: '#ff4d4f' }}>SM1</td>
              <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>对称加密</td>
              <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>
                <strong>算法不公开</strong>，只能通过专用硬件芯片实现（加密卡、USB Key、智能IC卡等），无法用纯软件实现
              </td>
            </tr>
            <tr>
              <td style={{ padding: 8, border: '1px solid #d9d9d9', fontWeight: 500, color: '#ff4d4f' }}>SM9</td>
              <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>标识密码</td>
              <td style={{ padding: 8, border: '1px solid #d9d9d9' }}>
                基于标识的密码算法（IBC），目前 <strong>JavaScript 生态中没有成熟的开源实现</strong>
              </td>
            </tr>
          </tbody>
        </table>

        <h4 style={{ color: '#52c41a', marginBottom: 8 }}>📚 国密算法标准</h4>
        <ul style={{ paddingLeft: 20, margin: 0 }}>
          <li><strong>SM1</strong>: GM/T 0002-2012 (硬件实现)</li>
          <li><strong>SM2</strong>: GM/T 0003-2012 椭圆曲线公钥密码算法</li>
          <li><strong>SM3</strong>: GM/T 0004-2012 密码杂凑算法</li>
          <li><strong>SM4</strong>: GM/T 0002-2012 分组密码算法</li>
          <li><strong>SM9</strong>: GM/T 0044-2016 标识密码算法</li>
          <li><strong>ZUC</strong>: GM/T 0001-2012 祖冲之序列密码算法 (用于4G/5G通信)</li>
        </ul>

        <div style={{ marginTop: 16, padding: 12, backgroundColor: '#fffbe6', borderRadius: 4, border: '1px solid #ffe58f' }}>
          <strong>💡 提示：</strong>如需使用 SM1 或 SM9，请联系专业的密码设备供应商获取硬件支持或专业软件库。
        </div>
      </div>
    </Card>
  );
};

export default GMInfoTab;
