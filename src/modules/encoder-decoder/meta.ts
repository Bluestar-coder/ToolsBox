/**
 * Encoder-Decoder模块元数据
 */

import type { ModuleMetadata } from '../types';
import { FileTextOutlined } from '@ant-design/icons';

export const moduleMetadata: ModuleMetadata = {
  id: 'encoder-decoder',
  name: '编码/解码',
  routePath: 'encoder',
  icon: FileTextOutlined,
  component: () => import('./components/EncoderDecoder'),
  subTypes: [
    'base64',
    'url',
    'html',
    'json',
    'base16',
    'base32',
    'base58',
    'utf8',
    'utf16be',
    'utf16le',
    'utf32be',
    'utf32le',
  ],
  description: '各种编码格式的编码和解码工具',
  category: 'converter',
  enabled: true,
};
