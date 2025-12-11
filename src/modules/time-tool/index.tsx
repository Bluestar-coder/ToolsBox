import { ClockCircleOutlined } from '@ant-design/icons';
import TimeTool from './components/TimeTool';
import type { ToolModule } from '../index';

const TimeToolModule: ToolModule = {
  id: 'time-tool',
  name: '时间工具',
  icon: <ClockCircleOutlined />,
  component: TimeTool,
  description: '时间格式转换、时间戳获取、UTC与本地时间转换等功能'
};

export default TimeToolModule;
