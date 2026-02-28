import { InfoCircleOutlined } from "@ant-design/icons";
import { Select as AntdSelect, Card, Divider, Space, Tooltip, Typography } from "antd";
import React from "react";
import { ModelGroup } from "../playground/llm_calls/fetch_models";
import { useLanguage } from "@/contexts/LanguageContext";

const { Text } = Typography;

interface ComplexityTiers {
  SIMPLE: string;
  MEDIUM: string;
  COMPLEX: string;
  REASONING: string;
}

interface ComplexityRouterConfigProps {
  modelInfo: ModelGroup[];
  value: ComplexityTiers;
  onChange: (tiers: ComplexityTiers) => void;
}

const ComplexityRouterConfig: React.FC<ComplexityRouterConfigProps> = ({ modelInfo, value, onChange }) => {
  const { t } = useLanguage();
  const TIER_DESCRIPTIONS: Record<keyof ComplexityTiers, { label: string; description: string; examples: string }> = {
    SIMPLE: {
      label: t("models.addModel.simple"),
      description: t("models.addModel.tierDescriptionSimple"),
      examples: t("models.addModel.tierExamplesSimple"),
    },
    MEDIUM: {
      label: t("models.addModel.medium"),
      description: t("models.addModel.tierDescriptionMedium"),
      examples: t("models.addModel.tierExamplesMedium"),
    },
    COMPLEX: {
      label: t("models.addModel.complex"),
      description: t("models.addModel.tierDescriptionComplex"),
      examples: t("models.addModel.tierExamplesComplex"),
    },
    REASONING: {
      label: t("models.addModel.reasoning"),
      description: t("models.addModel.tierDescriptionReasoning"),
      examples: t("models.addModel.tierExamplesReasoning"),
    },
  };
  // Prepare model options for dropdowns
  const modelOptions = modelInfo.map((model) => ({
    value: model.model_group,
    label: model.model_group,
  }));

  const handleTierChange = (tier: keyof ComplexityTiers, model: string) => {
    onChange({
      ...value,
      [tier]: model,
    });
  };

  return (
    <div className="w-full max-w-none">
      <Space align="center" style={{ marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>
          {t("models.addModel.complexityTierConfiguration")}
        </Typography.Title>
        <Tooltip title={t("models.addModel.complexityTierConfigurationTooltip")}>
          <InfoCircleOutlined className="text-gray-400" />
        </Tooltip>
      </Space>

      <Text type="secondary" style={{ display: "block", marginBottom: 24 }}>
        {t("models.addModel.complexityRouterLongDescription")}
      </Text>

      <Card>
        {(Object.keys(TIER_DESCRIPTIONS) as Array<keyof ComplexityTiers>).map((tier, index) => {
          const tierInfo = TIER_DESCRIPTIONS[tier];
          return (
            <div key={tier}>
              {index > 0 && <Divider style={{ margin: "16px 0" }} />}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Text strong style={{ fontSize: 16 }}>
                    {tierInfo.label} {t("models.addModel.tier")}
                  </Text>
                  <Tooltip title={tierInfo.description}>
                    <InfoCircleOutlined className="text-gray-400" />
                  </Tooltip>
                </div>
                <Text type="secondary" style={{ display: "block", marginBottom: 8, fontSize: 12 }}>
                  {t("models.addModel.examplesPrefix")} {tierInfo.examples}
                </Text>
                <AntdSelect
                  value={value[tier]}
                  onChange={(model) => handleTierChange(tier, model)}
                  placeholder={t("models.addModel.selectModelForTierQueries").replace("{tier}", tierInfo.label.toLowerCase())}
                  showSearch
                  style={{ width: "100%" }}
                  options={modelOptions}
                />
              </div>
            </div>
          );
        })}
      </Card>

      <Divider />

      <Card className="bg-gray-50">
        <Text strong style={{ display: "block", marginBottom: 8 }}>
          {t("models.addModel.howClassificationWorks")}
        </Text>
        <Text type="secondary" style={{ fontSize: 13 }}>
          {t("models.addModel.classificationDimensionsDescription")}
        </Text>
        <ul style={{ marginTop: 8, marginBottom: 0, paddingLeft: 20, fontSize: 13, color: "rgba(0, 0, 0, 0.45)" }}>
          <li>
            <strong>SIMPLE</strong>: Score &lt; 0.15
          </li>
          <li>
            <strong>MEDIUM</strong>: Score 0.15 - 0.35
          </li>
          <li>
            <strong>COMPLEX</strong>: Score 0.35 - 0.60
          </li>
          <li>
            <strong>REASONING</strong>: Score &gt; 0.60 (or 2+ reasoning markers)
          </li>
        </ul>
      </Card>
    </div>
  );
};

export default ComplexityRouterConfig;
