import React, { useEffect, useState } from "react";
import { Card, Form, Button, Tooltip, Typography, Select as AntdSelect, Modal, Radio, Badge, Space } from "antd";
import type { FormInstance } from "antd";
import { Text, TextInput } from "@tremor/react";
import { modelAvailableCall } from "../networking";
import ConnectionErrorDisplay from "./model_connection_test";
import { all_admin_roles } from "@/utils/roles";
import { handleAddAutoRouterSubmit } from "./handle_add_auto_router_submit";
import { fetchAvailableModels, ModelGroup } from "../playground/llm_calls/fetch_models";
import RouterConfigBuilder from "./RouterConfigBuilder";
import ComplexityRouterConfig from "./ComplexityRouterConfig";
import NotificationManager from "../molecules/notifications_manager";
import { ThunderboltOutlined, BranchesOutlined } from "@ant-design/icons";
import { useLanguage } from "@/contexts/LanguageContext";

interface AddAutoRouterTabProps {
  form: FormInstance;
  handleOk: () => void;
  accessToken: string;
  userRole: string;
}

type RouterType = "complexity" | "semantic";

interface ComplexityTiers {
  SIMPLE: string;
  MEDIUM: string;
  COMPLEX: string;
  REASONING: string;
}

const { Title, Link } = Typography;

const AddAutoRouterTab: React.FC<AddAutoRouterTabProps> = ({ form, handleOk, accessToken, userRole }) => {
  const { t } = useLanguage();
  // State for connection testing
  const [isResultModalVisible, setIsResultModalVisible] = useState<boolean>(false);
  const [isTestingConnection, setIsTestingConnection] = useState<boolean>(false);
  const [connectionTestId, setConnectionTestId] = useState<string>("");

  const [modelAccessGroups, setModelAccessGroups] = useState<string[]>([]);
  const [modelInfo, setModelInfo] = useState<ModelGroup[]>([]);
  const [showCustomDefaultModel, setShowCustomDefaultModel] = useState<boolean>(false);
  const [showCustomEmbeddingModel, setShowCustomEmbeddingModel] = useState<boolean>(false);
  
  // Router type state - default to complexity router
  const [routerType, setRouterType] = useState<RouterType>("complexity");
  
  // Semantic router config (existing)
  const [routerConfig, setRouterConfig] = useState<any>(null);
  
  // Complexity router config (new)
  const [complexityTiers, setComplexityTiers] = useState<ComplexityTiers>({
    SIMPLE: "",
    MEDIUM: "",
    COMPLEX: "",
    REASONING: "",
  });

  useEffect(() => {
    const fetchModelAccessGroups = async () => {
      const response = await modelAvailableCall(accessToken, "", "", false, null, true, true);
      setModelAccessGroups(response["data"].map((model: any) => model["id"]));
    };
    fetchModelAccessGroups();
  }, [accessToken]);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const uniqueModels = await fetchAvailableModels(accessToken);
        console.log("Fetched models for auto router:", uniqueModels);
        setModelInfo(uniqueModels);
      } catch (error) {
        console.error("Error fetching model info for auto router:", error);
      }
    };
    loadModels();
  }, [accessToken]);

  const isAdmin = all_admin_roles.includes(userRole);

  // Test connection when button is clicked
  const handleTestConnection = async () => {
    setIsTestingConnection(true);
    setConnectionTestId(`test-${Date.now()}`);
    setIsResultModalVisible(true);
  };

  // Auto router specific form submit handler
  const handleAutoRouterSubmit = () => {
    console.log("Auto router submit triggered!");
    console.log("Router type:", routerType);
    
    const currentFormValues = form.getFieldsValue();
    console.log("Form values:", currentFormValues);

    // Check basic required fields first
    if (!currentFormValues.auto_router_name) {
      NotificationManager.fromBackend(t("models.addModel.autoRouterNameRequired"));
      return;
    }

    // Validation differs based on router type
    if (routerType === "complexity") {
      // Complexity Router validation
      const filledTiers = Object.values(complexityTiers).filter(Boolean);
      if (filledTiers.length === 0) {
        NotificationManager.fromBackend(t("models.addModel.selectAtLeastOneComplexityTierModel"));
        return;
      }

      // For complexity router, use the first non-empty tier as default
      const defaultModel = complexityTiers.MEDIUM || complexityTiers.SIMPLE || complexityTiers.COMPLEX || complexityTiers.REASONING;
      
      // Set form values for complexity router
      form.setFieldsValue({
        custom_llm_provider: "auto_router",
        model: currentFormValues.auto_router_name,
        api_key: "not_required_for_auto_router",
        auto_router_default_model: defaultModel,
      });

      form
        .validateFields(["auto_router_name"])
        .then((values) => {
          console.log("Complexity router validation passed");
          
          // Build the complexity router config
          const submitValues = {
            ...values,
            auto_router_name: currentFormValues.auto_router_name,
            auto_router_default_model: defaultModel,
            // Use special model prefix for complexity router
            model_type: "complexity_router",
            complexity_router_config: {
              tiers: complexityTiers,
            },
            model_access_group: currentFormValues.model_access_group,
          };
          
          console.log("Final submit values:", submitValues);
          handleAddAutoRouterSubmit(submitValues, accessToken, form, handleOk);
        })
        .catch((error) => {
          console.error("Validation failed:", error);
          NotificationManager.fromBackend(t("models.addModel.fillAllRequiredFields"));
        });
        
    } else {
      // Semantic Router validation (existing logic)
      if (!currentFormValues.auto_router_default_model) {
        NotificationManager.fromBackend(t("models.addModel.defaultModelRequired"));
        return;
      }

      form.setFieldsValue({
        custom_llm_provider: "auto_router",
        model: currentFormValues.auto_router_name,
        api_key: "not_required_for_auto_router",
      });

      // Custom validation for router config
      if (!routerConfig || !routerConfig.routes || routerConfig.routes.length === 0) {
        NotificationManager.fromBackend(t("models.addModel.configureAtLeastOneRoute"));
        return;
      }

      // Check if all routes have required fields
      const invalidRoutes = routerConfig.routes.filter(
        (route: any) => !route.name || !route.description || route.utterances.length === 0,
      );

      if (invalidRoutes.length > 0) {
        NotificationManager.fromBackend(
          t("models.addModel.routesMustHaveModelDescriptionUtterance"),
        );
        return;
      }

      form
        .validateFields()
        .then((values) => {
          console.log("Form validation passed, submitting with values:", values);
          const submitValues = {
            ...values,
            auto_router_config: routerConfig,
            model_type: "semantic_router",
          };
          console.log("Final submit values:", submitValues);
          handleAddAutoRouterSubmit(submitValues, accessToken, form, handleOk);
        })
        .catch((error) => {
          console.error("Validation failed:", error);
          const fieldErrors = error.errorFields || [];
          if (fieldErrors.length > 0) {
            const missingFields = fieldErrors.map((field: any) => {
              const fieldName = field.name[0];
              const friendlyNames: { [key: string]: string } = {
                auto_router_name: t("models.addModel.autoRouterName"),
                auto_router_default_model: t("models.addModel.defaultModel"),
                auto_router_embedding_model: t("models.addModel.embeddingModel"),
              };
              return friendlyNames[fieldName] || fieldName;
            });
            NotificationManager.fromBackend(
              `${t("models.addModel.fillFollowingRequiredFields")} ${missingFields.join(", ")}`,
            );
          } else {
            NotificationManager.fromBackend(t("models.addModel.fillAllRequiredFields"));
          }
        });
    }
  };

  return (
    <>
      <Title level={2}>{t("models.addModel.addAutoRouterTitle")}</Title>
      <Text className="text-gray-600 mb-6">
        {t("models.addModel.addAutoRouterDescription")}
      </Text>

      <Card className="mb-4">
        <div className="mb-4">
          <Text className="text-sm font-medium mb-2 block">{t("models.addModel.routerType")}</Text>
          <Radio.Group 
            value={routerType} 
            onChange={(e) => setRouterType(e.target.value)}
            className="w-full"
          >
            <Space direction="vertical" className="w-full">
              <Radio value="complexity" className="w-full">
                <div className="flex items-center gap-2">
                  <ThunderboltOutlined className="text-yellow-500" />
                  <span className="font-medium">{t("models.addModel.complexityRouter")}</span>
                  <Badge 
                    count={t("models.addModel.recommended")}
                    style={{ 
                      backgroundColor: '#52c41a',
                      fontSize: '10px',
                      padding: '0 6px',
                    }} 
                  />
                </div>
                <div className="text-xs text-gray-500 ml-6 mt-1">
                  {t("models.addModel.complexityRouterDescription")}
                  <br />
                  <span className="text-green-600">{t("models.addModel.zeroApiCalls")}</span> ·{" "}
                  <span className="text-green-600">{t("models.addModel.lowLatency")}</span> ·{" "}
                  <span className="text-green-600">{t("models.addModel.noCost")}</span>
                </div>
              </Radio>
              <Radio value="semantic" className="w-full mt-2">
                <div className="flex items-center gap-2">
                  <BranchesOutlined className="text-blue-500" />
                  <span className="font-medium">{t("models.addModel.semanticRouter")}</span>
                </div>
                <div className="text-xs text-gray-500 ml-6 mt-1">
                  {t("models.addModel.semanticRouterDescription")}
                </div>
              </Radio>
            </Space>
          </Radio.Group>
        </div>
      </Card>

      <Card>
        <Form
          form={form}
          onFinish={handleAutoRouterSubmit}
          labelCol={{ span: 10 }}
          wrapperCol={{ span: 16 }}
          labelAlign="left"
        >
          {/* Auto Router Name */}
          <Form.Item
            rules={[{ required: true, message: t("models.addModel.autoRouterNameRequired") }]}
            label={t("models.addModel.autoRouterName")}
            name="auto_router_name"
            tooltip={t("models.addModel.autoRouterNameTooltip")}
            labelCol={{ span: 10 }}
            labelAlign="left"
          >
            <TextInput placeholder={t("models.addModel.autoRouterNamePlaceholder")} />
          </Form.Item>

          {/* Conditional rendering based on router type */}
          {routerType === "complexity" ? (
            /* Complexity Router Configuration */
            <div className="w-full mb-4">
              <ComplexityRouterConfig
                modelInfo={modelInfo}
                value={complexityTiers}
                onChange={(tiers) => {
                  setComplexityTiers(tiers);
                }}
              />
            </div>
          ) : (
            /* Semantic Router Configuration (existing) */
            <>
              {/* Router Configuration Builder */}
              <div className="w-full mb-4">
                <RouterConfigBuilder
                  modelInfo={modelInfo}
                  value={routerConfig}
                  onChange={(config) => {
                    setRouterConfig(config);
                    form.setFieldValue("auto_router_config", config);
                  }}
                />
              </div>

              {/* Auto Router Default Model */}
              <Form.Item
                rules={[{ required: routerType === "semantic", message: t("models.addModel.defaultModelRequired") }]}
                label={t("models.addModel.defaultModel")}
                name="auto_router_default_model"
                tooltip={t("models.addModel.defaultModelTooltip")}
                labelCol={{ span: 10 }}
                labelAlign="left"
              >
                <AntdSelect
                  placeholder={t("models.addModel.selectDefaultModel")}
                  onChange={(value) => {
                    setShowCustomDefaultModel(value === "custom");
                  }}
                  options={[
                    ...Array.from(new Set(modelInfo.map((option) => option.model_group))).map((model_group) => ({
                      value: model_group,
                      label: model_group,
                    })),
                    { value: "custom", label: t("models.addModel.enterCustomModelName") },
                  ]}
                  style={{ width: "100%" }}
                  showSearch={true}
                />
              </Form.Item>

              {/* Auto Router Embedding Model */}
              <Form.Item
                label={t("models.addModel.embeddingModel")}
                name="auto_router_embedding_model"
                tooltip={t("models.addModel.embeddingModelTooltip")}
                labelCol={{ span: 10 }}
                labelAlign="left"
              >
                <AntdSelect
                  value={form.getFieldValue("auto_router_embedding_model")}
                  placeholder={t("models.addModel.selectEmbeddingModelOptional")}
                  onChange={(value) => {
                    setShowCustomEmbeddingModel(value === "custom");
                    form.setFieldValue("auto_router_embedding_model", value);
                  }}
                  options={[
                    ...Array.from(new Set(modelInfo.map((option) => option.model_group))).map((model_group) => ({
                      value: model_group,
                      label: model_group,
                    })),
                    { value: "custom", label: t("models.addModel.enterCustomModelName") },
                  ]}
                  style={{ width: "100%" }}
                  showSearch={true}
                  allowClear
                />
              </Form.Item>
            </>
          )}

          <div className="flex items-center my-4">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="px-4 text-gray-500 text-sm">{t("models.addModel.additionalSettings")}</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Model Access Groups - Admin only */}
          {isAdmin && (
            <Form.Item
              label={t("models.addModel.modelAccessGroup")}
              name="model_access_group"
              className="mb-4"
              tooltip={t("models.addModel.autoRouterModelAccessGroupTooltip")}
            >
              <AntdSelect
                mode="tags"
                showSearch
                placeholder={t("models.addModel.modelAccessGroupPlaceholder")}
                optionFilterProp="children"
                tokenSeparators={[","]}
                options={modelAccessGroups.map((group) => ({
                  value: group,
                  label: group,
                }))}
                maxTagCount="responsive"
                allowClear
              />
            </Form.Item>
          )}

          <div className="flex justify-between items-center mb-4">
            <Tooltip title={t("models.addModel.helpTooltip")}>
              <Typography.Link href="https://github.com/BerriAI/litellm/issues">{t("models.addModel.needHelp")}</Typography.Link>
            </Tooltip>
            <div className="space-x-2">
              <Button onClick={handleTestConnection} loading={isTestingConnection}>
                {t("models.addModel.testConnection")}
              </Button>
              <Button
                type="primary"
                onClick={() => {
                  console.log("Add Auto Router button clicked!");
                  handleAutoRouterSubmit();
                }}
              >
                {t("models.addModel.addAutoRouterButton")}
              </Button>
            </div>
          </div>
        </Form>
      </Card>

      {/* Test Connection Results Modal */}
      <Modal
        title={t("models.addModel.connectionTestResults")}
        open={isResultModalVisible}
        onCancel={() => {
          setIsResultModalVisible(false);
          setIsTestingConnection(false);
        }}
        footer={[
          <Button
            key="close"
            onClick={() => {
              setIsResultModalVisible(false);
              setIsTestingConnection(false);
            }}
          >
            {t("models.addModel.close")}
          </Button>,
        ]}
        width={700}
      >
        {/* Only render the ConnectionErrorDisplay when modal is visible and we have a test ID */}
        {isResultModalVisible && (
          <ConnectionErrorDisplay
            key={connectionTestId}
            formValues={form.getFieldsValue()}
            accessToken={accessToken}
            testMode="chat"
            modelName={form.getFieldValue("auto_router_name")}
            onClose={() => {
              setIsResultModalVisible(false);
              setIsTestingConnection(false);
            }}
            onTestComplete={() => setIsTestingConnection(false)}
          />
        )}
      </Modal>
    </>
  );
};

export default AddAutoRouterTab;
