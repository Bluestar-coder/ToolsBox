import { GlobalOutlined } from '@ant-design/icons';
import IpNetworkTool from './components/IpNetworkTool';
import type { ToolModule } from '../index';

const IpNetworkModule: ToolModule = {
  id: 'ip-network',
  name: 'IP/网络工具',
  icon: <GlobalOutlined />,
  component: IpNetworkTool,
  description: 'IP 地址转换、CIDR 计算、子网划分、归属地查询、端口速查',
};

export default IpNetworkModule;
