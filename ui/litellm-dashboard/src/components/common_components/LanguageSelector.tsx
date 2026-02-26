"use client";

import React from "react";
import { Select } from "antd";
import { useLanguage } from "@/contexts/LanguageContext";
import { Locale, locales } from "@/i18n/locales";

const { Option } = Select;

const LanguageSelector: React.FC = () => {
  const { locale, setLocale } = useLanguage();

  const handleChange = (value: Locale) => {
    setLocale(value);
  };

  return (
    <Select
      value={locale}
      onChange={handleChange}
      style={{ width: 150 }}
      size="small"
    >
      {Object.entries(locales).map(([key, { name, flag }]) => (
        <Option key={key} value={key}>
          {flag} {name}
        </Option>
      ))}
    </Select>
  );
};

export default LanguageSelector;
