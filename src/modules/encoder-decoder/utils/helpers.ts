// 格式化文件大小
export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

// 检测图片类型并添加 data: 前缀
export const detectImageType = (base64: string): string => {
  if (base64.startsWith('data:')) return base64;
  
  if (base64.startsWith('/9j/')) {
    return 'data:image/jpeg;base64,' + base64;
  } else if (base64.startsWith('iVBOR')) {
    return 'data:image/png;base64,' + base64;
  } else if (base64.startsWith('R0lGO')) {
    return 'data:image/gif;base64,' + base64;
  } else if (base64.startsWith('UklGR')) {
    return 'data:image/webp;base64,' + base64;
  }
  return 'data:image/png;base64,' + base64;
};

// 复制到剪贴板
export const copyToClipboard = async (text: string): Promise<boolean> => {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
};
