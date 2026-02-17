import { useEffect } from 'react';
import { useEncodingContext } from '../hooks/useEncodingContext';
import { clearSensitiveData } from '../utils/storage';

/**
 * 应用初始化和清理组件
 * 负责清理localStorage中的历史记录等初始化工作
 */
const AppCleanup: React.FC = () => {
  const { setInput, setOutput } = useEncodingContext();

  useEffect(() => {
    // 清理历史记录数据
    localStorage.removeItem('encoderDecoderHistory');

    // 清除已存储的敏感加密数据（一次性迁移）
    clearSensitiveData();

    // 可以在这里添加其他初始化逻辑
    return () => {
      // 清理逻辑
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
};

export default AppCleanup;
