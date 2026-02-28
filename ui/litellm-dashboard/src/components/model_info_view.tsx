import { useModelCostMap } from "@/app/(dashboard)/hooks/models/useModelCostMap";
import { useModelHub, useModelsInfo } from "@/app/(dashboard)/hooks/models/useModels";
import { transformModelData } from "@/app/(dashboard)/models-and-endpoints/utils/modelDataTransformer";
import { InfoCircleOutlined } from "@ant-design/icons";
import { ArrowLeftIcon, KeyIcon, RefreshIcon, TrashIcon } from "@heroicons/react/outline";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Card,
  Grid,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Text,
  TextInput,
  Title,
  Button as TremorButton,
} from "@tremor/react";
import { Button, Form, Input, Modal, Select, Tooltip } from "antd";
import { CheckIcon, CopyIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { copyToClipboard as utilCopyToClipboard } from "../utils/dataUtils";
import { formItemValidateJSON, truncateString } from "../utils/textUtils";
import CacheControlSettings from "./add_model/cache_control_settings";
import DeleteResourceModal from "./common_components/DeleteResourceModal";
import EditAutoRouterModal from "./edit_auto_router/edit_auto_router_modal";
import ReuseCredentialsModal from "./model_add/reuse_credentials";
import NotificationsManager from "./molecules/notifications_manager";
import {
  CredentialItem,
  credentialCreateCall,
  credentialGetCall,
  getGuardrailsList,
  modelDeleteCall,
  modelInfoV1Call,
  modelPatchUpdateCall,
  tagListCall,
  testConnectionRequest,
} from "./networking";
import { getProviderLogoAndName } from "./provider_info_helpers";
import NumericalInput from "./shared/numerical_input";
import { Tag } from "./tag_management/types";
import { getDisplayModelName } from "./view_model/model_name_display";

interface ModelInfoViewProps {
  modelId: string;
  onClose: () => void;
  accessToken: string | null;
  userID: string | null;
  userRole: string | null;
  onModelUpdate?: (updatedModel: any) => void;
  modelAccessGroups: string[] | null;
}

export default function ModelInfoView({
  modelId,
  onClose,
  accessToken,
  userID,
  userRole,
  onModelUpdate,
  modelAccessGroups,
}: ModelInfoViewProps) {
  const { t } = useLanguage();
  const tf = (key: string, fallback: string): string => {
    const translated = t(key);
    return translated === key ? fallback : translated;
  };
  const [form] = Form.useForm();
  const [localModelData, setLocalModelData] = useState<any>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isCredentialModalOpen, setIsCredentialModalOpen] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [existingCredential, setExistingCredential] = useState<CredentialItem | null>(null);
  const [showCacheControl, setShowCacheControl] = useState(false);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [isAutoRouterModalOpen, setIsAutoRouterModalOpen] = useState(false);
  const [guardrailsList, setGuardrailsList] = useState<string[]>([]);
  const [tagsList, setTagsList] = useState<Record<string, Tag>>({});

  // Fetch model data using hook
  const { data: rawModelDataResponse, isLoading: isLoadingModel } = useModelsInfo(1, 50, undefined, modelId);
  const { data: modelCostMapData } = useModelCostMap();
  const { data: modelHubData } = useModelHub();

  // Transform the model data
  const getProviderFromModel = (model: string) => {
    if (modelCostMapData !== null && modelCostMapData !== undefined) {
      if (typeof modelCostMapData == "object" && model in modelCostMapData) {
        return modelCostMapData[model]["litellm_provider"];
      }
    }
    return "openai";
  };

  const transformedModelData = useMemo(() => {
    if (!rawModelDataResponse?.data || rawModelDataResponse.data.length === 0) {
      return null;
    }
    const transformed = transformModelData(rawModelDataResponse, getProviderFromModel);
    return transformed.data[0] || null;
  }, [rawModelDataResponse, modelCostMapData]);

  // Keep modelData variable name for backwards compatibility
  const modelData = transformedModelData;

  const canEditModel =
    (userRole === "Admin" || modelData?.model_info?.created_by === userID) && modelData?.model_info?.db_model;
  const isAdmin = userRole === "Admin";
  const isAutoRouter = modelData?.litellm_params?.auto_router_config != null;

  const usingExistingCredential =
    modelData?.litellm_params?.litellm_credential_name != null &&
    modelData?.litellm_params?.litellm_credential_name != undefined;

  // Initialize localModelData from modelData when available
  useEffect(() => {
    if (modelData && !localModelData) {
      let processedModelData = modelData;
      if (!processedModelData.litellm_model_name) {
        processedModelData = {
          ...processedModelData,
          litellm_model_name:
            processedModelData?.litellm_params?.litellm_model_name ??
            processedModelData?.litellm_params?.model ??
            processedModelData?.model_info?.key ??
            null,
        };
      }
      setLocalModelData(processedModelData);

      // Check if cache control is enabled
      if (processedModelData?.litellm_params?.cache_control_injection_points) {
        setShowCacheControl(true);
      }
    }
  }, [modelData, localModelData]);

  useEffect(() => {
    const getExistingCredential = async () => {
      if (!accessToken) return;
      if (usingExistingCredential) return;
      let existingCredentialResponse = await credentialGetCall(accessToken, null, modelId);
      setExistingCredential({
        credential_name: existingCredentialResponse["credential_name"],
        credential_values: existingCredentialResponse["credential_values"],
        credential_info: existingCredentialResponse["credential_info"],
      });
    };

    const getModelInfo = async () => {
      if (!accessToken) return;
      // Only fetch if we don't have modelData yet
      if (modelData) return;
      let modelInfoResponse = await modelInfoV1Call(accessToken, modelId);
      let specificModelData = modelInfoResponse.data[0];
      if (specificModelData && !specificModelData.litellm_model_name) {
        specificModelData = {
          ...specificModelData,
          litellm_model_name:
            specificModelData?.litellm_params?.litellm_model_name ??
            specificModelData?.litellm_params?.model ??
            specificModelData?.model_info?.key ??
            null,
        };
      }
      setLocalModelData(specificModelData);

      // Check if cache control is enabled
      if (specificModelData?.litellm_params?.cache_control_injection_points) {
        setShowCacheControl(true);
      }
    };

    const fetchGuardrails = async () => {
      if (!accessToken) return;
      try {
        const response = await getGuardrailsList(accessToken);
        const guardrailNames = response.guardrails.map((g: { guardrail_name: string }) => g.guardrail_name);
        setGuardrailsList(guardrailNames);
      } catch (error) {
        console.error("Failed to fetch guardrails:", error);
      }
    };

    const fetchTags = async () => {
      if (!accessToken) return;
      try {
        const response = await tagListCall(accessToken);
        setTagsList(response);
      } catch (error) {
        console.error("Failed to fetch tags:", error);
      }
    };

    getExistingCredential();
    getModelInfo();
    fetchGuardrails();
    fetchTags();
  }, [accessToken, modelId]);

  const handleReuseCredential = async (values: any) => {
    if (!accessToken) return;
    let credentialItem = {
      credential_name: values.credential_name,
      model_id: modelId,
      credential_info: {
        custom_llm_provider: localModelData.litellm_params?.custom_llm_provider,
      },
    };
    NotificationsManager.info(t("modelInfo.notifications.storingCredential"));
    let credentialResponse = await credentialCreateCall(accessToken, credentialItem);
    NotificationsManager.success(t("modelInfo.notifications.credentialStored"));
  };

  const handleModelUpdate = async (values: any) => {
    try {
      if (!accessToken) return;
      setIsSaving(true);

      // Parse Silinex extra params from JSON text area
      let parsedExtraParams: Record<string, any> = {};
      try {
        parsedExtraParams = values.litellm_extra_params ? JSON.parse(values.litellm_extra_params) : {};
      } catch (e) {
        NotificationsManager.fromBackend(t("modelInfo.notifications.invalidJsonLitellmParams"));
        setIsSaving(false);
        return;
      }

      let updatedLitellmParams = {
        ...values.litellm_params,
        ...parsedExtraParams,
        model: values.litellm_model_name,
        api_base: values.api_base,
        custom_llm_provider: values.custom_llm_provider,
        organization: values.organization,
        tpm: values.tpm,
        rpm: values.rpm,
        max_retries: values.max_retries,
        timeout: values.timeout,
        stream_timeout: values.stream_timeout,
        input_cost_per_token: values.input_cost / 1_000_000,
        output_cost_per_token: values.output_cost / 1_000_000,
        tags: values.tags,
      };
      if (values.guardrails) {
        updatedLitellmParams.guardrails = values.guardrails;
      }

      // Handle cache control settings
      if (values.cache_control && values.cache_control_injection_points?.length > 0) {
        updatedLitellmParams.cache_control_injection_points = values.cache_control_injection_points;
      } else {
        delete updatedLitellmParams.cache_control_injection_points;
      }

      // Parse the model_info from the form values
      let updatedModelInfo;
      try {
        updatedModelInfo = values.model_info ? JSON.parse(values.model_info) : modelData.model_info;
        // Update access_groups from the form
        if (values.model_access_group) {
          updatedModelInfo = {
            ...updatedModelInfo,
            access_groups: values.model_access_group,
          };
        }
        // Override health_check_model from the form
        if (values.health_check_model !== undefined) {
          updatedModelInfo = {
            ...updatedModelInfo,
            health_check_model: values.health_check_model,
          };
        }
      } catch (e) {
        NotificationsManager.fromBackend(t("modelInfo.notifications.invalidJsonModelInfo"));
        return;
      }

      const updateData = {
        model_name: values.model_name,
        litellm_params: updatedLitellmParams,
        model_info: updatedModelInfo,
      };

      await modelPatchUpdateCall(accessToken, updateData, modelId);

      const updatedModelData = {
        ...localModelData,
        model_name: values.model_name,
        litellm_model_name: values.litellm_model_name,
        litellm_params: updatedLitellmParams,
        model_info: updatedModelInfo,
      };

      setLocalModelData(updatedModelData);

      if (onModelUpdate) {
        onModelUpdate(updatedModelData);
      }

      NotificationsManager.success(t("modelInfo.notifications.modelSettingsUpdated"));
      setIsDirty(false);
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating model:", error);
      NotificationsManager.fromBackend(t("modelInfo.notifications.failedToUpdateModelSettings"));
    } finally {
      setIsSaving(false);
    }
  };

  // Show loading state
  if (isLoadingModel) {
    return (
      <div className="p-4">
        <TremorButton icon={ArrowLeftIcon} variant="light" onClick={onClose} className="mb-4">
          {tf("models.modelInfo.backToModels", "Back to Models")}
        </TremorButton>
        <Text>{tf("models.modelInfo.loading", "Loading...")}</Text>
      </div>
    );
  }

  // Show not found if model is not found
  if (!modelData) {
    return (
      <div className="p-4">
        <TremorButton icon={ArrowLeftIcon} variant="light" onClick={onClose} className="mb-4">
          {tf("models.modelInfo.backToModels", "Back to Models")}
        </TremorButton>
        <Text>{tf("models.modelInfo.notFound", "Model not found")}</Text>
      </div>
    );
  }

  const handleTestConnection = async () => {
    if (!accessToken) return;
    try {
      NotificationsManager.info(tf("models.modelInfo.notifications.testingConnection", "Testing connection..."));
      const response = await testConnectionRequest(
        accessToken,
        {
          custom_llm_provider: localModelData.litellm_params.custom_llm_provider,
          litellm_credential_name: localModelData.litellm_params.litellm_credential_name,
          model: localModelData.litellm_model_name,
        },
        {
          mode: localModelData.model_info?.mode,
        },
        localModelData.model_info?.mode,
      );

      if (response.status === "success") {
        NotificationsManager.success(t("modelInfo.notifications.connectionTestSuccessful"));
      } else {
        throw new Error(response?.result?.error || response?.message || t("modelInfo.notifications.unknownError"));
      }
    } catch (error) {
      if (error instanceof Error) {
        NotificationsManager.error(t("modelInfo.notifications.errorTestingConnection") + " " + truncateString(error.message, 100));
      } else {
        NotificationsManager.error(t("modelInfo.notifications.errorTestingConnection") + " " + String(error));
      }
    }
  };

  const handleDelete = async () => {
    try {
      setDeleteLoading(true);
      if (!accessToken) return;
      await modelDeleteCall(accessToken, modelId);
      NotificationsManager.success(t("modelInfo.notifications.modelDeletedSuccessfully"));

      if (onModelUpdate) {
        onModelUpdate({
          deleted: true,
          model_info: { id: modelId },
        });
      }

      onClose();
    } catch (error) {
      console.error("Error deleting the model:", error);
      NotificationsManager.fromBackend(t("modelInfo.notifications.failedToDeleteModel"));
    } finally {
      setDeleteLoading(false);
      setIsDeleteModalOpen(false);
    }
  };

  const copyToClipboard = async (text: string, key: string) => {
    const success = await utilCopyToClipboard(text);
    if (success) {
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    }
  };

  const handleAutoRouterUpdate = (updatedModel: any) => {
    setLocalModelData(updatedModel);
    if (onModelUpdate) {
      onModelUpdate(updatedModel);
    }
  };
  const isWildcardModel = modelData.litellm_model_name.includes("*");

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-6">
        <div>
          <TremorButton icon={ArrowLeftIcon} variant="light" onClick={onClose} className="mb-4">
            {tf("models.modelInfo.backToModels", "Back to Models")}
          </TremorButton>
          <Title>
            {tf("models.modelInfo.publicModelName", "Public Model Name")}: {getDisplayModelName(modelData)}
          </Title>
          <div className="flex items-center cursor-pointer">
            <Text className="text-gray-500 font-mono">{modelData.model_info.id}</Text>
            <Button
              type="text"
              size="small"
              icon={copiedStates["model-id"] ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
              onClick={() => copyToClipboard(modelData.model_info.id, "model-id")}
              className={`left-2 z-10 transition-all duration-200 ${copiedStates["model-id"]
                ? "text-green-600 bg-green-50 border-green-200"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
            />
          </div>
        </div>
        <div className="flex gap-2">
          <TremorButton
            variant="secondary"
            icon={RefreshIcon}
            onClick={handleTestConnection}
            className="flex items-center gap-2"
            data-testid="test-connection-button"
          >
            {tf("models.modelInfo.testConnection", "Test Connection")}
          </TremorButton>

          <TremorButton
            icon={KeyIcon}
            variant="secondary"
            onClick={() => setIsCredentialModalOpen(true)}
            className="flex items-center"
            disabled={!isAdmin}
            data-testid="reuse-credentials-button"
          >
            {tf("models.modelInfo.reuseCredentials", "Re-use Credentials")}
          </TremorButton>
          <TremorButton
            icon={TrashIcon}
            variant="secondary"
            onClick={() => setIsDeleteModalOpen(true)}
            className="flex items-center text-red-500 border-red-500 hover:text-red-700"
            disabled={!canEditModel}
            data-testid="delete-model-button"
          >
            {tf("models.modelInfo.deleteModel", "Delete Model")}
          </TremorButton>
        </div>
      </div>

      <TabGroup>
        <TabList className="mb-6">
          <Tab>{tf("models.modelInfo.overview", "Overview")}</Tab>
          <Tab>{tf("models.modelInfo.rawJson", "Raw JSON")}</Tab>
        </TabList>

        <TabPanels>
          <TabPanel>
            {/* Overview Grid */}
            <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6 mb-6">
              <Card>
                <Text>{tf("models.modelInfo.provider", "Provider")}</Text>
                <div className="mt-2 flex items-center space-x-2">
                  {modelData.provider && (
                    <img
                      src={getProviderLogoAndName(modelData.provider).logo}
                      alt={`${modelData.provider} logo`}
                      className="w-4 h-4"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        const parent = target.parentElement;
                        if (!parent || !parent.contains(target)) {
                          return;
                        }

                        try {
                          const fallbackDiv = document.createElement("div");
                          fallbackDiv.className =
                            "w-4 h-4 rounded-full bg-gray-200 flex items-center justify-center text-xs";
                          fallbackDiv.textContent = modelData.provider?.charAt(0) || "-";
                          parent.replaceChild(fallbackDiv, target);
                        } catch (error) {
                          console.error("Failed to replace provider logo fallback:", error);
                        }
                      }}
                    />
                  )}
                  <Title>{modelData.provider || tf("models.modelInfo.notSet", "Not Set")}</Title>
                </div>
              </Card>
              <Card>
                <Text>{tf("models.modelInfo.silinexModel", "Silinex Model")}</Text>
                <div className="mt-2 overflow-hidden">
                  <Tooltip title={modelData.litellm_model_name || tf("models.modelInfo.notSet", "Not Set")}>
                    <div className="break-all text-sm font-medium leading-relaxed cursor-pointer">
                      {modelData.litellm_model_name || tf("models.modelInfo.notSet", "Not Set")}
                    </div>
                  </Tooltip>
                </div>
              </Card>
              <Card>
                <Text>{tf("models.modelInfo.pricing", "Pricing")}</Text>
                <div className="mt-2">
                  <Text>{tf("models.modelInfo.input", "Input")}: ¥{modelData.input_cost}/1M tokens</Text>
                  <Text>{tf("models.modelInfo.output", "Output")}: ¥{modelData.output_cost}/1M tokens</Text>
                </div>
              </Card>
            </Grid>

            {/* Audit info shown as a subtle banner below the overview */}
            <div className="mb-6 text-sm text-gray-500 flex items-center gap-x-6">
              <div className="flex items-center gap-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {tf("models.modelInfo.createdAt", "Created At")}{" "}
                {modelData.model_info.created_at
                  ? new Date(modelData.model_info.created_at).toLocaleDateString()
                  : tf("models.modelInfo.notSet", "Not Set")}
              </div>
              <div className="flex items-center gap-x-2">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                  />
                </svg>
                {tf("models.modelInfo.createdBy", "Created By")}{" "}
                {modelData.model_info.created_by || tf("models.modelInfo.notSet", "Not Set")}
              </div>
            </div>

            {/* Settings Card */}
            <Card>
              <div className="flex justify-between items-center mb-4">
                <Title>{tf("models.modelInfo.modelSettings", "Model Settings")}</Title>
                <div className="flex gap-2">
                  {isAutoRouter && canEditModel && !isEditing && (
                    <TremorButton onClick={() => setIsAutoRouterModalOpen(true)} className="flex items-center">
                      {tf("models.modelInfo.editAutoRouter", "Edit Auto Router")}
                    </TremorButton>
                  )}
                  {canEditModel ? (
                    !isEditing && (
                      <TremorButton onClick={() => setIsEditing(true)} className="flex items-center">
                        {tf("models.modelInfo.editSettings", "Edit Settings")}
                      </TremorButton>
                    )
                  ) : (
                    <Tooltip
                      title={tf(
                        "models.modelInfo.editPermissionTooltip",
                        "Only DB models can be edited. You must be an admin or the creator of the model to edit it.",
                      )}
                    >
                      <InfoCircleOutlined />
                    </Tooltip>
                  )}
                </div>
              </div>
              {localModelData ? (
                <Form
                  form={form}
                  onFinish={handleModelUpdate}
                  initialValues={{
                    model_name: localModelData.model_name,
                    litellm_model_name: localModelData.litellm_model_name,
                    api_base: localModelData.litellm_params.api_base,
                    custom_llm_provider: localModelData.litellm_params.custom_llm_provider,
                    organization: localModelData.litellm_params.organization,
                    tpm: localModelData.litellm_params.tpm,
                    rpm: localModelData.litellm_params.rpm,
                    max_retries: localModelData.litellm_params.max_retries,
                    timeout: localModelData.litellm_params.timeout,
                    stream_timeout: localModelData.litellm_params.stream_timeout,
                    input_cost: localModelData.litellm_params.input_cost_per_token
                      ? localModelData.litellm_params.input_cost_per_token * 1_000_000
                      : localModelData.model_info?.input_cost_per_token * 1_000_000 || null,
                    output_cost: localModelData.litellm_params?.output_cost_per_token
                      ? localModelData.litellm_params.output_cost_per_token * 1_000_000
                      : localModelData.model_info?.output_cost_per_token * 1_000_000 || null,
                    cache_control: localModelData.litellm_params?.cache_control_injection_points ? true : false,
                    cache_control_injection_points: localModelData.litellm_params?.cache_control_injection_points || [],
                    model_access_group: Array.isArray(localModelData.model_info?.access_groups)
                      ? localModelData.model_info.access_groups
                      : [],
                    guardrails: Array.isArray(localModelData.litellm_params?.guardrails)
                      ? localModelData.litellm_params.guardrails
                      : [],
                    tags: Array.isArray(localModelData.litellm_params?.tags) ? localModelData.litellm_params.tags : [],
                    health_check_model: isWildcardModel ? localModelData.model_info?.health_check_model : null,
                    litellm_extra_params: JSON.stringify(localModelData.litellm_params || {}, null, 2),
                  }}
                  layout="vertical"
                  onValuesChange={() => setIsDirty(true)}
                >
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <Text className="font-medium">{tf("models.modelInfo.fields.modelName", "模型名称")}</Text>
                        {isEditing ? (
                          <Form.Item name="model_name" className="mb-0">
                            <TextInput placeholder={tf("models.modelInfo.placeholders.modelName", "请输入模型名称")} />
                          </Form.Item>
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded">{localModelData.model_name}</div>
                        )}
                      </div>

                      <div>
                        <Text className="font-medium">{tf("models.modelInfo.fields.silinexModelName", "Silinex 模型名称")}</Text>
                        {isEditing ? (
                          <Form.Item name="litellm_model_name" className="mb-0">
                            <TextInput
                              placeholder={tf("models.modelInfo.placeholders.silinexModelName", "请输入 Silinex 模型名称")}
                            />
                          </Form.Item>
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded">{localModelData.litellm_model_name}</div>
                        )}
                      </div>

                      <div>
                        <Text className="font-medium">{tf("models.modelInfo.fields.inputCost", "输入成本（每 1M tokens）")}</Text>
                        {isEditing ? (
                          <Form.Item name="input_cost" className="mb-0">
                            <NumericalInput placeholder={tf("models.modelInfo.placeholders.inputCost", "请输入输入成本")} />
                          </Form.Item>
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            {localModelData?.litellm_params?.input_cost_per_token
                              ? (localModelData.litellm_params?.input_cost_per_token * 1_000_000).toFixed(4)
                              : localModelData?.model_info?.input_cost_per_token
                                ? (localModelData.model_info.input_cost_per_token * 1_000_000).toFixed(4)
                                : tf("models.modelInfo.notSet", "未设置")}
                          </div>
                        )}
                      </div>

                      <div>
                        <Text className="font-medium">{tf("models.modelInfo.fields.outputCost", "输出成本（每 1M tokens）")}</Text>
                        {isEditing ? (
                          <Form.Item name="output_cost" className="mb-0">
                            <NumericalInput placeholder={tf("models.modelInfo.placeholders.outputCost", "请输入输出成本")} />
                          </Form.Item>
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            {localModelData?.litellm_params?.output_cost_per_token
                              ? (localModelData.litellm_params.output_cost_per_token * 1_000_000).toFixed(4)
                              : localModelData?.model_info?.output_cost_per_token
                                ? (localModelData.model_info.output_cost_per_token * 1_000_000).toFixed(4)
                                : tf("models.modelInfo.notSet", "未设置")}
                          </div>
                        )}
                      </div>

                      <div>
                        <Text className="font-medium">{tf("models.modelInfo.fields.apiBase", "API Base")}</Text>
                        {isEditing ? (
                          <Form.Item name="api_base" className="mb-0">
                            <TextInput placeholder={tf("models.modelInfo.placeholders.apiBase", "请输入 API Base")} />
                          </Form.Item>
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            {localModelData.litellm_params?.api_base || tf("models.modelInfo.notSet", "未设置")}
                          </div>
                        )}
                      </div>

                      <div>
                        <Text className="font-medium">
                          {tf("models.modelInfo.fields.customLLMProvider", "自定义 LLM 提供商")}
                        </Text>
                        {isEditing ? (
                          <Form.Item name="custom_llm_provider" className="mb-0">
                            <TextInput
                              placeholder={tf("models.modelInfo.placeholders.customLLMProvider", "请输入自定义 LLM 提供商")}
                            />
                          </Form.Item>
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            {localModelData.litellm_params?.custom_llm_provider || tf("models.modelInfo.notSet", "未设置")}
                          </div>
                        )}
                      </div>

                      <div>
                        <Text className="font-medium">{tf("models.modelInfo.fields.organization", "Organization")}</Text>
                        {isEditing ? (
                          <Form.Item name="organization" className="mb-0">
                            <TextInput placeholder={tf("models.modelInfo.placeholders.organization", "请输入 Organization")} />
                          </Form.Item>
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            {localModelData.litellm_params?.organization || tf("models.modelInfo.notSet", "未设置")}
                          </div>
                        )}
                      </div>

                      <div>
                        <Text className="font-medium">{tf("models.modelInfo.fields.tpm", "TPM（每分钟 Tokens）")}</Text>
                        {isEditing ? (
                          <Form.Item name="tpm" className="mb-0">
                            <NumericalInput placeholder={tf("models.modelInfo.placeholders.tpm", "请输入 TPM")} />
                          </Form.Item>
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            {localModelData.litellm_params?.tpm || tf("models.modelInfo.notSet", "未设置")}
                          </div>
                        )}
                      </div>

                      <div>
                        <Text className="font-medium">{tf("models.modelInfo.fields.rpm", "RPM（每分钟请求数）")}</Text>
                        {isEditing ? (
                          <Form.Item name="rpm" className="mb-0">
                            <NumericalInput placeholder={tf("models.modelInfo.placeholders.rpm", "请输入 RPM")} />
                          </Form.Item>
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            {localModelData.litellm_params?.rpm || tf("models.modelInfo.notSet", "未设置")}
                          </div>
                        )}
                      </div>

                      <div>
                        <Text className="font-medium">{tf("models.modelInfo.fields.maxRetries", "最大重试次数")}</Text>
                        {isEditing ? (
                          <Form.Item name="max_retries" className="mb-0">
                            <NumericalInput placeholder={tf("models.modelInfo.placeholders.maxRetries", "请输入最大重试次数")} />
                          </Form.Item>
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            {localModelData.litellm_params?.max_retries || tf("models.modelInfo.notSet", "未设置")}
                          </div>
                        )}
                      </div>

                      <div>
                        <Text className="font-medium">{tf("models.modelInfo.fields.timeout", "超时（秒）")}</Text>
                        {isEditing ? (
                          <Form.Item name="timeout" className="mb-0">
                            <NumericalInput placeholder={tf("models.modelInfo.placeholders.timeout", "请输入超时时间")} />
                          </Form.Item>
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            {localModelData.litellm_params?.timeout || tf("models.modelInfo.notSet", "未设置")}
                          </div>
                        )}
                      </div>

                      <div>
                        <Text className="font-medium">{tf("models.modelInfo.fields.streamTimeout", "流式超时（秒）")}</Text>
                        {isEditing ? (
                          <Form.Item name="stream_timeout" className="mb-0">
                            <NumericalInput
                              placeholder={tf("models.modelInfo.placeholders.streamTimeout", "请输入流式超时时间")}
                            />
                          </Form.Item>
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            {localModelData.litellm_params?.stream_timeout || tf("models.modelInfo.notSet", "未设置")}
                          </div>
                        )}
                      </div>

                      <div>
                        <Text className="font-medium">{tf("models.modelInfo.fields.modelAccessGroups", "模型访问组")}</Text>
                        {isEditing ? (
                          <Form.Item name="model_access_group" className="mb-0">
                            <Select
                              mode="tags"
                              showSearch
                              placeholder={tf(
                                "models.modelInfo.placeholders.modelAccessGroups",
                                "选择已有分组或输入创建新分组",
                              )}
                              optionFilterProp="children"
                              tokenSeparators={[","]}
                              maxTagCount="responsive"
                              allowClear
                              style={{ width: "100%" }}
                              options={modelAccessGroups?.map((group) => ({
                                value: group,
                                label: group,
                              }))}
                            />
                          </Form.Item>
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            {localModelData.model_info?.access_groups ? (
                              Array.isArray(localModelData.model_info.access_groups) ? (
                                localModelData.model_info.access_groups.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {localModelData.model_info.access_groups.map((group: string, index: number) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                      >
                                        {group}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  tf("models.modelInfo.messages.noGroupsAssigned", "未分配分组")
                                )
                              ) : (
                                localModelData.model_info.access_groups
                              )
                            ) : (
                              tf("models.modelInfo.notSet", "未设置")
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <Text className="font-medium">
                          {tf("models.modelInfo.fields.guardrails", "防护栏")}
                          <Tooltip
                            title={tf(
                              "models.modelInfo.tooltips.guardrails",
                              "为该模型应用安全防护栏，用于内容过滤或策略约束",
                            )}
                          >
                            <a
                              href="https://docs.litellm.ai/docs/proxy/guardrails/quick_start"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                            </a>
                          </Tooltip>
                        </Text>
                        {isEditing ? (
                          <Form.Item name="guardrails" className="mb-0">
                            <Select
                              mode="tags"
                              showSearch
                              placeholder={tf(
                                "models.modelInfo.placeholders.guardrails",
                                "选择已有防护栏或输入创建新防护栏",
                              )}
                              optionFilterProp="children"
                              tokenSeparators={[","]}
                              maxTagCount="responsive"
                              allowClear
                              style={{ width: "100%" }}
                              options={guardrailsList.map((name) => ({
                                value: name,
                                label: name,
                              }))}
                            />
                          </Form.Item>
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            {localModelData.litellm_params?.guardrails ? (
                              Array.isArray(localModelData.litellm_params.guardrails) ? (
                                localModelData.litellm_params.guardrails.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {localModelData.litellm_params.guardrails.map(
                                      (guardrail: string, index: number) => (
                                        <span
                                          key={index}
                                          className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800"
                                        >
                                          {guardrail}
                                        </span>
                                      ),
                                    )}
                                  </div>
                                ) : (
                                  tf("models.modelInfo.messages.noGuardrailsAssigned", "未分配防护栏")
                                )
                              ) : (
                                localModelData.litellm_params.guardrails
                              )
                            ) : (
                              tf("models.modelInfo.notSet", "未设置")
                            )}
                          </div>
                        )}
                      </div>

                      <div>
                        <Text className="font-medium">{tf("models.modelInfo.fields.tags", "标签")}</Text>
                        {isEditing ? (
                          <Form.Item name="tags" className="mb-0">
                            <Select
                              mode="tags"
                              showSearch
                              placeholder={tf("models.modelInfo.placeholders.tags", "选择已有标签或输入创建新标签")}
                              optionFilterProp="children"
                              tokenSeparators={[","]}
                              maxTagCount="responsive"
                              allowClear
                              style={{ width: "100%" }}
                              options={Object.values(tagsList).map((tag: Tag) => ({
                                value: tag.name,
                                label: tag.name,
                                title: tag.description || tag.name,
                              }))}
                            />
                          </Form.Item>
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            {localModelData.litellm_params?.tags ? (
                              Array.isArray(localModelData.litellm_params.tags) ? (
                                localModelData.litellm_params.tags.length > 0 ? (
                                  <div className="flex flex-wrap gap-1">
                                    {localModelData.litellm_params.tags.map((tag: string, index: number) => (
                                      <span
                                        key={index}
                                        className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                                      >
                                        {tag}
                                      </span>
                                    ))}
                                  </div>
                                ) : (
                                  tf("models.modelInfo.messages.noTagsAssigned", "未分配标签")
                                )
                              ) : (
                                localModelData.litellm_params.tags
                              )
                            ) : (
                              tf("models.modelInfo.notSet", "未设置")
                            )}
                          </div>
                        )}
                      </div>

                      {isWildcardModel && (
                        <div>
                          <Text className="font-medium">{tf("models.modelInfo.fields.healthCheckModel", "健康检查模型")}</Text>
                          {isEditing ? (
                            <Form.Item name="health_check_model" className="mb-0">
                              <Select
                                showSearch
                                placeholder={tf("models.modelInfo.placeholders.healthCheckModel", "选择健康检查模型")}
                                optionFilterProp="children"
                                allowClear
                                options={(() => {
                                  const wildcardProvider = modelData.litellm_model_name.split("/")[0];
                                  return modelHubData?.data
                                    ?.filter((model: any) => {
                                      // Filter by provider to match the wildcard provider
                                      return (
                                        model.providers?.includes(wildcardProvider) &&
                                        model.model_group !== modelData.litellm_model_name
                                      );
                                    })
                                    .map((model: any) => ({
                                      value: model.model_group,
                                      label: model.model_group,
                                    })) || [];
                                })()}
                              />
                            </Form.Item>
                          ) : (
                            <div className="mt-1 p-2 bg-gray-50 rounded">
                              {localModelData.model_info?.health_check_model || tf("models.modelInfo.notSet", "未设置")}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Cache Control Section */}
                      {isEditing ? (
                        <CacheControlSettings
                          form={form}
                          showCacheControl={showCacheControl}
                          onCacheControlChange={(checked) => setShowCacheControl(checked)}
                        />
                      ) : (
                        <div>
                          <Text className="font-medium">{tf("models.modelInfo.fields.cacheControl", "缓存控制")}</Text>
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            {localModelData.litellm_params?.cache_control_injection_points ? (
                              <div>
                                <p>{tf("models.modelInfo.messages.enabled", "已启用")}</p>
                                <div className="mt-2">
                                  {localModelData.litellm_params.cache_control_injection_points.map(
                                    (point: any, i: number) => (
                                      <div key={i} className="text-sm text-gray-600 mb-1">
                                        {tf("models.modelInfo.messages.location", "位置")}: {point.location},
                                        {point.role && <span> {tf("models.modelInfo.messages.role", "角色")}: {point.role}</span>}
                                        {point.index !== undefined && <span> {tf("models.modelInfo.messages.index", "索引")}: {point.index}</span>}
                                      </div>
                                    ),
                                  )}
                                </div>
                              </div>
                            ) : (
                              tf("models.modelInfo.messages.disabled", "未启用")
                            )}
                          </div>
                        </div>
                      )}

                      <div>
                        <Text className="font-medium">{tf("models.modelInfo.fields.modelInfo", "模型信息")}</Text>
                        {isEditing ? (
                          <Form.Item name="model_info" className="mb-0">
                            <Input.TextArea
                              rows={4}
                              placeholder='{"gpt-4": 100, "claude-v1": 200}'
                              defaultValue={JSON.stringify(modelData.model_info, null, 2)}
                            />
                          </Form.Item>
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto mt-1">
                              {JSON.stringify(localModelData.model_info, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                      <div>
                        <Text className="font-medium">
                          {tf("models.modelInfo.fields.silinexParams", "Silinex 参数")}
                          <Tooltip
                            title={tf(
                              "models.modelInfo.tooltips.silinexParams",
                              "用于 litellm.completion() 调用的可选参数。部分参数会被 Silinex 自动追加。",
                            )}
                          >
                            <a
                              href="https://docs.litellm.ai/docs/completion/input"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                            </a>
                          </Tooltip>
                        </Text>
                        {isEditing ? (
                          <Form.Item name="litellm_extra_params" rules={[{ validator: formItemValidateJSON }]}>
                            <Input.TextArea
                              rows={4}
                              placeholder='{
                  "rpm": 100,
                  "timeout": 0,
                  "stream_timeout": 0
                }'
                            />
                          </Form.Item>
                        ) : (
                          <div className="mt-1 p-2 bg-gray-50 rounded">
                            <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto mt-1">
                              {JSON.stringify(localModelData.litellm_params, null, 2)}
                            </pre>
                          </div>
                        )}
                      </div>
                      <div>
                        <Text className="font-medium">{tf("models.modelInfo.fields.teamId", "团队 ID")}</Text>
                        <div className="mt-1 p-2 bg-gray-50 rounded">
                          {modelData.model_info.team_id || tf("models.modelInfo.notSet", "未设置")}
                        </div>
                      </div>
                    </div>

                    {isEditing && (
                      <div className="mt-6 flex justify-end gap-2">
                        <TremorButton
                          variant="secondary"
                          onClick={() => {
                            form.resetFields();
                            setIsDirty(false);
                            setIsEditing(false);
                          }}
                          disabled={isSaving}
                        >
                          {tf("models.common.cancel", "Cancel")}
                        </TremorButton>
                        <TremorButton variant="primary" onClick={() => form.submit()} loading={isSaving}>
                          {tf("models.modelInfo.saveChanges", "Save Changes")}
                        </TremorButton>
                      </div>
                    )}
                  </div>
                </Form>
              ) : (
                <Text>{tf("models.modelInfo.loading", "Loading...")}</Text>
              )}
            </Card>
          </TabPanel>

          <TabPanel>
            <Card>
              <pre className="bg-gray-100 p-4 rounded text-xs overflow-auto">{JSON.stringify(modelData, null, 2)}</pre>
            </Card>
          </TabPanel>
        </TabPanels>
      </TabGroup>

      <DeleteResourceModal
        isOpen={isDeleteModalOpen}
        title="Delete Model"
        alertMessage="This action cannot be undone."
        message="Are you sure you want to delete this model?"
        resourceInformationTitle="Model Information"
        resourceInformation={[
          {
            label: "Model Name",
            value: modelData?.model_name || "Not Set",
          },
          {
            label: "Silinex Model Name",
            value: modelData?.litellm_model_name || "Not Set",
          },
          {
            label: "Provider",
            value: modelData?.provider || "Not Set",
          },
          {
            label: "Created By",
            value: modelData?.model_info?.created_by || "Not Set",
          },
        ]}
        onCancel={() => setIsDeleteModalOpen(false)}
        onOk={handleDelete}
        confirmLoading={deleteLoading}
      />

      {isCredentialModalOpen && !usingExistingCredential ? (
        <ReuseCredentialsModal
          isVisible={isCredentialModalOpen}
          onCancel={() => setIsCredentialModalOpen(false)}
          onAddCredential={handleReuseCredential}
          existingCredential={existingCredential}
          setIsCredentialModalOpen={setIsCredentialModalOpen}
        />
      ) : (
        <Modal
          open={isCredentialModalOpen}
          onCancel={() => setIsCredentialModalOpen(false)}
          title="Using Existing Credential"
        >
          <Text>{modelData.litellm_params.litellm_credential_name}</Text>
        </Modal>
      )}

      {/* Edit Auto Router Modal */}
      <EditAutoRouterModal
        isVisible={isAutoRouterModalOpen}
        onCancel={() => setIsAutoRouterModalOpen(false)}
        onSuccess={handleAutoRouterUpdate}
        modelData={localModelData || modelData}
        accessToken={accessToken || ""}
        userRole={userRole || ""}
      />
    </div>
  );
}
