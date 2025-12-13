import { FormatPainterOutlined } from '@ant-design/icons';
import CodeFormatter from './components/CodeFormatter';
import type { ToolModule } from '../index';

const CodeFormatterModule: ToolModule = {
  id: 'code-formatter',
  name: '代码格式化',
  icon: <FormatPainterOutlined />,
  component: CodeFormatter,
  description: '支持多种语言的代码格式化和压缩工具'
};

export default CodeFormatterModule;
