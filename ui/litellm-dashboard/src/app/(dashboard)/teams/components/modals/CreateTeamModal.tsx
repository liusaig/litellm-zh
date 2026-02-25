import { Button as Button2, Form, Input, Modal, Select as Select2, Switch, Tooltip } from "antd";
import { Accordion, AccordionBody, AccordionHeader, Text, TextInput } from "@tremor/react";
import { InfoCircleOutlined } from "@ant-design/icons";
import {
  fetchAvailableModelsForTeamOrKey,
  getModelDisplayName,
  unfurlWildcardModelsInList,
} from "@/components/key_team_helpers/fetch_available_models_team_key";
import NumericalInput from "@/components/shared/numerical_input";
import VectorStoreSelector from "@/components/vector_store_management/VectorStoreSelector";
import MCPServerSelector from "@/components/mcp_server_management/MCPServerSelector";
import AgentSelector from "@/components/agent_management/AgentSelector";
import PremiumLoggingSettings from "@/components/common_components/PremiumLoggingSettings";
import ModelAliasManager from "@/components/common_components/ModelAliasManager";
import React, { useEffect, useState } from "react";
import NotificationsManager from "@/components/molecules/notifications_manager";
import { fetchMCPAccessGroups, getGuardrailsList, getPoliciesList, Organization, Team, teamCreateCall } from "@/components/networking";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import MCPToolPermissions from "@/components/mcp_server_management/MCPToolPermissions";

interface ModelAliases {
  [key: string]: string;
}

interface CreateTeamModalProps {
  isTeamModalVisible: boolean;
  handleOk: () => void;
  handleCancel: () => void;
  currentOrg: Organization | null;
  organizations: Organization[] | null;
  teams: Team[] | null;
  setTeams: (teams: Team[] | null) => void;
  modelAliases: ModelAliases;
  setModelAliases: (modelAliases: ModelAliases) => void;
  loggingSettings: any[];
  setLoggingSettings: (loggingSettings: any[]) => void;
  setIsTeamModalVisible: (isTeamModalVisible: boolean) => void;
}

const getOrganizationModels = (organization: Organization | null, userModels: string[]) => {
  let tempModelsToPick = [];

  if (organization) {
    if (organization.models.length > 0) {
      console.log(`organization.models: ${organization.models}`);
      tempModelsToPick = organization.models;
    } else {
      // show all available models if the team has no models set
      tempModelsToPick = userModels;
    }
  } else {
    // no team set, show all available models
    tempModelsToPick = userModels;
  }

  return unfurlWildcardModelsInList(tempModelsToPick, userModels);
};

const CreateTeamModal = ({
  isTeamModalVisible,
  handleOk,
  handleCancel,
  currentOrg,
  organizations,
  teams,
  setTeams,
  modelAliases,
  setModelAliases,
  loggingSettings,
  setLoggingSettings,
  setIsTeamModalVisible,
}: CreateTeamModalProps) => {
  const { userId: userID, userRole, accessToken, premiumUser } = useAuthorized();
  const [form] = Form.useForm();
  const [userModels, setUserModels] = useState<string[]>([]);
  const [currentOrgForCreateTeam, setCurrentOrgForCreateTeam] = useState<Organization | null>(null);
  const [modelsToPick, setModelsToPick] = useState<string[]>([]);
  const [guardrailsList, setGuardrailsList] = useState<string[]>([]);
  const [policiesList, setPoliciesList] = useState<string[]>([]);
  const [mcpAccessGroups, setMcpAccessGroups] = useState<string[]>([]);
  const [mcpAccessGroupsLoaded, setMcpAccessGroupsLoaded] = useState(false);

  useEffect(() => {
    const fetchUserModels = async () => {
      try {
        if (userID === null || userRole === null || accessToken === null) {
          return;
        }
        const models = await fetchAvailableModelsForTeamOrKey(userID, userRole, accessToken);
        if (models) {
          setUserModels(models);
        }
      } catch (error) {
        console.error("Error fetching user models:", error);
      }
    };

    fetchUserModels();
  }, [accessToken, userID, userRole, teams]);

  useEffect(() => {
    console.log(`currentOrgForCreateTeam: ${currentOrgForCreateTeam}`);
    const models = getOrganizationModels(currentOrgForCreateTeam, userModels);
    console.log(`models: ${models}`);
    setModelsToPick(models);
    form.setFieldValue("models", []);
  }, [currentOrgForCreateTeam, userModels, form]);

  const fetchMcpAccessGroups = async () => {
    try {
      if (accessToken == null) {
        return;
      }
      const groups = await fetchMCPAccessGroups(accessToken);
      setMcpAccessGroups(groups);
    } catch (error) {
      console.error("Failed to fetch MCP access groups:", error);
    }
  };

  useEffect(() => {
    fetchMcpAccessGroups();
  }, [accessToken, fetchMcpAccessGroups]);

  useEffect(() => {
    const fetchGuardrails = async () => {
      try {
        if (accessToken == null) {
          return;
        }

        const response = await getGuardrailsList(accessToken);
        const guardrailNames = response.guardrails.map((g: { guardrail_name: string }) => g.guardrail_name);
        setGuardrailsList(guardrailNames);
      } catch (error) {
        console.error("Failed to fetch guardrails:", error);
      }
    };

    const fetchPolicies = async () => {
      try {
        if (accessToken == null) {
          return;
        }

        const response = await getPoliciesList(accessToken);
        const policyNames = response.policies.map((p: { policy_name: string }) => p.policy_name);
        setPoliciesList(policyNames);
      } catch (error) {
        console.error("Failed to fetch policies:", error);
      }
    };

    fetchGuardrails();
    fetchPolicies();
  }, [accessToken]);

  const handleCreate = async (formValues: Record<string, any>) => {
    try {
      console.log(`formValues: ${JSON.stringify(formValues)}`);
      if (accessToken != null) {
        const newTeamAlias = formValues?.team_alias;
        const existingTeamAliases = teams?.map((t) => t.team_alias) ?? [];
        let organizationId = formValues?.organization_id || currentOrg?.organization_id;
        if (organizationId === "" || typeof organizationId !== "string") {
          formValues.organization_id = null;
        } else {
          formValues.organization_id = organizationId.trim();
        }

        // Remove guardrails from top level since it's now in metadata
        if (existingTeamAliases.includes(newTeamAlias)) {
          throw new Error(`Team alias ${newTeamAlias} already exists, please pick another alias`);
        }

        NotificationsManager.info("正在创建分组");

        // Handle logging settings in metadata
        if (loggingSettings.length > 0) {
          let metadata = {};
          if (formValues.metadata) {
            try {
              metadata = JSON.parse(formValues.metadata);
            } catch (e) {
              console.warn("Invalid JSON in metadata field, starting with empty object");
            }
          }

          // Add logging settings to metadata
          metadata = {
            ...metadata,
            logging: loggingSettings.filter((config) => config.callback_name), // Only include configs with callback_name
          };

          formValues.metadata = JSON.stringify(metadata);
        }

        if (formValues.secret_manager_settings) {
          if (typeof formValues.secret_manager_settings === "string") {
            if (formValues.secret_manager_settings.trim() === "") {
              delete formValues.secret_manager_settings;
            } else {
              try {
                formValues.secret_manager_settings = JSON.parse(formValues.secret_manager_settings);
              } catch (e) {
                throw new Error("Failed to parse secret manager settings: " + e);
              }
            }
          }
        }

        // Transform allowed_vector_store_ids and allowed_mcp_servers_and_groups into object_permission
        if (
          (formValues.allowed_vector_store_ids && formValues.allowed_vector_store_ids.length > 0) ||
          (formValues.allowed_mcp_servers_and_groups &&
            (formValues.allowed_mcp_servers_and_groups.servers?.length > 0 ||
              formValues.allowed_mcp_servers_and_groups.accessGroups?.length > 0 ||
              formValues.allowed_mcp_servers_and_groups.toolPermissions))
        ) {
          formValues.object_permission = {};
          if (formValues.allowed_vector_store_ids && formValues.allowed_vector_store_ids.length > 0) {
            formValues.object_permission.vector_stores = formValues.allowed_vector_store_ids;
            delete formValues.allowed_vector_store_ids;
          }
          if (formValues.allowed_mcp_servers_and_groups) {
            const { servers, accessGroups } = formValues.allowed_mcp_servers_and_groups;
            if (servers && servers.length > 0) {
              formValues.object_permission.mcp_servers = servers;
            }
            if (accessGroups && accessGroups.length > 0) {
              formValues.object_permission.mcp_access_groups = accessGroups;
            }
            delete formValues.allowed_mcp_servers_and_groups;
          }

          // Add tool permissions separately
          if (formValues.mcp_tool_permissions && Object.keys(formValues.mcp_tool_permissions).length > 0) {
            if (!formValues.object_permission) {
              formValues.object_permission = {};
            }
            formValues.object_permission.mcp_tool_permissions = formValues.mcp_tool_permissions;
            delete formValues.mcp_tool_permissions;
          }

          // Handle agent permissions
          if (formValues.allowed_agents_and_groups) {
            const { agents, accessGroups } = formValues.allowed_agents_and_groups;
            if (!formValues.object_permission) {
              formValues.object_permission = {};
            }
            if (agents && agents.length > 0) {
              formValues.object_permission.agents = agents;
            }
            if (accessGroups && accessGroups.length > 0) {
              formValues.object_permission.agent_access_groups = accessGroups;
            }
            delete formValues.allowed_agents_and_groups;
          }
        }

        // Transform allowed_mcp_access_groups into object_permission
        if (formValues.allowed_mcp_access_groups && formValues.allowed_mcp_access_groups.length > 0) {
          if (!formValues.object_permission) {
            formValues.object_permission = {};
          }
          formValues.object_permission.mcp_access_groups = formValues.allowed_mcp_access_groups;
          delete formValues.allowed_mcp_access_groups;
        }

        // Add model_aliases if any are defined
        if (Object.keys(modelAliases).length > 0) {
          formValues.model_aliases = modelAliases;
        }

        const response: any = await teamCreateCall(accessToken, formValues);
        if (teams !== null) {
          setTeams([...teams, response]);
        } else {
          setTeams([response]);
        }
        console.log(`response for team create call: ${response}`);
        NotificationsManager.success("分组创建成功");
        form.resetFields();
        setLoggingSettings([]);
        setModelAliases({});
        setIsTeamModalVisible(false);
      }
    } catch (error) {
      console.error("Error creating the team:", error);
      NotificationsManager.fromBackend("创建分组失败: " + error);
    }
  };

  return (
    <Modal
      title="创建分组"
      open={isTeamModalVisible}
      width={1000}
      footer={null}
      onOk={handleOk}
      onCancel={handleCancel}
    >
      <Form form={form} onFinish={handleCreate} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left">
        <>
          <Form.Item
            label="分组名称"
            name="team_alias"
            rules={[
              {
                required: true,
                message: "请输入分组名称",
              },
            ]}
          >
            <TextInput placeholder="请输入名称" />
          </Form.Item>
          <Form.Item
            label={
              <span>
                组织{" "}
                <Tooltip
                  title={
                    <span>
                      一个组织可以包含多个分组。了解更多请查看{" "}
                      <a
                        href="https://docs.litellm.ai/docs/proxy/user_management_heirarchy"
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          color: "#1890ff",
                          textDecoration: "underline",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      >
                        用户管理层级
                      </a>
                    </span>
                  }
                >
                  <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                </Tooltip>
              </span>
            }
            name="organization_id"
            initialValue={currentOrg ? currentOrg.organization_id : null}
            className="mt-8"
          >
            <Select2
              showSearch
              allowClear
              placeholder="搜索或选择组织"
              onChange={(value) => {
                form.setFieldValue("organization_id", value);
                setCurrentOrgForCreateTeam(organizations?.find((org) => org.organization_id === value) || null);
              }}
              filterOption={(input, option) => {
                if (!option) return false;
                const optionValue = option.children?.toString() || "";
                return optionValue.toLowerCase().includes(input.toLowerCase());
              }}
              optionFilterProp="children"
            >
              {organizations?.map((org) => (
                <Select2.Option key={org.organization_id} value={org.organization_id}>
                  <span className="font-medium">{org.organization_alias}</span>{" "}
                  <span className="text-gray-500">({org.organization_id})</span>
                </Select2.Option>
              ))}
            </Select2>
          </Form.Item>
          <Form.Item
            label={
              <span>
                模型{" "}
                <Tooltip title="这些是当前分组可访问的模型">
                  <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                </Tooltip>
              </span>
            }
            name="models"
          >
            <Select2 mode="multiple" placeholder="选择模型" style={{ width: "100%" }}>
              <Select2.Option key="all-proxy-models" value="all-proxy-models">
                所有代理模型
              </Select2.Option>
              {modelsToPick.map((model) => (
                <Select2.Option key={model} value={model}>
                  {getModelDisplayName(model)}
                </Select2.Option>
              ))}
            </Select2>
          </Form.Item>

          <Form.Item label="最大预算" name="max_budget">
            <NumericalInput step={0.01} precision={2} width={200} placeholder="请输入数值" />
          </Form.Item>
          <Form.Item className="mt-8" label="预算重置周期" name="budget_duration">
            <Select2 defaultValue={null} placeholder="不适用">
              <Select2.Option value="24h">每天</Select2.Option>
              <Select2.Option value="7d">每周</Select2.Option>
              <Select2.Option value="30d">每月</Select2.Option>
            </Select2>
          </Form.Item>
          <Form.Item label="每分钟 Token 限制 (TPM)" name="tpm_limit">
            <NumericalInput step={1} width={400} placeholder="请输入数值" />
          </Form.Item>
          <Form.Item label="每分钟请求限制 (RPM)" name="rpm_limit">
            <NumericalInput step={1} width={400} placeholder="请输入数值" />
          </Form.Item>

          <Accordion
            className="mt-20 mb-8"
            onClick={() => {
              if (!mcpAccessGroupsLoaded) {
                fetchMcpAccessGroups();
                setMcpAccessGroupsLoaded(true);
              }
            }}
          >
            <AccordionHeader>
              <b>高级设置</b>
            </AccordionHeader>
            <AccordionBody>
              <Accordion className="mb-4">
                <AccordionHeader>
                  <b>其他设置</b>
                </AccordionHeader>
                <AccordionBody>
                  <Form.Item
                label="分组 ID"
                name="team_id"
                help="要创建的分组 ID，不填则自动生成。"
              >
                <TextInput
                  onChange={(e) => {
                    e.target.value = e.target.value.trim();
                  }}
                />
              </Form.Item>
                  <Form.Item
                label="分组成员预算"
                name="team_member_budget"
                normalize={(value) => (value ? Number(value) : undefined)}
                tooltip="这是该分组内单个成员的预算上限。"
              >
                <NumericalInput step={0.01} precision={2} width={200} placeholder="请输入数值" />
              </Form.Item>
                  <Form.Item
                label="分组成员密钥时长（如：1d、1mo）"
                name="team_member_key_duration"
                tooltip="设置分组成员密钥的有效时长。格式：30s（秒）、30m（分钟）、30h（小时）、30d（天）、1mo（月）"
              >
                <TextInput placeholder="例如：30d" />
              </Form.Item>
                  <Form.Item
                label="分组成员 RPM 限制"
                name="team_member_rpm_limit"
                tooltip="分组内单个成员的 RPM（每分钟请求数）限制"
              >
                <NumericalInput step={1} width={400} placeholder="请输入数值" />
              </Form.Item>
                  <Form.Item
                label="分组成员 TPM 限制"
                name="team_member_tpm_limit"
                tooltip="分组内单个成员的 TPM（每分钟 Token 数）限制"
              >
                <NumericalInput step={1} width={400} placeholder="请输入数值" />
              </Form.Item>
                  <Form.Item
                label="元数据"
                name="metadata"
                help="分组附加元数据，请输入 JSON 对象。"
              >
                <Input.TextArea rows={4} />
              </Form.Item>
                  <Form.Item
                label="密钥管理器设置"
                name="secret_manager_settings"
                help={
                  premiumUser
                    ? "请输入密钥管理器配置（JSON 对象）。"
                    : "高级功能：升级后可配置密钥管理器设置。"
                }
                rules={[
                  {
                    validator: async (_, value) => {
                      if (!value) {
                        return Promise.resolve();
                      }
                      try {
                        JSON.parse(value);
                        return Promise.resolve();
                      } catch (error) {
                        return Promise.reject(new Error("请输入有效的 JSON"));
                      }
                    },
                  },
                ]}
              >
                <Input.TextArea
                  rows={4}
                  placeholder='{"namespace": "admin", "mount": "secret", "path_prefix": "litellm"}'
                  disabled={!premiumUser}
                />
              </Form.Item>
                  <Form.Item
                label={
                  <span>
                    护栏{" "}
                    <Tooltip title="配置你的第一个护栏">
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
                className="mt-8"
                help="选择已有护栏或输入新护栏"
              >
                <Select2
                  mode="tags"
                  style={{ width: "100%" }}
                  placeholder="选择或输入护栏"
                  options={guardrailsList.map((name) => ({
                    value: name,
                    label: name,
                  }))}
                />
              </Form.Item>
                  <Form.Item
                label={
                  <span>
                    禁用全局护栏{" "}
                    <Tooltip title="开启后，此分组将跳过所有“每次请求都执行”的全局护栏">
                      <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                    </Tooltip>
                  </span>
                }
                name="disable_global_guardrails"
                className="mt-4"
                valuePropName="checked"
                help="让该分组跳过全局护栏"
              >
                <Switch
                  checkedChildren="是"
                  unCheckedChildren="否"
                />
              </Form.Item>
                  <Form.Item
                label={
                  <span>
                    策略{" "}
                    <Tooltip title="将策略应用到此分组以控制护栏和其他设置">
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
                className="mt-8"
                help="选择已有策略或输入新策略"
              >
                <Select2
                  mode="tags"
                  style={{ width: "100%" }}
                  placeholder="选择或输入策略"
                  options={policiesList.map((name) => ({
                    value: name,
                    label: name,
                  }))}
                />
              </Form.Item>
                  <Form.Item
                label={
                  <span>
                    可用向量库{" "}
                    <Tooltip title="选择该分组默认可访问的向量库。留空表示可访问所有向量库">
                      <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                    </Tooltip>
                  </span>
                }
                name="allowed_vector_store_ids"
                className="mt-8"
                help="选择该分组可访问的向量库，留空表示可访问所有向量库"
              >
                <VectorStoreSelector
                  onChange={(values: string[]) => form.setFieldValue("allowed_vector_store_ids", values)}
                  value={form.getFieldValue("allowed_vector_store_ids")}
                  accessToken={accessToken || ""}
                  placeholder="选择向量库（可选）"
                />
                  </Form.Item>
                </AccordionBody>
              </Accordion>
              <div className="mt-4">
                <Accordion className="mb-4">
                  <AccordionHeader>
                    <b>MCP 设置</b>
                  </AccordionHeader>
                  <AccordionBody>
                    <Form.Item
                      label={
                        <span>
                          可用 MCP 服务{" "}
                          <Tooltip title="选择该分组可访问的 MCP 服务或访问组">
                            <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                          </Tooltip>
                        </span>
                      }
                      name="allowed_mcp_servers_and_groups"
                      className="mt-4"
                      help="选择该分组可访问的 MCP 服务或访问组"
                    >
                      <MCPServerSelector
                        onChange={(val: any) => form.setFieldValue("allowed_mcp_servers_and_groups", val)}
                        value={form.getFieldValue("allowed_mcp_servers_and_groups")}
                        accessToken={accessToken || ""}
                        placeholder="选择 MCP 服务或访问组（可选）"
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
                            accessToken={accessToken || ""}
                            selectedServers={form.getFieldValue("allowed_mcp_servers_and_groups")?.servers || []}
                            toolPermissions={form.getFieldValue("mcp_tool_permissions") || {}}
                            onChange={(toolPerms) => form.setFieldsValue({ mcp_tool_permissions: toolPerms })}
                          />
                        </div>
                      )}
                    </Form.Item>
                  </AccordionBody>
                </Accordion>

                <Accordion className="mb-4">
                  <AccordionHeader>
                    <b>智能体设置</b>
                  </AccordionHeader>
                  <AccordionBody>
                    <Form.Item
                      label={
                        <span>
                          可用智能体{" "}
                          <Tooltip title="选择该分组可访问的智能体或访问组">
                            <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                          </Tooltip>
                        </span>
                      }
                      name="allowed_agents_and_groups"
                      className="mt-4"
                      help="选择该分组可访问的智能体或访问组"
                    >
                      <AgentSelector
                        onChange={(val: any) => form.setFieldValue("allowed_agents_and_groups", val)}
                        value={form.getFieldValue("allowed_agents_and_groups")}
                        accessToken={accessToken || ""}
                        placeholder="选择智能体或访问组（可选）"
                      />
                    </Form.Item>
                  </AccordionBody>
                </Accordion>

                <Accordion className="mb-4">
                  <AccordionHeader>
                    <b>日志设置</b>
                  </AccordionHeader>
                  <AccordionBody>
                    <div className="mt-4">
                      <PremiumLoggingSettings value={loggingSettings} onChange={setLoggingSettings} premiumUser={premiumUser} />
                    </div>
                  </AccordionBody>
                </Accordion>

                <Accordion className="mb-0">
                  <AccordionHeader>
                    <b>模型别名</b>
                  </AccordionHeader>
                  <AccordionBody>
                    <div className="mt-4">
                      <Text className="text-sm text-gray-600 mb-4">
                        为模型创建可在分组成员 API 调用中使用的自定义别名，从而为特定模型提供快捷调用方式。
                      </Text>
                      <ModelAliasManager
                        accessToken={accessToken || ""}
                        initialModelAliases={modelAliases}
                        onAliasUpdate={setModelAliases}
                        showExampleConfig={false}
                      />
                    </div>
                  </AccordionBody>
                </Accordion>
              </div>
            </AccordionBody>
          </Accordion>
        </>
        <div style={{ textAlign: "right", marginTop: "10px" }}>
          <Button2 htmlType="submit">创建分组</Button2>
        </div>
      </Form>
    </Modal>
  );
};

export default CreateTeamModal;
