import {
  BankOutlined,
  BarChartOutlined,
  GlobalOutlined,
  LineChartOutlined,
  RobotOutlined,
  ShoppingCartOutlined,
  TagsOutlined,
  TeamOutlined,
} from "@ant-design/icons";
import { Badge, Select } from "antd";
import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
export type UsageOption = "global" | "organization" | "team" | "customer" | "tag" | "agent" | "user-agent-activity";
export interface UsageViewSelectProps {
  value: UsageOption;
  onChange: (value: UsageOption) => void;
  isAdmin: boolean;
  title?: string;
  description?: string;
  "data-id"?: string;
}
interface OptionConfig {
  value: UsageOption;
  label: string;
  description: string;
  icon: React.ReactNode;
  adminOnly?: boolean;
  showForAdmin?: string;
  showForNonAdmin?: string;
  descriptionForAdmin?: string;
  descriptionForNonAdmin?: string;
  badgeText?: string;
}
const getOptions = (t: (key: string) => string): OptionConfig[] => [
  {
    value: "global",
    label: t("usagePage.globalUsage"),
    showForAdmin: t("usagePage.globalUsageAdmin"),
    showForNonAdmin: t("usagePage.globalUsageNonAdmin"),
    description: t("usagePage.globalUsageDescAdmin"),
    descriptionForAdmin: t("usagePage.globalUsageDescAdmin"),
    descriptionForNonAdmin: t("usagePage.globalUsageDescNonAdmin"),
    icon: <GlobalOutlined style={{ fontSize: "16px" }} />,
  },
  {
    value: "organization",
    label: t("usagePage.organizationUsage"),
    showForAdmin: t("usagePage.organizationUsageAdmin"),
    showForNonAdmin: t("usagePage.organizationUsageNonAdmin"),
    description: t("usagePage.organizationUsageDescAdmin"),
    descriptionForAdmin: t("usagePage.organizationUsageDescAdmin"),
    descriptionForNonAdmin: t("usagePage.organizationUsageDescNonAdmin"),
    icon: <BankOutlined style={{ fontSize: "16px" }} />,
  },
  {
    value: "team",
    label: t("usagePage.teamUsage"),
    description: t("usagePage.teamUsageDesc"),
    icon: <TeamOutlined style={{ fontSize: "16px" }} />,
  },
  {
    value: "customer",
    label: t("usagePage.customerUsage"),
    description: t("usagePage.customerUsageDesc"),
    icon: <ShoppingCartOutlined style={{ fontSize: "16px" }} />,
    adminOnly: true,
  },
  {
    value: "tag",
    label: t("usagePage.tagUsage"),
    description: t("usagePage.tagUsageDesc"),
    icon: <TagsOutlined style={{ fontSize: "16px" }} />,
    adminOnly: true,
  },
  {
    value: "agent",
    label: t("usagePage.agentUsage"),
    description: t("usagePage.agentUsageDesc"),
    icon: <RobotOutlined style={{ fontSize: "16px" }} />,
    adminOnly: true,
  },
  {
    value: "user-agent-activity",
    label: t("usagePage.userAgentActivity"),
    description: t("usagePage.userAgentActivityDesc"),
    icon: <LineChartOutlined style={{ fontSize: "16px" }} />,
    adminOnly: true,
  },
];
export const UsageViewSelect: React.FC<UsageViewSelectProps> = ({
  value,
  onChange,
  isAdmin,
  title = "Usage View",
  description = "Select the usage data you want to view",
  "data-id": dataId,
}) => {
  const { t } = useLanguage();
  const getFilteredOptions = () => {
    return getOptions(t).filter((option) => {
      if (option.adminOnly && !isAdmin) {
        return false;
      }
      return true;
    }).map((option) => {
      let label = option.label;
      let desc = option.description;
      if (option.showForAdmin && option.showForNonAdmin) {
        label = isAdmin ? option.showForAdmin : option.showForNonAdmin;
      }
      if (option.descriptionForAdmin && option.descriptionForNonAdmin) {
        desc = isAdmin ? option.descriptionForAdmin : option.descriptionForNonAdmin;
      }
      return {
        value: option.value,
        label,
        description: desc,
        icon: option.icon,
        badgeText: option.badgeText,
      };
    });
  };
  const filteredOptions = getFilteredOptions();
  return (
    <div className="w-full" data-id={dataId}>
      <div className="flex flex-wrap items-center justify-start gap-4">
        <div className="flex items-stretch gap-2 min-w-0">
          <div className="flex-shrink-0 flex items-center">
            <BarChartOutlined style={{ fontSize: "32px" }} />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-gray-900 mb-0.5 leading-tight">{t("usagePage.usageView")}</h3>
            <p className="text-xs text-gray-600 leading-tight">{t("usagePage.selectUsageView")}</p>
          </div>
        </div>
        <div className="flex-shrink-0">
          <Select
            value={value}
            onChange={onChange}
            className="w-54 sm:w-64 md:w-72"
            size="large"
            options={filteredOptions.map((opt) => ({
              value: opt.value,
              label: opt.label,
            }))}
            optionRender={(option) => {
              const opt = filteredOptions.find((o) => o.value === option.value);
              if (!opt) return option.label;
              return (
                <div className="flex items-center gap-2 py-1">
                  <div className="flex-shrink-0 mt-0.5">{opt.icon}</div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-gray-900">{opt.label}</div>
                    <div className="text-xs text-gray-600 mt-0.5">{opt.description}</div>
                  </div>
                  {opt.badgeText && (
                    <div className="items-center">
                      <Badge color="blue" count={opt.badgeText} />
                    </div>
                  )}
                </div>
              );
            }}
            labelRender={(props) => {
              const opt = filteredOptions.find((o) => o.value === props.value);
              if (!opt) return props.label;
              return (
                <div className="flex items-center gap-2">
                  <div>{opt.icon}</div>
                  <span className="text-sm">{opt.label}</span>
                </div>
              );
            }}
          />
        </div>
      </div>
    </div>
  );
};
