import React from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button, Typography, Tooltip, Space, Divider, Flex } from "antd";
import {
  ArrowLeftOutlined,
  SyncOutlined,
  DeleteOutlined,
  PlusOutlined,
  UserOutlined,
  MailOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  ThunderboltOutlined,
  SafetyCertificateOutlined,
} from "@ant-design/icons";
import LabeledField from "../common_components/LabeledField";

const { Title, Text } = Typography;

export interface KeyInfoData {
  keyName: string;
  keyId: string;
  userId: string;
  userEmail: string;
  createdBy: string;
  createdAt: string;
  lastUpdated: string;
  lastActive: string;
}

interface KeyInfoHeaderProps {
  data: KeyInfoData;
  onBack?: () => void;
  onCreateNew?: () => void;
  onRegenerate?: () => void;
  onDelete?: () => void;
  canModifyKey?: boolean;
  backButtonText?: string;
  regenerateDisabled?: boolean;
  regenerateTooltip?: string;
}

export function KeyInfoHeader({
  data,
  onBack,
  onCreateNew,
  onRegenerate,
  onDelete,
  canModifyKey = true,
  backButtonText = "Back to Keys",
  regenerateDisabled = false,
  regenerateTooltip,
}: KeyInfoHeaderProps) {
  // i18n hook
  const { t } = useLanguage();
  return (
    <div>
      {onCreateNew && (
        <div style={{ marginBottom: 16 }}>
          <Button type="primary" icon={<PlusOutlined />} onClick={onCreateNew}>
            {t("keyDetail.header.createNewKey")}
          </Button>
        </div>
      )}

      <div style={{ marginBottom: 16 }}>
        <Button type="text" icon={<ArrowLeftOutlined />} onClick={onBack}>
          {t("keyDetail.header.backToKeys")}
        </Button>
      </div>

      <Flex justify="space-between" align="start" style={{ marginBottom: 20 }}>
        <div>
          <Title level={3} copyable={{ tooltips: [t("keyDetail.header.copyKeyAlias"), t("keyDetail.header.copied")] }} style={{ margin: 0 }}>
            {data.keyName}
          </Title>
          <Text type="secondary" copyable={{ text: data.keyId, tooltips: [t("keyDetail.header.copyKeyId"), t("keyDetail.header.copied")] }}>
            {t("keyDetail.header.keyIdLabel")} {data.keyId}
          </Text>
        </div>
        {canModifyKey && (
          <Space>
            <Tooltip title={regenerateTooltip || ""}>
              <span>
                <Button icon={<SyncOutlined />} onClick={onRegenerate} disabled={regenerateDisabled}>
                  {t("keyDetail.header.regenerateKey")}
                </Button>
              </span>
            </Tooltip>
            <Button danger icon={<DeleteOutlined />} onClick={onDelete}>
              {t("keyDetail.header.deleteKey")}
            </Button>
          </Space>
        )}
      </Flex>

      <Flex align="stretch" gap={40} style={{ marginBottom: 40 }}>
        <Space direction="vertical" size={16}>
          <LabeledField label={t("keyDetail.header.userEmail")} value={data.userEmail} icon={<MailOutlined />} />
          <LabeledField
            label={t("keyDetail.header.userId")}
            value={data.userId}
            icon={<UserOutlined />}
            truncate
            copyable
            defaultUserIdCheck
          />
        </Space>

        <Divider type="vertical" style={{ height: "auto" }} />

        <Space direction="vertical" size={16}>
          <LabeledField label={t("keyDetail.header.createdAt")} value={data.createdAt} icon={<CalendarOutlined />} />
          <LabeledField
            label={t("keyDetail.header.createdBy")}
            value={data.createdBy}
            icon={<SafetyCertificateOutlined />}
            truncate
            copyable
            defaultUserIdCheck
          />
        </Space>

        <Divider type="vertical" style={{ height: "auto" }} />

        <Space direction="vertical" size={16}>
          <LabeledField label={t("keyDetail.header.lastUpdated")} value={data.lastUpdated} icon={<ClockCircleOutlined />} />
          <LabeledField label={t("keyDetail.header.lastActive")} value={data.lastActive} icon={<ThunderboltOutlined />} />
        </Space>
      </Flex>
    </div>
  );
}
