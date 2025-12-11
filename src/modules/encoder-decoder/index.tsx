import { CodeOutlined } from '@ant-design/icons';
import EncoderDecoder from './components/EncoderDecoder';
import type { ToolModule } from '../index';

const EncoderDecoderModule: ToolModule = {
  id: 'encoder-decoder',
  name: '编码/解码',
  icon: <CodeOutlined />,
  component: EncoderDecoder,
  description: '支持多种编码格式的编码和解码工具'
};

export default EncoderDecoderModule;
