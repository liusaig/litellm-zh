import { InfoCircleOutlined, UserAddOutlined } from "@ant-design/icons";
import { useQueryClient } from "@tanstack/react-query";
import { Button as Button2, SelectItem, TextInput } from "@tremor/react";
import { Alert, Button, Form, Input, InputNumber, Modal, Select, Select as Select2, Space, Tooltip, Typography } from "antd";
import React, { useEffect, useState } from "react";
import BulkCreateUsers from "./bulk_create_users_button";
import BudgetDurationDropdown from "./common_components/budget_duration_dropdown";
import TeamDropdown from "./common_components/team_dropdown";
import { getModelDisplayName } from "./key_team_helpers/fetch_available_models_team_key";
import NotificationsManager from "./molecules/notifications_manager";
import {
  getProxyBaseUrl,
  getProxyUISettings,
  invitationCreateCall,
  modelAvailableCall,
  userCreateCall,
} from "./networking";
import OnboardingModal, { InvitationLink } from "./onboarding_link";
const { Option } = Select;
const { Text, Link, Title } = Typography;
// Helper function to generate UUID compatible across all environments
const generateUUID = (): string => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback UUID generation for environments without crypto.randomUUID
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0;
    const v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

interface CreateuserProps {
  userID: string;
  accessToken: string;
  teams: any[] | null;
  possibleUIRoles: null | Record<string, Record<string, string>>;
  onUserCreated?: (userId: string) => void;
  isEmbedded?: boolean;
}

// Define an interface for the UI settings
interface UISettings {
  PROXY_BASE_URL: string | null;
  PROXY_LOGOUT_URL: string | null;
  DEFAULT_TEAM_DISABLED: boolean;
  SSO_ENABLED: boolean;
}

export const CreateUserButton: React.FC<CreateuserProps> = ({
  userID, accessToken, teams, possibleUIRoles, onUserCreated, isEmbedded = false }) => {
  const FORM_ITEM_MARGIN = 28;
  const FORM_ITEM_WITH_HELP_MARGIN = 44;
  const queryClient = useQueryClient();
  const [uiSettings, setUISettings] = useState<UISettings | null>(null);
  const [form] = Form.useForm();
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [apiuser, setApiuser] = useState<boolean>(false);
  const [userModels, setUserModels] = useState<string[]>([]);
  const [isInvitationLinkModalVisible, setIsInvitationLinkModalVisible] = useState(false);
  const [invitationLinkData, setInvitationLinkData] = useState<InvitationLink | null>(null);
  const [baseUrl, setBaseUrl] = useState<string | null>(null);
  useEffect(() => {
    const fetchData = async () => {
      try {
        const userRole = "any";
        const modelDataResponse = await modelAvailableCall(accessToken, userID, userRole);
        const availableModels = [];
        for (let i = 0; i < modelDataResponse.data.length; i++) {
          const model = modelDataResponse.data[i];
          availableModels.push(model.id);
        }
        setUserModels(availableModels);
        const uiSettingsResponse = await getProxyUISettings(accessToken);
        setUISettings(uiSettingsResponse);
      } catch (error) {
        console.error("Error fetching model data:", error);
      }
    };

    setBaseUrl(getProxyBaseUrl());
    fetchData();
  }, []);

  const handleOk = () => {
    setIsModalVisible(false);
    form.resetFields();
  };

  const handleCancel = () => {
    setIsModalVisible(false);
    setApiuser(false);
    form.resetFields();
  };

  const handleCreate = async (
    formValues: {
      user_id?: string;
      user_alias?: string;
      user_email?: string;
      models?: string[];
      user_role: string;
      max_budget?: number | null;
      budget_duration?: string;
    },
  ) => {
    try {
      NotificationsManager.info("正在发起请求");
      if (!isEmbedded) {
        setIsModalVisible(true);
      }
      if ((!formValues.models || formValues.models.length === 0) && formValues.user_role !== "proxy_admin") {
        formValues.models = ["no-default-models"];
      }
      const response = await userCreateCall(accessToken, null, formValues);
      await queryClient.invalidateQueries({ queryKey: ["userList"] });
      setApiuser(true);
      const user_id = response.data?.user_id || response.user_id;

      if (onUserCreated && isEmbedded) {
        onUserCreated(user_id);
        form.resetFields();
        return;
      }

      if (!uiSettings?.SSO_ENABLED) {
        invitationCreateCall(accessToken, user_id).then((data) => {
          data.has_user_setup_sso = false;
          setInvitationLinkData(data);
          setIsInvitationLinkModalVisible(true);
        });
      } else {
        // create an InvitationLink Object for this user for the SSO flow
        // for SSO the invite link is the proxy base url since the User just needs to login
        const invitationLink: InvitationLink = {
          id: generateUUID(), // Generate a unique ID
          user_id: user_id,
          is_accepted: false,
          accepted_at: null,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Set expiry to 7 days from now
          created_at: new Date(),
          created_by: userID, // Assuming userID is the current user creating the invitation
          updated_at: new Date(),
          updated_by: userID,
          has_user_setup_sso: true,
        };
        setInvitationLinkData(invitationLink);
        setIsInvitationLinkModalVisible(true);
      }

      NotificationsManager.success("用户创建成功");
      form.resetFields();
      localStorage.removeItem("userData" + userID);
    } catch (error: any) {
      const errorMessage = error.response?.data?.detail || error?.message || "创建用户失败";
      NotificationsManager.fromBackend(errorMessage);
      console.error("Error creating the user:", error);
    }
  };

  // Modify the return statement to handle embedded mode
  if (isEmbedded) {
    return (
      <Form form={form} onFinish={handleCreate} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left">
        <Alert
          message="邮件邀请"
          description={
            <>
              仅当配置了邮件集成（SMTP、Resend 或 SendGrid）时，新用户才会收到邮件邀请。
              {" "}
              <Link href="https://docs.litellm.ai/docs/proxy/email" target="_blank">
                查看邮件通知配置方法
              </Link>
            </>
          }
          type="info"
          showIcon
          className="mb-4"
        />
        <Form.Item label="用户名" name="user_email">
          <TextInput placeholder="请输入用户名" />
        </Form.Item>
        <Form.Item label="用户角色" name="user_role">
          <Select2 placeholder="请选择角色">
            {possibleUIRoles &&
              Object.entries(possibleUIRoles).map(([role, { ui_label, description }]) => (
                <SelectItem key={role} value={role} title={ui_label}>
                  <div className="flex">
                    {ui_label}{" "}
                    <Text className="ml-2" style={{ color: "gray", fontSize: "12px" }}>
                      {description}
                    </Text>
                  </div>
                </SelectItem>
              ))}
          </Select2>
        </Form.Item>
        <Form.Item label="分组" name="team_id">
          <Select placeholder="选择分组" style={{ width: "100%" }}>
            <TeamDropdown teams={teams} />
          </Select>
        </Form.Item>

        <Form.Item label="元数据" name="metadata">
          <Input.TextArea rows={4} placeholder="请输入 JSON 格式元数据" />
        </Form.Item>
        <Form.Item
          label="预算上限"
          name="max_budget"
          tooltip="留空表示不限额"
        >
          <InputNumber min={0} step={0.01} style={{ width: "100%" }} placeholder="例如 100" />
        </Form.Item>
        <Form.Item label="预算重置周期" name="budget_duration">
          <BudgetDurationDropdown onChange={(value) => form.setFieldValue("budget_duration", value)} />
        </Form.Item>

        <div style={{ textAlign: "right", marginTop: "10px" }}>
          <Button htmlType="submit">创建用户</Button>
        </div>
      </Form>
    );
  }

  // Original return for standalone mode
  return (
    <div className="flex gap-2">
      <Button2 className="mb-0" onClick={() => setIsModalVisible(true)}>
        + 创建用户
      </Button2>
      <BulkCreateUsers accessToken={accessToken} teams={teams} possibleUIRoles={possibleUIRoles} />
      <Modal
        title="创建用户"
        open={isModalVisible}
        width={800}
        footer={null}
        onOk={handleOk}
        onCancel={handleCancel}
      >
        <Space direction="vertical" size="middle" style={{ marginBottom: 28 }}>
          <Text>创建可管理密钥的用户</Text>
        </Space>
        <Form form={form} onFinish={handleCreate} labelCol={{ span: 8 }} wrapperCol={{ span: 16 }} labelAlign="left">
          <Form.Item label="用户名" name="user_email" style={{ marginBottom: FORM_ITEM_MARGIN }}>
            <Input placeholder="请输入用户名" />
          </Form.Item>
          <Form.Item
            style={{ marginBottom: FORM_ITEM_MARGIN }}
            label={
              <span>
                角色{" "}
                <Tooltip title="该角色独立于任何分组/组织角色。分组/组织管理员请在设置中配置。">
                  <InfoCircleOutlined />
                </Tooltip>
              </span>
            }
            name="user_role"
          >
            <Select2 placeholder="请选择角色">
              {possibleUIRoles &&
                Object.entries(possibleUIRoles).map(([role, { ui_label, description }]) => (
                  <SelectItem key={role} value={role} title={ui_label}>
                    <Text>
                      {ui_label}
                    </Text>
                    <Text type="secondary">
                      {" - "}{description}
                    </Text>
                  </SelectItem>
                ))}
            </Select2>
          </Form.Item>

          <Form.Item
            label="分组"
            name="team_id"
            help="选择后，用户会以“user”角色加入该分组。"
            style={{ marginBottom: FORM_ITEM_WITH_HELP_MARGIN }}
          >
            <TeamDropdown teams={teams} />
          </Form.Item>
          <Form.Item
            style={{ marginBottom: FORM_ITEM_WITH_HELP_MARGIN }}
            label={
              <span>
                模型{" "}
                <Tooltip title="用户在分组范围外可访问的模型。">
                  <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                </Tooltip>
              </span>
            }
            name="models"
            help="用户在分组范围外可访问的模型。"
          >
            <Select2 mode="multiple" placeholder="选择模型" style={{ width: "100%" }}>
              <Select2.Option key="all-proxy-models" value="all-proxy-models">
                全部模型
              </Select2.Option>
              <Select2.Option key="no-default-models" value="no-default-models">
                无默认模型
              </Select2.Option>
              {userModels.map((model) => (
                <Select2.Option key={model} value={model}>
                  {getModelDisplayName(model)}
                </Select2.Option>
              ))}
            </Select2>
          </Form.Item>
          <Form.Item
            label="预算上限"
            name="max_budget"
            tooltip="留空表示不限额"
            help="限制该用户的可用预算，留空表示无限制。"
            style={{ marginBottom: FORM_ITEM_WITH_HELP_MARGIN }}
          >
            <InputNumber min={0} step={0.01} style={{ width: "100%" }} placeholder="例如 100" />
          </Form.Item>
          <Form.Item
            label="预算重置周期"
            name="budget_duration"
            help="可选。设置后按周期自动重置预算。"
            style={{ marginBottom: FORM_ITEM_WITH_HELP_MARGIN }}
          >
            <BudgetDurationDropdown onChange={(value) => form.setFieldValue("budget_duration", value)} />
          </Form.Item>
          <div style={{ textAlign: "right", marginTop: "10px" }}>
            <Button type="primary" icon={<UserAddOutlined />} htmlType="submit">创建用户</Button>
          </div>
        </Form>
      </Modal>
      {apiuser && (
        <OnboardingModal
          isInvitationLinkModalVisible={isInvitationLinkModalVisible}
          setIsInvitationLinkModalVisible={setIsInvitationLinkModalVisible}
          baseUrl={baseUrl || ""}
          invitationLinkData={invitationLinkData}
        />
      )}
    </div>
  );
};
