import React from "react";
import { Radio } from "antd";
import { useLanguage } from "@/contexts/LanguageContext";
import type { ExportScope, EntityType } from "./types";

interface ExportTypeSelectorProps {
  value: ExportScope;
  onChange: (value: ExportScope) => void;
  entityType: EntityType;
}

const ExportTypeSelector: React.FC<ExportTypeSelectorProps> = ({ value, onChange, entityType }) => {
  const { t } = useLanguage();
  const entityLabelMap: Record<EntityType, string> = {
    team: t("usagePage.exportModal.entity.team"),
    tag: t("usagePage.exportModal.entity.tag"),
    organization: t("usagePage.exportModal.entity.organization"),
    customer: t("usagePage.exportModal.entity.customer"),
    agent: t("usagePage.exportModal.entity.agent"),
  };
  const entityLabel = entityLabelMap[entityType];

  return (
    <div>
      <label className="text-sm font-medium text-gray-700 block mb-2">{t("usagePage.exportModal.exportType")}</label>
      <Radio.Group value={value} onChange={(e) => onChange(e.target.value)} className="w-full">
        <div className="space-y-2">
          <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <Radio value="daily" className="mt-0.5" />
            <div className="ml-3 flex-1">
              <div className="font-medium text-sm">{t("usagePage.exportModal.dailyByEntityTitle").replace("{entity}", entityLabel)}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t("usagePage.exportModal.dailyByEntityDesc").replace("{entity}", entityLabel)}</div>
            </div>
          </label>

          <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <Radio value="daily_with_keys" className="mt-0.5" />
            <div className="ml-3 flex-1">
              <div className="font-medium text-sm">{t("usagePage.exportModal.dailyByEntityAndKeyTitle").replace("{entity}", entityLabel)}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t("usagePage.exportModal.dailyByEntityAndKeyDesc").replace("{entity}", entityLabel)}</div>
            </div>
          </label>

          <label className="flex items-start p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
            <Radio value="daily_with_models" className="mt-0.5" />
            <div className="ml-3 flex-1">
              <div className="font-medium text-sm">{t("usagePage.exportModal.dailyByEntityAndModelTitle").replace("{entity}", entityLabel)}</div>
              <div className="text-xs text-gray-500 mt-0.5">{t("usagePage.exportModal.dailyByEntityAndModelDesc")}</div>
            </div>
          </label>
        </div>
      </Radio.Group>
    </div>
  );
};

export default ExportTypeSelector;
