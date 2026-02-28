import { useTeams } from "@/app/(dashboard)/hooks/teams/useTeams";
import { useLanguage } from "@/contexts/LanguageContext";
import { createTeamAliasMap } from "@/utils/teamUtils";
import { Button, Modal, Skeleton } from "antd";
import React, { useMemo, useState } from "react";
import NotificationsManager from "../molecules/notifications_manager";
import ExportFormatSelector from "./ExportFormatSelector";
import ExportSummary from "./ExportSummary";
import ExportTypeSelector from "./ExportTypeSelector";
import type { EntityUsageExportModalProps, ExportFormat, ExportScope } from "./types";
import { handleExportCSV, handleExportJSON } from "./utils";

const EntityUsageExportModal: React.FC<EntityUsageExportModalProps> = ({
  isOpen,
  onClose,
  entityType,
  spendData,
  dateRange,
  timeRangeType,
  selectedFilters,
  customTitle,
}) => {
  const { t } = useLanguage();
  const [exportFormat, setExportFormat] = useState<ExportFormat>("csv");
  const [exportScope, setExportScope] = useState<ExportScope>("daily");
  const [isExporting, setIsExporting] = useState(false);
  const { data: teams, isLoading: isLoadingTeams } = useTeams();

  const entityLabel = entityType.charAt(0).toUpperCase() + entityType.slice(1);
  const modalTitle = customTitle || `Export ${entityLabel} Usage`;

  // Cache team alias map using useMemo
  const teamAliasMap = useMemo(() => createTeamAliasMap(teams), [teams]);
  const handleExport = async (format?: ExportFormat) => {
    const formatToUse = format || exportFormat;
    setIsExporting(true);
    try {
      if (formatToUse === "csv") {
        handleExportCSV(spendData, exportScope, entityLabel, entityType, dateRange, timeRangeType, teamAliasMap);
        NotificationsManager.success(t("usagePage.exportModal.exportSuccessCsv"));
      } else {
        handleExportJSON(
          spendData,
          exportScope,
          entityLabel,
          entityType,
          dateRange,
          timeRangeType,
          selectedFilters,
          teamAliasMap,
        );
        NotificationsManager.success(t("usagePage.exportModal.exportSuccessJson"));
      }
      onClose();
    } catch (error) {
      console.error("Error exporting data:", error);
      NotificationsManager.fromBackend(t("usagePage.exportModal.exportFailed"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Modal
      title={<span className="text-base font-semibold">{modalTitle}</span>}
      open={isOpen}
      onCancel={onClose}
      footer={null}
      width={480}
    >
      <div className="space-y-5 py-2">
        {isLoadingTeams ? (
          <Skeleton active />
        ) : (
          <>
            <ExportSummary dateRange={dateRange} selectedFilters={selectedFilters} />
            <ExportTypeSelector value={exportScope} onChange={setExportScope} entityType={entityType} />
            <ExportFormatSelector value={exportFormat} onChange={setExportFormat} />
          </>
        )}
        {isLoadingTeams ? (
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Skeleton.Button active />
            <Skeleton.Button active />
          </div>
        ) : (
          <div className="flex items-center justify-end gap-2 pt-4 border-t">
            <Button variant="outlined" onClick={onClose} disabled={isExporting}>
              {t("usagePage.exportModal.cancel")}
            </Button>
            <Button
              onClick={() => handleExport()}
              loading={isExporting || isLoadingTeams}
              disabled={isExporting || isLoadingTeams}
              type="primary"
            >
              {isExporting
                ? t("usagePage.exportModal.exporting")
                : exportFormat === "csv"
                  ? t("usagePage.exportModal.exportCsv")
                  : t("usagePage.exportModal.exportJson")}
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};

export default EntityUsageExportModal;
