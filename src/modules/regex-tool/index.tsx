import { FileSearchOutlined } from '@ant-design/icons';
import RegexTool from './components/RegexTool';
import type { ToolModule } from '../index';

const RegexToolModule: ToolModule = {
  id: 'regex-tool',
  name: '正则工具',
  icon: <FileSearchOutlined />,
  component: RegexTool,
  description: '正则表达式测试、替换和分割工具'
};

export default RegexToolModule;
