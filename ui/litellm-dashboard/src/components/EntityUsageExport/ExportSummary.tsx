import React from "react";
import type { DateRangePickerValue } from "@tremor/react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ExportSummaryProps {
  dateRange: DateRangePickerValue;
  selectedFilters: string[];
}

const ExportSummary: React.FC<ExportSummaryProps> = ({ dateRange, selectedFilters }) => {
  const { t } = useLanguage();
  const formatDate = (date?: Date) => (date ? `${date.getFullYear()}/${date.getMonth() + 1}/${date.getDate()}` : "");

  return (
    <div className="text-sm text-gray-500">
      {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
      {selectedFilters.length > 0 && ` · ${selectedFilters.length}${t("usagePage.exportModal.filtersAppliedSuffix")}`}
    </div>
  );
};

export default ExportSummary;
