import { LockOutlined } from '@ant-design/icons';
import CryptoTool from './components/CryptoTool';
import type { ToolModule } from '../index';

const CryptoToolModule: ToolModule = {
  id: 'crypto-tool',
  name: '加密/解密',
  icon: <LockOutlined />,
  component: CryptoTool,
  description: '支持AES、DES、3DES等多种加密算法的加密解密工具'
};

export default CryptoToolModule;
