"use client";
import { useLanguage } from "@/contexts/LanguageContext";
import { keyKeys } from "@/app/(dashboard)/hooks/keys/useKeys";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import { InfoCircleOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { Accordion, AccordionBody, AccordionHeader, Button, Col, Grid, Text, TextInput, Title } from "@tremor/react";
import { Button as Button2, Form, Input, Modal, Radio, Select, Switch, Tooltip } from "antd";
import debounce from "lodash/debounce";
import React, { useCallback, useEffect, useState } from "react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { rolesWithWriteAccess } from "../../utils/roles";
import AgentSelector from "../agent_management/AgentSelector";
import { mapDisplayToInternalNames } from "../callback_info_helpers";
import BudgetDurationDropdown from "../common_components/budget_duration_dropdown";
import SchemaFormFields from "../common_components/check_openapi_schema";
import KeyLifecycleSettings from "../common_components/KeyLifecycleSettings";
import ModelAliasManager from "../common_components/ModelAliasManager";
import PassThroughRoutesSelector from "../common_components/PassThroughRoutesSelector";
import PremiumLoggingSettings from "../common_components/PremiumLoggingSettings";
import RateLimitTypeFormItem from "../common_components/RateLimitTypeFormItem";
import RouterSettingsAccordion, { RouterSettingsAccordionValue } from "../common_components/RouterSettingsAccordion";
import AccessGroupSelector from "../common_components/AccessGroupSelector";
import TeamDropdown from "../common_components/team_dropdown";
import { CreateUserButton } from "../CreateUserButton";
import { getModelDisplayName } from "../key_team_helpers/fetch_available_models_team_key";
import { Team } from "../key_team_helpers/key_list";
import MCPServerSelector from "../mcp_server_management/MCPServerSelector";
import MCPToolPermissions from "../mcp_server_management/MCPToolPermissions";
import NotificationsManager from "../molecules/notifications_manager";
import {
  getGuardrailsList,
  getPoliciesList,
  getPossibleUserRoles,
  getPromptsList,
  keyCreateCall,
  modelAvailableCall,
  proxyBaseUrl,
  userFilterUICall,
} from "../networking";
import NumericalInput from "../shared/numerical_input";
import VectorStoreSelector from "../vector_store_management/VectorStoreSelector";
import { simplifyKeyGenerateError } from "./utils";
import CreatedKeyDisplay from "../shared/CreatedKeyDisplay";

const { Option } = Select;

interface CreateKeyProps {
  team: Team | null;
  data: any[] | null;
  teams: Team[] | null;
  addKey: (data: any) => void;
}

interface User {
  user_id: string;
  user_email: string;
  role?: string;
}

interface UserOption {
  label: string;
  value: string;
  user: User;
}

const getPredefinedTags = (data: any[] | null) => {
  let allTags = [];

  console.log("data:", JSON.stringify(data));

  if (data) {
    for (let key of data) {
      if (key["metadata"] && key["metadata"]["tags"]) {
        allTags.push(...key["metadata"]["tags"]);
      }
    }
  }

  // Deduplicate using Set
  const uniqueTags = Array.from(new Set(allTags)).map((tag) => ({
    value: tag,
    label: tag,
  }));

  console.log("uniqueTags:", uniqueTags);
  return uniqueTags;
};

export const fetchTeamModels = async (
  userID: string,
  userRole: string,
  accessToken: string,
  teamID: string | null,
): Promise<string[]> => {
  try {
    if (userID === null || userRole === null) {
      return [];
    }

    if (accessToken !== null) {
      const model_available = await modelAvailableCall(accessToken, userID, userRole, true, teamID, true);
      let available_model_names = model_available["data"].map((element: { id: string }) => element.id);
      console.log("available_model_names:", available_model_names);
      return available_model_names;
    }
    return [];
  } catch (error) {
    console.error("Error fetching user models:", error);
    return [];
  }
};

export const fetchUserModels = async (
  userID: string,
  userRole: string,
  accessToken: string,
  setUserModels: (models: string[]) => void,
) => {
  try {
    if (userID === null || userRole === null) {
      return;
    }

    if (accessToken !== null) {
      const model_available = await modelAvailableCall(accessToken, userID, userRole);
      let available_model_names = model_available["data"].map((element: { id: string }) => element.id);
      console.log("available_model_names:", available_model_names);
      setUserModels(available_model_names);
    }
  } catch (error) {
    console.error("Error fetching user models:", error);
  }
};

/**
 * ─────────────────────────────────────────────────────────────────────────
 * @deprecated
 * This component is being DEPRECATED in favor of src/app/(dashboard)/virtual-keys/components/CreateKey.tsx
 * Please contribute to the new refactor.
 * ─────────────────────────────────────────────────────────────────────────
 */
const CreateKey: React.FC<CreateKeyProps> = ({ team, teams, data, addKey }) => {
  const { accessToken, userId: userID, userRole, premiumUser } = useAuthorized();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [apiKey, setApiKey] = useState(null);
  const [softBudget, setSoftBudget] = useState(null);
  const [userModels, setUserModels] = useState<string[]>([]);
  const [modelsToPick, setModelsToPick] = useState<string[]>([]);
  const [keyOwner, setKeyOwner] = useState("you");
  const [predefinedTags, setPredefinedTags] = useState(getPredefinedTags(data));
  const [guardrailsList, setGuardrailsList] = useState<string[]>([]);
  const [policiesList, setPoliciesList] = useState<string[]>([]);
  const [promptsList, setPromptsList] = useState<string[]>([]);
  const [loggingSettings, setLoggingSettings] = useState<any[]>([]);
  const [selectedCreateKeyTeam, setSelectedCreateKeyTeam] = useState<Team | null>(team);
  const [isCreateUserModalVisible, setIsCreateUserModalVisible] = useState(false);
  const [newlyCreatedUserId, setNewlyCreatedUserId] = useState<string | null>(null);
  const [possibleUIRoles, setPossibleUIRoles] = useState<Record<string, Record<string, string>>>({});
  const [userOptions, setUserOptions] = useState<UserOption[]>([]);
  const [userSearchLoading, setUserSearchLoading] = useState<boolean>(false);
  const [mcpAccessGroups, setMcpAccessGroups] = useState<string[]>([]);
  const [disabledCallbacks, setDisabledCallbacks] = useState<string[]>([]);
  const [keyType, setKeyType] = useState<string>("llm_api");
  const [modelAliases, setModelAliases] = useState<{ [key: string]: string }>({});
  const [autoRotationEnabled, setAutoRotationEnabled] = useState<boolean>(false);
  const [rotationInterval, setRotationInterval] = useState<string>("30d");
  const [routerSettings, setRouterSettings] = useState<RouterSettingsAccordionValue | null>(null);
  const [routerSettingsKey, setRouterSettingsKey] = useState<number>(0);
  const handleOk = () => {
    setIsModalVisible(false);
    form.resetFields();
    setLoggingSettings([]);
    setDisabledCallbacks([]);
    setKeyType("llm_api");
    setModelAliases({});
    setAutoRotationEnabled(false);
    setRotationInterval("30d");
    setRouterSettings(null);
    setRouterSettingsKey((prev) => prev + 1);
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setApiKey(null);
    setSelectedCreateKeyTeam(null);
    form.resetFields();
    setLoggingSettings([]);
    setDisabledCallbacks([]);
    setKeyType("llm_api");
    setModelAliases({});
    setAutoRotationEnabled(false);
    setRotationInterval("30d");
    setRouterSettings(null);
    setRouterSettingsKey((prev) => prev + 1);
  };

  useEffect(() => {
    if (userID && userRole && accessToken) {
      fetchUserModels(userID, userRole, accessToken, setUserModels);
    }
  }, [accessToken, userID, userRole]);

  useEffect(() => {
    const fetchGuardrails = async () => {
      try {
        const response = await getGuardrailsList(accessToken);
        const guardrailNames = response.guardrails.map((g: { guardrail_name: string }) => g.guardrail_name);
        setGuardrailsList(guardrailNames);
      } catch (error) {
        console.error("Failed to fetch guardrails:", error);
      }
    };

    const fetchPolicies = async () => {
      try {
        const response = await getPoliciesList(accessToken);
        const policyNames = response.policies.map((p: { policy_name: string }) => p.policy_name);
        setPoliciesList(policyNames);
      } catch (error) {
        console.error("Failed to fetch policies:", error);
      }
    };

    const fetchPrompts = async () => {
      try {
        const response = await getPromptsList(accessToken);
        setPromptsList(response.prompts.map((prompt) => prompt.prompt_id));
      } catch (error) {
        console.error("Failed to fetch prompts:", error);
      }
    };

    fetchGuardrails();
    fetchPolicies();
    fetchPrompts();
  }, [accessToken]);

  // Fetch possible user roles when component mounts
  useEffect(() => {
    const fetchPossibleRoles = async () => {
      try {
        if (accessToken) {
          // Check if roles are cached in session storage
          const cachedRoles = sessionStorage.getItem("possibleUserRoles");
          if (cachedRoles) {
            setPossibleUIRoles(JSON.parse(cachedRoles));
          } else {
            const availableUserRoles = await getPossibleUserRoles(accessToken);
            sessionStorage.setItem("possibleUserRoles", JSON.stringify(availableUserRoles));
            setPossibleUIRoles(availableUserRoles);
          }
        }
      } catch (error) {
        console.error("Error fetching possible user roles:", error);
      }
    };

    fetchPossibleRoles();
  }, [accessToken]);

  // Check if team selection is required
  const isTeamSelectionRequired = modelsToPick.includes("no-default-models");
  const isFormDisabled = isTeamSelectionRequired && !selectedCreateKeyTeam;

  const handleCreate = async (formValues: Record<string, any>) => {
    try {
      const newKeyAlias = formValues?.key_alias ?? "";
      const newKeyTeamId = formValues?.team_id ?? null;

      const existingKeyAliases = data?.filter((k) => k.team_id === newKeyTeamId).map((k) => k.key_alias) ?? [];

      if (existingKeyAliases.includes(newKeyAlias)) {
        throw new Error(
          `Key alias ${newKeyAlias} already exists for team with ID ${newKeyTeamId}, please provide another key alias`,
        );
      }

      NotificationsManager.info("Making API Call");
      setIsModalVisible(true);

      if (keyOwner === "you") {
        formValues.user_id = userID;
      }

      // Handle metadata for all key types
      let metadata: Record<string, any> = {};
      try {
        metadata = JSON.parse(formValues.metadata || "{}");
      } catch (error) {
        console.error("Error parsing metadata:", error);
      }

      // Add logging settings to the metadata
      if (loggingSettings.length > 0) {
        metadata = {
          ...metadata,
          logging: loggingSettings.filter((config) => config.callback_name),
        };
      }

      // Add disabled callbacks to the metadata
      if (disabledCallbacks.length > 0) {
        // Map display names to internal callback values
        const mappedDisabledCallbacks = mapDisplayToInternalNames(disabledCallbacks);
        metadata = {
          ...metadata,
          litellm_disabled_callbacks: mappedDisabledCallbacks,
        };
      }

      // Add auto-rotation settings as top-level fields
      if (autoRotationEnabled) {
        formValues.auto_rotate = true;
        formValues.rotation_interval = rotationInterval;
      }

      // Handle duration field for key expiry - convert empty string to null
      if (!formValues.duration || formValues.duration.trim() === "") {
        formValues.duration = null;
      }

      // Update the formValues with the final metadata
      formValues.metadata = JSON.stringify(metadata);

      // Transform allowed_vector_store_ids and allowed_mcp_servers_and_groups into object_permission format
      if (formValues.allowed_vector_store_ids && formValues.allowed_vector_store_ids.length > 0) {
        formValues.object_permission = {
          vector_stores: formValues.allowed_vector_store_ids,
        };
        // Remove the original field as it's now part of object_permission
        delete formValues.allowed_vector_store_ids;
      }

      // Transform allowed_mcp_servers_and_groups into object_permission format
      if (
        formValues.allowed_mcp_servers_and_groups &&
        (formValues.allowed_mcp_servers_and_groups.servers?.length > 0 ||
          formValues.allowed_mcp_servers_and_groups.accessGroups?.length > 0)
      ) {
        if (!formValues.object_permission) {
          formValues.object_permission = {};
        }
        const { servers, accessGroups } = formValues.allowed_mcp_servers_and_groups;
        if (servers && servers.length > 0) {
          formValues.object_permission.mcp_servers = servers;
        }
        if (accessGroups && accessGroups.length > 0) {
          formValues.object_permission.mcp_access_groups = accessGroups;
        }
        // Remove the original field as it's now part of object_permission
        delete formValues.allowed_mcp_servers_and_groups;
      }

      // Add MCP tool permissions to object_permission
      const mcpToolPermissions = formValues.mcp_tool_permissions || {};
      if (Object.keys(mcpToolPermissions).length > 0) {
        if (!formValues.object_permission) {
          formValues.object_permission = {};
        }
        formValues.object_permission.mcp_tool_permissions = mcpToolPermissions;
      }
      delete formValues.mcp_tool_permissions;

      // Transform allowed_mcp_access_groups into object_permission format
      if (formValues.allowed_mcp_access_groups && formValues.allowed_mcp_access_groups.length > 0) {
        if (!formValues.object_permission) {
          formValues.object_permission = {};
        }
        formValues.object_permission.mcp_access_groups = formValues.allowed_mcp_access_groups;
        // Remove the original field as it's now part of object_permission
        delete formValues.allowed_mcp_access_groups;
      }

      // Transform allowed_agents_and_groups into object_permission format
      if (
        formValues.allowed_agents_and_groups &&
        (formValues.allowed_agents_and_groups.agents?.length > 0 ||
          formValues.allowed_agents_and_groups.accessGroups?.length > 0)
      ) {
        if (!formValues.object_permission) {
          formValues.object_permission = {};
        }
        const { agents, accessGroups } = formValues.allowed_agents_and_groups;
        if (agents && agents.length > 0) {
          formValues.object_permission.agents = agents;
        }
        if (accessGroups && accessGroups.length > 0) {
          formValues.object_permission.agent_access_groups = accessGroups;
        }
        // Remove the original field as it's now part of object_permission
        delete formValues.allowed_agents_and_groups;
      }

      // Add model_aliases if any are defined
      if (Object.keys(modelAliases).length > 0) {
        formValues.aliases = JSON.stringify(modelAliases);
      }

      // Add router_settings if any are defined
      if (routerSettings?.router_settings) {
        // Only include router_settings if it has at least one non-null value
        const hasValues = Object.values(routerSettings.router_settings).some(
          (value) => value !== null && value !== undefined && value !== "",
        );
        if (hasValues) {
          formValues.router_settings = routerSettings.router_settings;
        }
      }

      const response = await keyCreateCall(accessToken, userID, formValues);

      console.log("key create Response:", response);

      // Add the data to the state in the parent component
      // Also directly update the keys list in VirtualKeysTable without an API call
      addKey(response);

      // Invalidate and refetch all keys list queries to update the table
      // This will trigger a refetch of all key list queries regardless of pagination
      queryClient.invalidateQueries({ queryKey: keyKeys.lists() });

      setApiKey(response["key"]);
      setSoftBudget(response["soft_budget"]);
      NotificationsManager.success("Virtual Key Created");
      form.resetFields();
      localStorage.removeItem("userData" + userID);
    } catch (error) {
      console.log("error in create key:", error);
      const simplifiedError = simplifyKeyGenerateError(error);
      NotificationsManager.fromBackend(simplifiedError);
    }
  };

  const handleCopy = () => {
    NotificationsManager.success("Virtual Key copied to clipboard");
  };

  useEffect(() => {
    if (userID && userRole && accessToken) {
      fetchTeamModels(userID, userRole, accessToken, selectedCreateKeyTeam?.team_id ?? null).then((models) => {
        let allModels = Array.from(new Set([...(selectedCreateKeyTeam?.models ?? []), ...models]));
        setModelsToPick(allModels);
      });
    }
    form.setFieldValue("models", []);
  }, [selectedCreateKeyTeam, accessToken, userID, userRole]);

  // Add a callback function to handle user creation
  const handleUserCreated = (userId: string) => {
    setNewlyCreatedUserId(userId);
    form.setFieldsValue({ user_id: userId });
    setIsCreateUserModalVisible(false);
  };

  const fetchUsers = async (searchText: string): Promise<void> => {
    if (!searchText) {
      setUserOptions([]);
      return;
    }

    setUserSearchLoading(true);
    try {
      const params = new URLSearchParams();
      params.append("user_email", searchText); // Always search by email
      if (accessToken == null) {
        return;
      }
      const response = await userFilterUICall(accessToken, params);

      const data: User[] = response;
      const options: UserOption[] = data.map((user) => ({
        label: `${user.user_email} (${user.user_id})`,
        value: user.user_id,
        user,
      }));

      setUserOptions(options);
    } catch (error) {
      console.error("Error fetching users:", error);
      NotificationsManager.fromBackend("Failed to search for users");
    } finally {
      setUserSearchLoading(false);
    }
  };

  const debouncedSearch = useCallback(
    debounce((text: string) => fetchUsers(text), 300),
    [accessToken],
  );

  const handleUserSearch = (value: string): void => {
    debouncedSearch(value);
  };

  const handleUserSelect = (_value: string, option: UserOption): void => {
    const selectedUser = option.user;
    form.setFieldsValue({
      user_id: selectedUser.user_id,
    });
  };

  return (
    <div>
      {userRole && rolesWithWriteAccess.includes(userRole) && (
        <Button className="mx-auto" onClick={() => setIsModalVisible(true)}>
          + 创建新密钥
        </Button>
      )}
      <Modal open={isModalVisible} width={1000} footer={null} onOk={handleOk} onCancel={handleCancel}>
        <Form
          form={form}
          onFinish={handleCreate}
          labelCol={{ span: 8 }}
          wrapperCol={{ span: 16 }}
          labelAlign="left"
          className="[&_.ant-form-item]:mb-6"
        >
          {/* Section 1: Key Ownership */}
          <div className="mb-8">
            <Title className="mb-4">创建密钥</Title>
            <Form.Item
              label={
                <span>
                  所有者{" "}
                  <Tooltip title="选择谁将拥有此API密钥">
                    <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                  </Tooltip>
                </span>
              }
              className="mb-4"
            >
              <Radio.Group onChange={(e) => setKeyOwner(e.target.value)} value={keyOwner}>
                <Radio value="you">您</Radio>
                {userRole === "Admin" && <Radio value="another_user">其他用户</Radio>}
              </Radio.Group>
            </Form.Item>

            {keyOwner === "another_user" && (
              <Form.Item
                label={
                  <span>
                    用户 ID{" "}
                    <Tooltip title="将拥有此密钥并负责其使用的用户">
                      <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                    </Tooltip>
                  </span>
                }
                name="user_id"
                className="mt-4"
                rules={[
                  {
                    required: keyOwner === "another_user",
                    message: `请输入您要分配密钥的用户 ID`,
                  },
                ]}
              >
                <div>
                  <div style={{ display: "flex", marginBottom: "8px" }}>
                    <Select
                      showSearch
                      placeholder="输入用户名搜索用户"
                      filterOption={false}
                      onSearch={handleUserSearch}
                      onSelect={(value, option) => handleUserSelect(value, option as UserOption)}
                      options={userOptions}
                      loading={userSearchLoading}
                      allowClear
                      style={{ width: "100%" }}
                      notFoundContent={userSearchLoading ? "搜索中..." : "未找到用户"}
                    />
                    <Button2 onClick={() => setIsCreateUserModalVisible(true)} style={{ marginLeft: "8px" }}>
                      创建用户
                    </Button2>
                  </div>
                  <div className="text-xs text-gray-500">通过用户名搜索用户</div>
                </div>
              </Form.Item>
            )}
            <Form.Item
              label={
                <span>
                  团队{" "}
                  <Tooltip title="此密钥所属的团队，决定可用模型和预算限制">
                    <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                  </Tooltip>
                </span>
              }
              name="team_id"
              initialValue={team ? team.team_id : null}
              className="mt-4"
            >
              <TeamDropdown
                teams={teams}
                onChange={(teamId) => {
                  const selectedTeam = teams?.find((t) => t.team_id === teamId) || null;
                  setSelectedCreateKeyTeam(selectedTeam);
                }}
              />
            </Form.Item>
          </div>

          {/* Show message when team selection is required */}
          {isFormDisabled && (
            <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <Text className="text-blue-800 text-sm">
                请选择团队以继续配置您的API密钥。如果您没有看到任何团队，请联系您的代理管理员为您提供模型访问权限或将您添加到团队中。
                contact your Proxy Admin to either provide you with access to models or to add you to a team.
              </Text>
            </div>
          )}

          {/* Section 2: Key Details */}
          {!isFormDisabled && (
            <div className="mb-8">
              <Title className="mb-4">密钥详情</Title>
              <Form.Item
                label={
                  <span>
                    密钥名称{" "}
                    <Tooltip
                      title={"用于识别此密钥的描述性名称"}
                    >
                      <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                    </Tooltip>
                  </span>
                }
                name="key_alias"
                rules={[
                  {
                    required: true,
                    message: "请输入密钥名称",
                  },
                ]}
              >
                <TextInput placeholder="" />
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    模型{" "}
                    <Tooltip title="选择此密钥可以访问的模型。选择'所有团队模型'以授予对团队所有可用模型的访问权限">
                      <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                    </Tooltip>
                  </span>
                }
                name="models"
                rules={
                  keyType === "management" || keyType === "read_only"
                    ? []
                    : [{ required: true, message: "请选择模型" }]
                }
                help={
                  keyType === "management" || keyType === "read_only"
                    ? "此密钥类型禁用模型字段"
                    : undefined
                }
                className="mt-4"
              >
                <Select
                  mode="multiple"
                  placeholder="选择模型"
                  style={{ width: "100%" }}
                  disabled={keyType === "management" || keyType === "read_only"}
                  onChange={(values) => {
                    if (values.includes("all-team-models")) {
                      form.setFieldsValue({ models: ["all-team-models"] });
                    }
                  }}
                >
                  <Option key="all-team-models" value="all-team-models">
                    {t("keyDetail.settings.messages.allTeamModels")}
                  </Option>
                  {modelsToPick.map((model: string) => (
                    <Option key={model} value={model}>
                      {getModelDisplayName(model)}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              <Form.Item
                label={
                  <span>
                    密钥类型{" "}
                    <Tooltip title="选择密钥类型以确定此密钥可以访问的路由和操作">
                      <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                    </Tooltip>
                  </span>
                }
                name="key_type"
                initialValue="llm_api"
                className="mt-4"
              >
                <Select
                  defaultValue="llm_api"
                  placeholder="选择密钥类型"
                  style={{ width: "100%" }}
                  optionLabelProp="label"
                  onChange={(value) => {
                    setKeyType(value);
                    // Clear models field and disable if management or read_only
                    if (value === "management" || value === "read_only") {
                      form.setFieldsValue({ models: [] });
                    }
                  }}
                >
                  <Option value="default" label="默认">
                    <div style={{ padding: "4px 0" }}>
                      <div style={{ fontWeight: 500 }}>默认</div>
                      <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                        可调用 AI API + 管理路由
                      </div>
                    </div>
                  </Option>
                  <Option value="llm_api" label="AI API">
                    <div style={{ padding: "4px 0" }}>
                      <div style={{ fontWeight: 500 }}>AI API</div>
                      <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                        仅可调用 AI API 路由（chat/completions、embeddings 等）
                      </div>
                    </div>
                  </Option>
                  <Option value="management" label="管理">
                    <div style={{ padding: "4px 0" }}>
                      <div style={{ fontWeight: 500 }}>管理</div>
                      <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>
                        仅可调用管理路由（用户/团队/密钥管理）
                      </div>
                    </div>
                  </Option>
                </Select>
              </Form.Item>
              <Form.Item
                className="mt-4 mb-8"
                style={{ marginBottom: 40 }}
                label={
                  <span>
                    最大预算{' '}
                    <Tooltip title="此密钥可以消费的最大金额。达到后，密钥将被阻止发起进一步请求">
                      <InfoCircleOutlined style={{ marginLeft: '4px' }} />
                    </Tooltip>
                  </span>
                }
                name="max_budget"
                help={
                  <div className="pb-2">
                    {`预算不能超过团队最大预算：¥${team?.max_budget !== null && team?.max_budget !== undefined ? team.max_budget : '无限制'}`}
                  </div>
                }
                rules={[
                  {
                    validator: async (_, value) => {
                      if (value && team && team.max_budget !== null && value > team.max_budget) {
                        throw new Error(
                          `预算不能超过团队最大预算：¥${formatNumberWithCommas(team.max_budget, 4)}`,
                        );
                      }
                    },
                  },
                ]}
              >
                <NumericalInput
                  step={0.01}
                  precision={2}
                  width={200}
                  placeholder={t("keyDetail.settings.placeholders.enterNumericalValue")}
                />
              </Form.Item>
              <Form.Item
                className="mt-4 mb-8"
                style={{ marginBottom: 40 }}
                label={
                  <span>
                    重置预算{' '}
                    <Tooltip title="预算应多久重置一次。例如，设置'每天'将每 24 小时重置一次预算">
                      <InfoCircleOutlined style={{ marginLeft: '4px' }} />
                    </Tooltip>
                  </span>
                }
                name="budget_duration"
                help={
                  <div className="pb-2">
                    {`团队重置预算：${team?.budget_duration !== null && team?.budget_duration !== undefined ? team.budget_duration : '无'}`}
                  </div>
                }
              >
                <BudgetDurationDropdown onChange={(value) => form.setFieldValue('budget_duration', value)} />
              </Form.Item>
            </div>
          )}
          {/* Section 3: Optional Settings */}
          {!isFormDisabled && (
            <div className="mb-8">
              <Accordion className="mt-4 mb-4">
                <AccordionHeader>
                  <Title className="m-0">可选设置</Title>
                </AccordionHeader>
                <AccordionBody>
                  <Form.Item
                    className="mt-4"
                    label={
                      <span>
                        每分钟 Token 限制 (TPM){" "}
                        <Tooltip title="此密钥每分钟可以处理的最大 token 数量。有助于控制使用和成本">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="tpm_limit"
                    help={`TPM 不能超过团队 TPM 限制：${team?.tpm_limit !== null && team?.tpm_limit !== undefined ? team?.tpm_limit : "无限制"}`}
                    rules={[
                      {
                        validator: async (_, value) => {
                          if (value && team && team.tpm_limit !== null && value > team.tpm_limit) {
                            throw new Error(`TPM 限制不能超过团队 TPM 限制：${team.tpm_limit}`);
                          }
                        },
                      },
                    ]}
                  >
                    <NumericalInput
                      step={1}
                      width={400}
                      placeholder={t("keyDetail.settings.placeholders.enterNumericalValue")}
                    />
                  </Form.Item>
                  <RateLimitTypeFormItem
                    type="tpm"
                    name="tpm_limit_type"
                    className="mt-4"
                    initialValue={null}
                    form={form}
                    showDetailedDescriptions={true}
                  />
                  <Form.Item
                    className="mt-4"
                    label={
                      <span>
                        每分钟请求限制 (RPM){" "}
                        <Tooltip title="此密钥每分钟可以发起的最大 API 请求数。有助于防止滥用和管理负载">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="rpm_limit"
                    help={`RPM 不能超过团队 RPM 限制：${team?.rpm_limit !== null && team?.rpm_limit !== undefined ? team?.rpm_limit : "无限制"}`}
                    rules={[
                      {
                        validator: async (_, value) => {
                          if (value && team && team.rpm_limit !== null && value > team.rpm_limit) {
                            throw new Error(`RPM 限制不能超过团队 RPM 限制：${team.rpm_limit}`);
                          }
                        },
                      },
                    ]}
                  >
                    <NumericalInput
                      step={1}
                      width={400}
                      placeholder={t("keyDetail.settings.placeholders.enterNumericalValue")}
                    />
                  </Form.Item>
                  <RateLimitTypeFormItem
                    type="rpm"
                    name="rpm_limit_type"
                    className="mt-4"
                    initialValue={null}
                    form={form}
                    showDetailedDescriptions={true}
                  />
                  {premiumUser && (
                    <>
                      <Form.Item
                        label={
                          <span>
                            安全防护{" "}
                            <Tooltip title="为此密钥应用安全防护以过滤内容或强制执行策略">
                              <a
                                href="https://docs.litellm.ai/docs/proxy/guardrails/quick_start"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                              </a>
                            </Tooltip>
                          </span>
                        }
                        name="guardrails"
                        className="mt-4"
                        help="选择现有安全防护或输入新的"
                      >
                        <Select
                          mode="tags"
                          style={{ width: "100%" }}
                          placeholder="选择或输入安全防护"
                          options={guardrailsList.map((name) => ({ value: name, label: name }))}
                        />
                      </Form.Item>
                      <Form.Item
                        label={
                          <span>
                            禁用全局安全防护{" "}
                            <Tooltip title="启用后，此密钥将绕过任何配置为在每个请求上运行的安全防护（全局安全防护）">
                              <a
                                href="https://docs.litellm.ai/docs/proxy/guardrails/quick_start"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                              </a>
                            </Tooltip>
                          </span>
                        }
                        name="disable_global_guardrails"
                        className="mt-4"
                        valuePropName="checked"
                        help="为此密钥绕过全局安全防护"
                      >
                        <Switch checkedChildren="是" unCheckedChildren="否" />
                      </Form.Item>
                      <Form.Item
                        label={
                          <span>
                            策略{" "}
                            <Tooltip title="为此密钥应用策略以控制安全防护和其他设置">
                              <a
                                href="https://docs.litellm.ai/docs/proxy/guardrails/guardrail_policies"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                              </a>
                            </Tooltip>
                          </span>
                        }
                        name="policies"
                        className="mt-4"
                        help="选择现有策略或输入新的"
                      >
                        <Select
                          mode="tags"
                          style={{ width: "100%" }}
                          placeholder="选择或输入策略"
                          options={policiesList.map((name) => ({ value: name, label: name }))}
                        />
                      </Form.Item>
                      <Form.Item
                        label={
                          <span>
                            提示词{" "}
                            <Tooltip title="允许此密钥使用特定的提示词模板">
                              <a
                                href="https://docs.litellm.ai/docs/proxy/prompt_management"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                              </a>
                            </Tooltip>
                          </span>
                        }
                        name="prompts"
                        className="mt-4"
                        help="选择现有提示词或输入新的"
                      >
                        <Select
                          mode="tags"
                          style={{ width: "100%" }}
                          placeholder={t("keyDetail.settings.placeholders.selectPrompts")}
                          options={promptsList.map((name) => ({ value: name, label: name }))}
                        />
                      </Form.Item>
                    </>
                  )}
                  <Form.Item
                    label={
                      <span>
                        访问组{" "}
                        <Tooltip title="为此密钥分配访问组。访问组控制此密钥可以使用的模型、MCP 服务器和智能体">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="access_group_ids"
                    className="mt-4"
                    help={t("keyDetail.settings.accessGroupsTooltip")}
                  >
                    <AccessGroupSelector
                      placeholder={t("keyDetail.settings.placeholders.selectAccessGroups")}
                    />
                  </Form.Item>
                  {premiumUser && (
                    <Form.Item
                      label={
                        <span>
                          允许的透传路由{" "}
                          <Tooltip title="允许此密钥使用特定的透传路由">
                            <a
                              href="https://docs.litellm.ai/docs/proxy/pass_through"
                              target="_blank"
                              rel="noopener noreferrer"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                            </a>
                          </Tooltip>
                        </span>
                      }
                      name="allowed_passthrough_routes"
                      className="mt-4"
                      help="选择现有透传路由或输入新的"
                    >
                      <PassThroughRoutesSelector
                        onChange={(values: string[]) => form.setFieldValue("allowed_passthrough_routes", values)}
                        value={form.getFieldValue("allowed_passthrough_routes")}
                        accessToken={accessToken}
                        placeholder="选择或输入透传路由"
                        teamId={selectedCreateKeyTeam ? selectedCreateKeyTeam.team_id : null}
                      />
                    </Form.Item>
                  )}
                  <Form.Item
                    label={
                      <span>
                        允许的向量库{" "}
                        <Tooltip title="选择此密钥可以访问的向量库。如果未选择，密钥将可以访问所有可用的向量库">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="allowed_vector_store_ids"
                    className="mt-4"
                    help={t("keyDetail.settings.vectorStores")}
                  >
                    <VectorStoreSelector
                      onChange={(values: string[]) => form.setFieldValue("allowed_vector_store_ids", values)}
                      value={form.getFieldValue("allowed_vector_store_ids")}
                      accessToken={accessToken}
                      placeholder={t("keyDetail.settings.placeholders.selectVectorStores")}
                    />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        元数据{" "}
                        <Tooltip title="包含有关此密钥的附加信息的 JSON 对象。用于跟踪或自定义逻辑">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="metadata"
                    className="mt-4"
                  >
                    <Input.TextArea rows={4} placeholder={t("keyDetail.settings.metadataLabel")} />
                  </Form.Item>
                  <Form.Item
                    label={
                      <span>
                        标签{" "}
                        <Tooltip title="用于跟踪消费和/或进行基于标签的路由。用于分析和过滤">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    name="tags"
                    className="mt-4"
                    help={`用于跟踪消费和/或进行基于标签的路由。`}
                  >
                    <Select
                      mode="tags"
                      style={{ width: "100%" }}
                      placeholder={t("keyDetail.settings.placeholders.selectTags")}
                      tokenSeparators={[","]}
                      options={predefinedTags}
                    />
                  </Form.Item>
                  <Accordion className="mt-4 mb-4">
                    <AccordionHeader>
                      <b>MCP 设置</b>
                    </AccordionHeader>
                    <AccordionBody>
                      <Form.Item
                        label={
                          <span>
                            允许的 MCP 服务器{" "}
                            <Tooltip title="选择此密钥可以访问的 MCP 服务器或访问组">
                              <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                            </Tooltip>
                          </span>
                        }
                        name="allowed_mcp_servers_and_groups"
                        help={t("keyDetail.settings.mcpServers")}
                      >
                        <MCPServerSelector
                          onChange={(val: any) => form.setFieldValue("allowed_mcp_servers_and_groups", val)}
                          value={form.getFieldValue("allowed_mcp_servers_and_groups")}
                          accessToken={accessToken}
                          placeholder={t("keyDetail.settings.placeholders.selectMcpServers")}
                        />
                      </Form.Item>

                      {/* Hidden field to register mcp_tool_permissions with the form */}
                      <Form.Item name="mcp_tool_permissions" initialValue={{}} hidden>
                        <Input type="hidden" />
                      </Form.Item>

                      <Form.Item
                        noStyle
                        shouldUpdate={(prevValues, currentValues) =>
                          prevValues.allowed_mcp_servers_and_groups !== currentValues.allowed_mcp_servers_and_groups ||
                          prevValues.mcp_tool_permissions !== currentValues.mcp_tool_permissions
                        }
                      >
                        {() => (
                          <div className="mt-6">
                            <MCPToolPermissions
                              accessToken={accessToken}
                              selectedServers={form.getFieldValue("allowed_mcp_servers_and_groups")?.servers || []}
                              toolPermissions={form.getFieldValue("mcp_tool_permissions") || {}}
                              onChange={(toolPerms) => form.setFieldsValue({ mcp_tool_permissions: toolPerms })}
                            />
                          </div>
                        )}
                      </Form.Item>
                    </AccordionBody>
                  </Accordion>

                  <Accordion className="mt-4 mb-4">
                    <AccordionHeader>
                      <b>智能体设置</b>
                    </AccordionHeader>
                    <AccordionBody>
                      <Form.Item
                        label={
                          <span>
                            允许的智能体{" "}
                            <Tooltip title="选择此密钥可以访问的智能体或访问组">
                              <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                            </Tooltip>
                          </span>
                        }
                        name="allowed_agents_and_groups"
                        help={t("keyDetail.settings.agents")}
                      >
                        <AgentSelector
                          onChange={(val: any) => form.setFieldValue("allowed_agents_and_groups", val)}
                          value={form.getFieldValue("allowed_agents_and_groups")}
                          accessToken={accessToken}
                          placeholder={t("keyDetail.settings.placeholders.selectAgents")}
                        />
                      </Form.Item>
                    </AccordionBody>
                  </Accordion>

                  {premiumUser && (
                    <Accordion className="mt-4 mb-4">
                      <AccordionHeader>
                        <b>日志设置</b>
                      </AccordionHeader>
                      <AccordionBody>
                        <div className="mt-4">
                          <PremiumLoggingSettings
                            value={loggingSettings}
                            onChange={setLoggingSettings}
                            premiumUser={true}
                            disabledCallbacks={disabledCallbacks}
                            onDisabledCallbacksChange={setDisabledCallbacks}
                          />
                        </div>
                      </AccordionBody>
                    </Accordion>
                  )}

                  <Accordion key={`router-settings-accordion-${routerSettingsKey}`} className="mt-4 mb-4">
                    <AccordionHeader>
                      <b>路由设置</b>
                    </AccordionHeader>
                    <AccordionBody>
                      <div className="mt-4 w-full">
                        <RouterSettingsAccordion
                          key={routerSettingsKey}
                          accessToken={accessToken || ""}
                          value={routerSettings || undefined}
                          onChange={setRouterSettings}
                          modelData={userModels.length > 0 ? { data: userModels.map((model) => ({ model_name: model })) } : undefined}
                        />
                      </div>
                    </AccordionBody>
                  </Accordion>

                  <Accordion className="mt-4 mb-4">
                    <AccordionHeader>
                      <b>模型别名</b>
                    </AccordionHeader>
                    <AccordionBody>
                      <div className="mt-4">
                        <Text className="text-sm text-gray-600 mb-4">
                          为模型创建可在 API 调用中使用的自定义别名。这允许您为特定模型创建快捷方式。
                          shortcuts for specific models.
                        </Text>
                        <ModelAliasManager
                          accessToken={accessToken}
                          initialModelAliases={modelAliases}
                          onAliasUpdate={setModelAliases}
                          showExampleConfig={false}
                        />
                      </div>
                    </AccordionBody>
                  </Accordion>

                  <Accordion className="mt-4 mb-4">
                    <AccordionHeader>
                      <b>密钥生命周期</b>
                    </AccordionHeader>
                    <AccordionBody>
                      <div className="mt-4">
                        <KeyLifecycleSettings
                          form={form}
                          autoRotationEnabled={autoRotationEnabled}
                          onAutoRotationChange={setAutoRotationEnabled}
                          rotationInterval={rotationInterval}
                          onRotationIntervalChange={setRotationInterval}
                          isCreateMode={true}
                        />
                      </div>
                    </AccordionBody>
                    <Form.Item name="duration" hidden initialValue={null}>
                      <Input />
                    </Form.Item>
                  </Accordion>
                  <Accordion className="mt-4 mb-4">
                    <AccordionHeader>
                      <div className="flex items-center gap-2">
                        <b>高级设置</b>
                        <Tooltip
                          title={
                            <span>
                              在我们的文档中了解更多关于高级设置的信息{" "}
                              <a
                                href={
                                  proxyBaseUrl
                                    ? `${proxyBaseUrl}/#/key%20management/generate_key_fn_key_generate_post`
                                    : `/#/key%20management/generate_key_fn_key_generate_post`
                                }
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300"
                              >
                                文档
                              </a>
                            </span>
                          }
                        >
                          <InfoCircleOutlined className="text-gray-400 hover:text-gray-300 cursor-help" />
                        </Tooltip>
                      </div>
                    </AccordionHeader>
                    <AccordionBody>
                      <SchemaFormFields
                        schemaComponent="GenerateKeyRequest"
                        form={form}
                        excludedFields={[
                          "key_alias",
                          "team_id",
                          "models",
                          "duration",
                          "metadata",
                          "tags",
                          "guardrails",
                          "max_budget",
                          "budget_duration",
                          "tpm_limit",
                          "rpm_limit",
                        ]}
                      />
                    </AccordionBody>
                  </Accordion>
                </AccordionBody>
              </Accordion>
            </div>
          )}

          <div style={{ textAlign: "right", marginTop: "10px" }}>
            <Button2 htmlType="submit" disabled={isFormDisabled} style={{ opacity: isFormDisabled ? 0.5 : 1 }}>
              创建密钥
            </Button2>
          </div>
        </Form>
      </Modal>

      {/* Add the Create User Modal */}
      {isCreateUserModalVisible && (
        <Modal
          title="创建新用户"
          open={isCreateUserModalVisible}
          onCancel={() => setIsCreateUserModalVisible(false)}
          footer={null}
          width={800}
        >
          <CreateUserButton
            userID={userID}
            accessToken={accessToken}
            teams={teams}
            possibleUIRoles={possibleUIRoles}
            onUserCreated={handleUserCreated}
            isEmbedded={true}
          />
        </Modal>
      )}

      {apiKey && (
        <Modal open={isModalVisible} onOk={handleOk} onCancel={handleCancel} footer={null}>
          <Grid numItems={1} className="gap-2 w-full">
            <Title>保存您的密钥</Title>
            <Col numColSpan={1}>
              {apiKey != null ? (
                <CreatedKeyDisplay apiKey={apiKey} />
              ) : (
                <Text>密钥创建中，这可能需要 30 秒</Text>
              )}
            </Col>
          </Grid>
        </Modal>
      )}
    </div>
  );
};

export default CreateKey;
