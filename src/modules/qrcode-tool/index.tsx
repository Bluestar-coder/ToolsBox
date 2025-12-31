import { QrcodeOutlined } from '@ant-design/icons';
import QRCodeTool from './components/QRCodeTool';
import type { ToolModule } from '../index';

const QRCodeToolModule: ToolModule = {
  id: 'qrcode-tool',
  name: '二维码工具',
  icon: <QrcodeOutlined />,
  component: QRCodeTool,
  description: '二维码生成与识别工具',
};

export default QRCodeToolModule;
