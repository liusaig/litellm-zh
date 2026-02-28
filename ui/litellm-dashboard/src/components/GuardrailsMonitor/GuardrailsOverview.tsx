import {
  DownloadOutlined,
  RiseOutlined,
  SafetyOutlined,
  SettingOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import { useQuery } from "@tanstack/react-query";
import { Card, Col, Grid, Title } from "@tremor/react";
import { Button, Spin, Table } from "antd";
import type { ColumnsType } from "antd/es/table";
import React, { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { getGuardrailsUsageOverview } from "@/components/networking";
import { type PerformanceRow } from "./mockData";
import { EvaluationSettingsModal } from "./EvaluationSettingsModal";
import { MetricCard } from "./MetricCard";
import { ScoreChart } from "./ScoreChart";

interface GuardrailsOverviewProps {
  accessToken?: string | null;
  startDate: string;
  endDate: string;
  onSelectGuardrail: (id: string) => void;
}

type SortKey =
  | "failRate"
  | "requestsEvaluated"
  | "avgLatency"
  | "falsePositiveRate"
  | "falseNegativeRate";

const providerColors: Record<string, string> = {
  Bedrock: "bg-orange-100 text-orange-700 border-orange-200",
  "Google Cloud": "bg-sky-100 text-sky-700 border-sky-200",
  Silinex: "bg-indigo-100 text-indigo-700 border-indigo-200",
  Custom: "bg-gray-100 text-gray-600 border-gray-200",
};

function computeMetricsFromRows(data: PerformanceRow[]) {
  const totalRequests = data.reduce((sum, r) => sum + r.requestsEvaluated, 0);
  const totalBlocked = data.reduce(
    (sum, r) => sum + Math.round((r.requestsEvaluated * r.failRate) / 100),
    0
  );
  const passRate =
    totalRequests > 0 ? ((1 - totalBlocked / totalRequests) * 100).toFixed(1) : "0";
  const withLat = data.filter((r) => r.avgLatency != null);
  const avgLatency =
    withLat.length > 0
      ? Math.round(withLat.reduce((sum, r) => sum + (r.avgLatency ?? 0), 0) / withLat.length)
      : 0;
  return { totalRequests, totalBlocked, passRate, avgLatency, count: data.length };
}

export function GuardrailsOverview({
  accessToken = null,
  startDate,
  endDate,
  onSelectGuardrail,
}: GuardrailsOverviewProps) {
  const { t, locale } = useLanguage();
  const tr = (key: string, zh: string, en: string) => {
    const value = t(key);
    if (value !== key) return value;
    return locale === "zh-CN" ? zh : en;
  };
  const [sortBy, setSortBy] = useState<SortKey>("failRate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [evaluationModalOpen, setEvaluationModalOpen] = useState(false);

  const { data: guardrailsData, isLoading: guardrailsLoading, error: guardrailsError } = useQuery({
    queryKey: ["guardrails-usage-overview", startDate, endDate],
    queryFn: () => getGuardrailsUsageOverview(accessToken!, startDate, endDate),
    enabled: !!accessToken,
  });

  const activeData: PerformanceRow[] = guardrailsData?.rows ?? [];
  const metrics = useMemo(() => {
    if (guardrailsData) {
      return {
        totalRequests: guardrailsData.totalRequests ?? 0,
        totalBlocked: guardrailsData.totalBlocked ?? 0,
        passRate: String(guardrailsData.passRate ?? 0),
        avgLatency: activeData.length ? Math.round(activeData.reduce((s, r) => s + (r.avgLatency ?? 0), 0) / activeData.length) : 0,
        count: activeData.length,
      };
    }
    return computeMetricsFromRows(activeData);
  }, [guardrailsData, activeData]);
  const chartData = guardrailsData?.chart;
  const sorted = useMemo(() => {
    return [...activeData].sort((a, b) => {
      const mult = sortDir === "desc" ? -1 : 1;
      const aVal = a[sortBy] ?? 0;
      const bVal = b[sortBy] ?? 0;
      return (Number(aVal) - Number(bVal)) * mult;
    });
  }, [activeData, sortBy, sortDir]);
  const isLoading = guardrailsLoading;
  const error = guardrailsError;

  const columns: ColumnsType<PerformanceRow> = [
    {
      title: tr("guardrailsMonitor.table.guardrail", "护栏", "Guardrail"),
      dataIndex: "name",
      key: "name",
      render: (name: string, row) => (
        <button
          type="button"
          className="text-sm font-medium text-gray-900 hover:text-indigo-600 text-left"
          onClick={() => onSelectGuardrail(row.id)}
        >
          {name}
        </button>
      ),
    },
    {
      title: tr("guardrailsMonitor.table.provider", "提供商", "Provider"),
      dataIndex: "provider",
      key: "provider",
      render: (provider: string) => (
        <span
          className={`inline-flex items-center px-2 py-0.5 text-xs font-medium rounded border ${
            providerColors[provider] ?? providerColors.Custom
          }`}
        >
          {provider}
        </span>
      ),
    },
    {
      title: tr("guardrailsMonitor.table.requests", "请求数", "Requests"),
      dataIndex: "requestsEvaluated",
      key: "requestsEvaluated",
      align: "right",
      sorter: true,
      sortOrder: sortBy === "requestsEvaluated" ? (sortDir === "desc" ? "descend" : "ascend") : null,
      render: (v: number) => v.toLocaleString(),
    },
    {
      title: tr("guardrailsMonitor.table.failRate", "失败率", "Fail Rate"),
      dataIndex: "failRate",
      key: "failRate",
      align: "right",
      sorter: true,
      sortOrder: sortBy === "failRate" ? (sortDir === "desc" ? "descend" : "ascend") : null,
      render: (v: number, row) => (
        <span
          className={
            v > 15 ? "text-red-600" : v > 5 ? "text-amber-600" : "text-green-600"
          }
        >
          {v}%
          {row.trend === "up" && <span className="ml-1 text-xs text-red-400">↑</span>}
          {row.trend === "down" && <span className="ml-1 text-xs text-green-400">↓</span>}
        </span>
      ),
    },
    {
      title: tr("guardrailsMonitor.table.avgLatencyAdded", "平均新增延迟", "Avg. latency added"),
      dataIndex: "avgLatency",
      key: "avgLatency",
      align: "right",
      sorter: true,
      sortOrder: sortBy === "avgLatency" ? (sortDir === "desc" ? "descend" : "ascend") : null,
      render: (v?: number) => (
        <span
          className={
            v == null ? "text-gray-400" : v > 150 ? "text-red-600" : v > 50 ? "text-amber-600" : "text-green-600"
          }
        >
          {v != null ? `${v}ms` : "—"}
        </span>
      ),
    },
    {
      title: tr("guardrailsMonitor.table.status", "状态", "Status"),
      dataIndex: "status",
      key: "status",
      align: "center",
      render: (status: string) => (
        <span className="inline-flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              status === "healthy"
                ? "bg-green-500"
                : status === "warning"
                  ? "bg-amber-500"
                  : "bg-red-500"
            }`}
          />
          <span className="text-xs text-gray-600 capitalize">
            {status === "healthy"
              ? tr("guardrailsMonitor.status.healthy", "健康", "Healthy")
              : status === "warning"
                ? tr("guardrailsMonitor.status.warning", "警告", "Warning")
                : status === "critical"
                  ? tr("guardrailsMonitor.status.critical", "严重", "Critical")
                  : status}
          </span>
        </span>
      ),
    },
  ];

  const sortableKeys: SortKey[] = ["failRate", "requestsEvaluated", "avgLatency"];
  const handleTableChange = (_pagination: unknown, _filters: unknown, sorter: unknown) => {
    const s = sorter as { field?: keyof PerformanceRow; order?: string };
    if (s?.field && sortableKeys.includes(s.field as SortKey)) {
      setSortBy(s.field as SortKey);
      setSortDir(s.order === "ascend" ? "asc" : "desc");
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <SafetyOutlined className="text-lg text-indigo-500" />
            <h1 className="text-xl font-semibold text-gray-900">
              {tr("guardrailsMonitor.title", "护栏监控", "Guardrails Monitor")}
            </h1>
          </div>
          <p className="text-sm text-gray-500">
            {tr(
              "guardrailsMonitor.subtitle",
              "监控所有请求中的护栏表现",
              "Monitor guardrail performance across all requests"
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            type="default"
            icon={<DownloadOutlined />}
            title={tr("guardrailsMonitor.actions.comingSoon", "即将上线", "Coming soon")}
          >
            {tr("guardrailsMonitor.actions.exportData", "导出数据", "Export Data")}
          </Button>
        </div>
      </div>

      <Grid numItems={2} numItemsLg={5} className="gap-4 mb-6 items-stretch">
        <Col className="flex flex-col">
          <MetricCard
            label={tr("guardrailsMonitor.metrics.totalEvaluations", "总评估次数", "Total Evaluations")}
            value={metrics.totalRequests.toLocaleString()}
          />
        </Col>
        <Col className="flex flex-col">
          <MetricCard
            label={tr("guardrailsMonitor.metrics.blockedRequests", "拦截请求", "Blocked Requests")}
            value={metrics.totalBlocked.toLocaleString()}
            valueColor="text-red-600"
            icon={<WarningOutlined className="text-red-400" />}
          />
        </Col>
        <Col className="flex flex-col">
          <MetricCard
            label={tr("guardrailsMonitor.metrics.passRate", "通过率", "Pass Rate")}
            value={`${metrics.passRate}%`}
            valueColor="text-green-600"
            icon={<RiseOutlined className="text-green-400" />}
          />
        </Col>
        <Col className="flex flex-col">
          <MetricCard
            label={tr("guardrailsMonitor.metrics.avgLatencyAdded", "平均新增延迟", "Avg. latency added")}
            value={`${metrics.avgLatency}ms`}
            valueColor={
              metrics.avgLatency > 150
                ? "text-red-600"
                : metrics.avgLatency > 50
                  ? "text-amber-600"
                  : "text-green-600"
            }
          />
        </Col>
        <Col className="flex flex-col">
          <MetricCard
            label={tr("guardrailsMonitor.metrics.activeGuardrails", "生效中的护栏", "Active Guardrails")}
            value={metrics.count}
          />
        </Col>
      </Grid>

      <div className="mb-6">
        <ScoreChart data={chartData} />
      </div>

      <Card className="bg-white border border-gray-200 rounded-lg">
        {(isLoading || error) && (
          <div className="px-6 py-4 border-b border-gray-200 flex items-center gap-2">
            {isLoading && <Spin size="small" />}
            {error && (
              <span className="text-sm text-red-600">
                {tr("guardrailsMonitor.error.loadData", "加载数据失败，请重试。", "Failed to load data. Try again.")}
              </span>
            )}
          </div>
        )}
        <div className="px-6 py-4 border-b border-gray-200 flex items-start justify-between gap-4">
          <div>
            <Title className="text-base font-semibold text-gray-900">
              {tr("guardrailsMonitor.table.title", "护栏表现", "Guardrail Performance")}
            </Title>
            <p className="text-xs text-gray-500 mt-0.5">
              {tr(
                "guardrailsMonitor.table.description",
                "点击护栏可查看详情、日志与配置",
                "Click a guardrail to view details, logs, and configuration"
              )}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              type="default"
              icon={<SettingOutlined />}
              onClick={() => setEvaluationModalOpen(true)}
              title={tr("guardrailsMonitor.actions.evaluationSettings", "评估设置", "Evaluation settings")}
            />
          </div>
        </div>
        <Table
          columns={columns}
          dataSource={sorted}
          rowKey="id"
          pagination={false}
          loading={isLoading}
          onChange={handleTableChange}
          locale={
            activeData.length === 0 && !isLoading
              ? { emptyText: tr("guardrailsMonitor.table.noData", "该时间段暂无数据", "No data for this period") }
              : undefined
          }
          onRow={(row) => ({
            onClick: () => onSelectGuardrail(row.id),
            style: { cursor: "pointer" },
          })}
        />
      </Card>

      <EvaluationSettingsModal
        open={evaluationModalOpen}
        onClose={() => setEvaluationModalOpen(false)}
        accessToken={accessToken}
      />
    </div>
  );
}
