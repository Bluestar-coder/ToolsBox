import React from 'react';
import { Dropdown, Button } from 'antd';
import { GlobalOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { supportedLanguages, changeLanguage } from '../i18n';
import type { MenuProps } from 'antd';

const LanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();

  const currentLang = supportedLanguages.find(l => l.code === i18n.language) 
    || supportedLanguages.find(l => i18n.language.startsWith(l.code.split('-')[0]))
    || supportedLanguages[0];

  const items: MenuProps['items'] = supportedLanguages.map(lang => ({
    key: lang.code,
    label: (
      <span>
        {lang.flag} {lang.name}
      </span>
    ),
    onClick: () => changeLanguage(lang.code),
  }));

  return (
    <Dropdown menu={{ items, selectedKeys: [currentLang.code] }} placement="bottomRight">
      <Button type="text" icon={<GlobalOutlined />} size="large">
        {currentLang.flag}
      </Button>
    </Dropdown>
  );
};

export default LanguageSwitcher;
