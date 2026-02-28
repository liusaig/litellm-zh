import React from "react";
import { Select } from "antd";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ExportFormat } from "./types";

interface ExportFormatSelectorProps {
  value: ExportFormat;
  onChange: (value: ExportFormat) => void;
}

const ExportFormatSelector: React.FC<ExportFormatSelectorProps> = ({ value, onChange }) => {
  const { t } = useLanguage();
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-2">{t("usagePage.exportModal.format")}</label>
      <Select
        value={value}
        onChange={onChange}
        className="w-full"
        options={[
          {
            value: "csv",
            label: t("usagePage.exportModal.csvOption"),
          },
          {
            value: "json",
            label: t("usagePage.exportModal.jsonOption"),
          },
        ]}
      />
    </div>
  );
};

export default ExportFormatSelector;
