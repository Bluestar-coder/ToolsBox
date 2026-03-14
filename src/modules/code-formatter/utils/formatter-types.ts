export type SupportedLanguage =
  | 'json'
  | 'javascript'
  | 'typescript'
  | 'html'
  | 'css'
  | 'scss'
  | 'less'
  | 'xml'
  | 'sql'
  | 'yaml'
  | 'markdown'
  | 'graphql'
  | 'java'
  | 'python'
  | 'csharp'
  | 'go'
  | 'php';

export type GeneralFormatterLanguage = Exclude<SupportedLanguage, 'json' | 'sql'>;

export interface FormatOptions {
  indentSize: number;
  useTabs: boolean;
}

export const defaultFormatOptions: FormatOptions = {
  indentSize: 2,
  useTabs: false,
};
