import { formatNumberWithCommas } from "@/utils/dataUtils";
import { BarChart, Card, Title } from "@tremor/react";
import { Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { TopModelData } from "../types";

interface KeyModelUsageViewProps {
  topModels: TopModelData[];
}

const VISIBLE_ROWS = 5;
// antd Table with size="small" has a row height of ~39px
const ANTD_SMALL_TABLE_ROW_HEIGHT = 39;

const KeyModelUsageView: React.FC<KeyModelUsageViewProps> = ({ topModels }) => {
  const { t } = useLanguage();
  const [viewMode, setViewMode] = useState<"chart" | "table">("table");

  const columns: ColumnsType<TopModelData> = useMemo(() => [
    {
      title: t("usagePage.keyModelUsage.model"),
      dataIndex: "model",
      key: "model",
      render: (value: string) => value || "-",
    },
    {
      title: t("usagePage.keyModelUsage.spend"),
      dataIndex: "spend",
      key: "spend",
      render: (value: number) => `¥${formatNumberWithCommas(value)}`,
    },
    {
      title: t("usagePage.keyModelUsage.successful"),
      dataIndex: "successful_requests",
      key: "successful_requests",
      render: (value: number) => <span className="text-green-600">{value?.toLocaleString() || 0}</span>,
    },
    {
      title: t("usagePage.keyModelUsage.failed"),
      dataIndex: "failed_requests",
      key: "failed_requests",
      render: (value: number) => <span className="text-red-600">{value?.toLocaleString() || 0}</span>,
    },
    {
      title: t("usagePage.keyModelUsage.tokens"),
      dataIndex: "tokens",
      key: "tokens",
      render: (value: number) => value?.toLocaleString() || 0,
    },
  ], [t]);

  if (topModels.length === 0) {
    return null;
  }

  return (
    <Card className="mt-4">
      <div className="flex justify-between items-center mb-3">
        <Title>{t("usagePage.keyModelUsage.title")}</Title>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode("table")}
            className={`px-3 py-1 text-sm rounded-md ${viewMode === "table" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
          >
            {t("usagePage.keyModelUsage.table")}
          </button>
          <button
            onClick={() => setViewMode("chart")}
            className={`px-3 py-1 text-sm rounded-md ${viewMode === "chart" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-700"}`}
          >
            {t("usagePage.keyModelUsage.chart")}
          </button>
        </div>
      </div>
      {viewMode === "chart" ? (
        <div className="max-h-[234px] overflow-y-auto">
          <BarChart
            style={{ height: topModels.length * 40 }}
            data={topModels.map((m) => ({ key: m.model, spend: m.spend }))}
            index="key"
            categories={["spend"]}
            colors={["cyan"]}
            valueFormatter={(value) => `¥${formatNumberWithCommas(value)}`}
            layout="vertical"
            yAxisWidth={180}
            tickGap={5}
            showLegend={false}
          />
        </div>
      ) : (
        <Table
          columns={columns}
          dataSource={topModels}
          rowKey="model"
          size="small"
          pagination={false}
          scroll={
            topModels.length > VISIBLE_ROWS
              ? { y: VISIBLE_ROWS * ANTD_SMALL_TABLE_ROW_HEIGHT }
              : undefined
          }
        />
      )}
    </Card>
  );
};

export default KeyModelUsageView;