import { ApiOutlined } from '@ant-design/icons';
import HttpDebugTool from './components/HttpDebugTool';
import type { ToolModule } from '../index';

const HttpDebugModule: ToolModule = {
  id: 'http-debug',
  name: '网络调试',
  icon: <ApiOutlined />,
  component: HttpDebugTool,
  description: 'HTTP 接口调试与 WebSocket 调试工具',
};

export default HttpDebugModule;
