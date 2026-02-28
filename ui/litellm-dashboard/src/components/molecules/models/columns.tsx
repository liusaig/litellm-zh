import { EditOutlined, InfoCircleOutlined, SyncOutlined } from "@ant-design/icons";
import { TrashIcon } from "@heroicons/react/outline";
import { ColumnDef } from "@tanstack/react-table";
import { Badge, Button, Icon } from "@tremor/react";
import { Divider, Flex, Popover, Space, Tooltip, Typography } from "antd";
import { ModelData } from "../../model_dashboard/types";
import { ProviderLogo } from "./ProviderLogo";

const { Text, Title } = Typography;

const formatDate = (value?: string | null): string => {
  if (!value) return "-";
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? "-" : parsed.toLocaleDateString("zh-CN");
};

const formatCnyCost = (value?: number | string | null): string => {
  if (value === null || value === undefined) return "-";
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) return "-";
  return new Intl.NumberFormat("zh-CN", {
    style: "currency",
    currency: "CNY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

const credentialsInfoPopoverContent = (
  <Space direction="vertical" size={12}>
    <Text strong style={{ fontSize: 13 }}>
      Credential types
    </Text>
    <Space direction="vertical" size={8}>
      <Flex align="center" gap={8}>
        <Space direction="vertical">
          <Flex align="center" gap={8}>
            <SyncOutlined style={{ color: "#1890ff" }} />
            <Title level={5} style={{ margin: 0, color: "#1890ff" }}>Reusable</Title>
          </Flex>
          <Text type="secondary">
            Credentials saved in Silinex that can be added to models repeatedly.
          </Text>
        </Space>
      </Flex>
      <Divider size="small" />
      <Flex align="center" gap={8}>
        <Space direction="vertical" size={8}>
          <Flex align="center" gap={8}>
            <EditOutlined style={{ color: "#8c8c8c", fontSize: 14, flexShrink: 0 }} />
            <Title level={5} style={{ margin: 0 }}>Manual</Title>
          </Flex>
          <Text type="secondary">
            Credentials added directly during model creation or defined in the config file.
          </Text>
        </Space>
      </Flex>
    </Space>
  </Space>
);

export const columns = (
  userRole: string,
  userID: string,
  premiumUser: boolean,
  setSelectedModelId: (id: string) => void,
  setSelectedTeamId: (id: string) => void,
  getDisplayModelName: (model: any) => string,
  handleEditClick: (model: any) => void,
  handleRefreshClick: () => void,
  expandedRows: Set<string>,
  setExpandedRows: (expandedRows: Set<string>) => void,
  t: (key: string) => string = (key: string) => key,
): ColumnDef<ModelData>[] => [
    {
      header: () => <span className="text-sm font-semibold">{t("models.columns.modelId")}</span>,
      accessorKey: "model_info.id",
      enableSorting: false,
      size: 130,
      minSize: 80,
      cell: ({ row }) => {
        const model = row.original;
        const modelId = model.model_info.id;
        return (
          <Tooltip title={modelId}>
            <button
              type="button"
              className="text-blue-500 bg-blue-50 hover:bg-blue-100 text-xs cursor-pointer w-full block text-left rounded"
              style={{ fontSize: 14, padding: "1px 8px" }}
              onClick={() => setSelectedModelId(modelId)}
              aria-label={`${t("models.columns.modelId")}: ${modelId}`}
            >
              <Text ellipsis>{modelId}</Text>
            </button>
          </Tooltip>
        );
      },
    },
    {
      header: () => <span className="text-sm font-semibold">{t("models.columns.modelInformation")}</span>,
      accessorKey: "model_name",
      size: 250,
      minSize: 120,
      cell: ({ row }) => {
        const model = row.original;
        const displayName = getDisplayModelName(row.original) || "-";
        const popoverContent = (
          <Space
            direction="vertical"
            size={12}
            style={{ minWidth: 220 }}
          >
            <Flex align="center" gap={8}>
              <ProviderLogo provider={model.provider} />
              <Text
                type="secondary"
                style={{ fontSize: 12 }}
                ellipsis
              >
                {model.provider || "Unknown provider"}
              </Text>
            </Flex>

            <Space direction="vertical" size={6}>
              <Space direction="vertical" size={2} style={{ width: "100%" }}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Public Model Name
                </Text>
                <Text
                  strong
                  style={{ fontSize: 13, maxWidth: 480 }}
                  ellipsis
                  title={displayName}
                >
                  {displayName}
                </Text>
              </Space>

              <Space direction="vertical" size={2}>
                <Text type="secondary" style={{ fontSize: 11 }}>
                  Silinex Model Name
                </Text>
                <Text
                  style={{ fontSize: 13 }}
                  copyable={{ text: model.litellm_model_name || "-" }}
                  ellipsis
                  title={model.litellm_model_name || "-"}
                >
                  {model.litellm_model_name || "-"}
                </Text>
              </Space>
            </Space>
          </Space>
        );

        return (
          <Popover content={popoverContent} placement="right" arrow={{ pointAtCenter: true }} styles={{
            root: {
              maxWidth: 500,
            }
          }}>
            <div className="flex items-start space-x-2 min-w-0 w-full cursor-pointer">
              <div className="flex-shrink-0 mt-0.5">
                {model.provider ? (
                  <ProviderLogo provider={model.provider} />
                ) : (
                  <div className="w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs">-</div>
                )}
              </div>

              <div className="flex flex-col min-w-0 flex-1">
                <Text ellipsis className="text-gray-900" style={{ fontSize: 12, fontWeight: 500, lineHeight: '16px' }}>
                  {displayName}
                </Text>
                <Text ellipsis type="secondary" style={{ fontSize: 12, lineHeight: '16px', marginTop: 2 }}>
                  {model.litellm_model_name || "-"}
                </Text>
              </div>
            </div>
          </Popover>
        );
      },
    },
    {
      header: () => (
        <span className="flex items-center gap-1">
          <span className="text-sm font-semibold">{t("models.columns.credentials")}</span>
          <Popover
            content={credentialsInfoPopoverContent}
            placement="bottom"
            arrow={{ pointAtCenter: true }}
          >
            <InfoCircleOutlined
              className="cursor-pointer text-gray-400 hover:text-gray-600"
              style={{ fontSize: 12 }}
            />
          </Popover>
        </span>
      ),
      accessorKey: "litellm_credential_name",
      enableSorting: false,
      size: 180,
      minSize: 100,
      cell: ({ row }) => {
        const model = row.original;
        const credentialName = model.litellm_params?.litellm_credential_name;
        const isReusable = !!credentialName;

        return (
          <div className="flex items-center space-x-2 min-w-0 w-full">
            {isReusable ? (
              <>
                <SyncOutlined className="flex-shrink-0" style={{ color: "#1890ff", fontSize: 14 }} />
                <span className="text-xs truncate text-blue-600" title={credentialName}>
                  {credentialName}
                </span>
              </>
            ) : (
              <>
                <EditOutlined className="flex-shrink-0" style={{ color: "#8c8c8c", fontSize: 14 }} />
                <span className="text-xs text-gray-500">Manual</span>
              </>
            )}
          </div>
        );
      },
    },
    {
      header: () => <span className="text-sm font-semibold">{t("models.columns.createdBy")}</span>,
      accessorKey: "model_info.created_by",
      sortingFn: "datetime",
      size: 160,
      minSize: 100,
      cell: ({ row }) => {
        const model = row.original;
        const isConfigModel = !model.model_info?.db_model;
        const createdBy = model.model_info.created_by?.trim();
        const createdAt = formatDate(model.model_info.created_at);

        return (
          <div className="flex flex-col min-w-0 w-full">
            {/* Created By - Primary */}
            <div
              className="text-xs font-medium text-gray-900 truncate"
              title={isConfigModel ? "配置文件" : createdBy || "-"}
            >
              {isConfigModel ? "配置文件" : createdBy || "-"}
            </div>
            {/* Created At - Secondary */}
            <div
              className="text-xs text-gray-500 truncate mt-0.5"
              title={isConfigModel ? "-" : createdAt}
            >
              {isConfigModel ? "-" : createdAt}
            </div>
          </div>
        );
      },
    },
    {
      header: () => <span className="text-sm font-semibold">{t("models.columns.updatedAt")}</span>,
      accessorKey: "model_info.updated_at",
      sortingFn: "datetime",
      size: 120,
      minSize: 80,
      cell: ({ row }) => {
        const model = row.original;
        const displayDate = formatDate(model.model_info.updated_at || model.model_info.created_at);
        return (
          <span className="text-xs">
            {displayDate}
          </span>
        );
      },
    },
    {
      header: () => <span className="text-sm font-semibold">{t("models.columns.costs")}</span>,
      accessorKey: "input_cost",
      size: 120,
      minSize: 80,
      cell: ({ row }) => {
        const model = row.original;
        const inputCost = model.input_cost;
        const outputCost = model.output_cost;

        // If both costs are missing or undefined, show "-"
        if (inputCost == null && outputCost == null) {
          return (
            <div className="w-full">
              <span className="text-xs text-gray-400">-</span>
            </div>
          );
        }

        return (
          <Tooltip title="每 1M Tokens 费用">
            <div className="flex flex-col min-w-0 w-full">
              {inputCost != null && <div className="text-xs font-medium text-gray-900 truncate">输入: {formatCnyCost(inputCost)}</div>}
              {outputCost != null && <div className="text-xs text-gray-500 truncate mt-0.5">输出: {formatCnyCost(outputCost)}</div>}
            </div>
          </Tooltip>
        );
      },
    },
    {
      header: () => <span className="text-sm font-semibold">{t("models.columns.teamId")}</span>,
      accessorKey: "model_info.team_id",
      enableSorting: false,
      size: 130,
      minSize: 80,
      cell: ({ row }) => {
        const model = row.original;
        return model.model_info.team_id ? (
          <div className="overflow-hidden w-full">
            <Tooltip title={model.model_info.team_id}>
              <Button
                size="xs"
                variant="light"
                className="font-mono text-blue-500 bg-blue-50 hover:bg-blue-100 text-xs font-normal px-2 py-0.5 text-left overflow-hidden truncate w-full"
                onClick={() => setSelectedTeamId(model.model_info.team_id)}
              >
                {model.model_info.team_id.slice(0, 7)}...
              </Button>
            </Tooltip>
          </div>
        ) : (
          "-"
        );
      },
    },
    {
      header: () => <span className="text-sm font-semibold">{t("models.columns.modelAccessGroup")}</span>,
      accessorKey: "model_info.model_access_group",
      enableSorting: false,
      size: 180,
      minSize: 100,
      cell: ({ row }) => {
        const model = row.original;
        const accessGroups = model.model_info.access_groups;

        if (!accessGroups || accessGroups.length === 0) {
          return "-";
        }

        const modelId = model.model_info.id;
        const isExpanded = expandedRows.has(modelId);
        const shouldShowExpandButton = accessGroups.length > 1;

        const toggleExpanded = () => {
          const newExpanded = new Set(expandedRows);
          if (isExpanded) {
            newExpanded.delete(modelId);
          } else {
            newExpanded.add(modelId);
          }
          setExpandedRows(newExpanded);
        };

        return (
          <div className="flex items-center gap-1 overflow-hidden w-full">
            <Badge size="xs" color="blue" className="text-xs px-1.5 py-0.5 h-5 leading-tight flex-shrink-0">
              {accessGroups[0]}
            </Badge>

            {(isExpanded || (!shouldShowExpandButton && accessGroups.length === 2)) &&
              accessGroups.slice(1).map((group: string, index: number) => (
                <Badge
                  key={index + 1}
                  size="xs"
                  color="blue"
                  className="text-xs px-1.5 py-0.5 h-5 leading-tight flex-shrink-0"
                >
                  {group}
                </Badge>
              ))}

            {shouldShowExpandButton && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleExpanded();
                }}
                className="text-xs text-blue-600 hover:text-blue-800 px-1 py-0.5 rounded hover:bg-blue-50 h-5 leading-tight flex-shrink-0 whitespace-nowrap"
              >
                {isExpanded ? "−" : `+${accessGroups.length - 1}`}
              </button>
            )}
          </div>
        );
      },
    },
    {
      id: "actions",
      header: () => <span className="text-sm font-semibold">{t("models.columns.actions")}</span>,
      size: 60,
      minSize: 40,
      enableResizing: false,
      cell: ({ row }) => {
        const model = row.original;
        const canEditModel = userRole === "Admin" || model.model_info?.created_by === userID;
        const isConfigModel = !model.model_info?.db_model;
        return (
          <div className="flex items-center justify-end gap-2 pr-4">
            {isConfigModel ? (
              <Tooltip title="Config model cannot be deleted on the dashboard. Please delete it from the config file.">
                <Icon icon={TrashIcon} size="sm" className="opacity-50 cursor-not-allowed" />
              </Tooltip>
            ) : (
              <Tooltip title="Delete model">
                <Icon
                  icon={TrashIcon}
                  size="sm"
                  onClick={() => {
                    if (canEditModel) {
                      setSelectedModelId(model.model_info.id);
                    }
                  }}
                  className={!canEditModel ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:text-red-600"}
                />
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];
