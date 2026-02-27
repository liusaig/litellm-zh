import { useTeams } from "@/app/(dashboard)/hooks/teams/useTeams";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatNumberWithCommas, copyToClipboard as utilCopyToClipboard } from "@/utils/dataUtils";
import { createTeamAliasMap } from "@/utils/teamUtils";
import { ArrowLeftIcon } from "@heroicons/react/outline";
import {
  Badge,
  Card,
  Grid,
  Text,
  TextInput,
  Title,
  Button as TremorButton,
} from "@tremor/react";
import { Button, Form, Input, Select, Tabs, Typography } from "antd";
import type { ColumnsType } from "antd/es/table";
import { CheckIcon, CopyIcon } from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import MemberTable from "../common_components/MemberTable";
import UserSearchModal from "../common_components/user_search_modal";
import MCPServerSelector from "../mcp_server_management/MCPServerSelector";
import { ModelSelect } from "../ModelSelect/ModelSelect";
import NotificationsManager from "../molecules/notifications_manager";
import {
  Member,
  Organization,
  organizationInfoCall,
  organizationMemberAddCall,
  organizationMemberDeleteCall,
  organizationMemberUpdateCall,
  organizationUpdateCall,
} from "../networking";
import ObjectPermissionsView from "../object_permissions_view";
import NumericalInput from "../shared/numerical_input";
import MemberModal from "../team/EditMembership";
import VectorStoreSelector from "../vector_store_management/VectorStoreSelector";

interface OrganizationInfoProps {
  organizationId: string;
  onClose: () => void;
  accessToken: string | null;
  is_org_admin: boolean;
  is_proxy_admin: boolean;
  userModels: string[];
  editOrg: boolean;
}

const OrganizationInfoView: React.FC<OrganizationInfoProps> = ({
  organizationId,
  onClose,
  accessToken,
  is_org_admin,
  is_proxy_admin,
  userModels,
  editOrg,
}) => {
  const [orgData, setOrgData] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [form] = Form.useForm();
  const [isEditing, setIsEditing] = useState(false);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [isEditMemberModalVisible, setIsEditMemberModalVisible] = useState(false);
  const [selectedEditMember, setSelectedEditMember] = useState<Member | null>(null);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [isOrgSaving, setIsOrgSaving] = useState(false);
  const canEditOrg = is_org_admin || is_proxy_admin;
  const { data: teams } = useTeams();
  const { t } = useLanguage();

  const teamAliasMap = useMemo(() => createTeamAliasMap(teams), [teams]);

  const fetchOrgInfo = async () => {
    try {
      setLoading(true);
      if (!accessToken) return;
      const response = await organizationInfoCall(accessToken, organizationId);
      setOrgData(response);
    } catch (error) {
      NotificationsManager.fromBackend(t("organizationDetail.errors.loadFailed"));
      console.error("Error fetching organization info:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrgInfo();
  }, [organizationId, accessToken]);

  const handleMemberAdd = async (values: any) => {
    try {
      if (accessToken == null) {
        return;
      }

      const member: Member = {
        user_email: values.user_email,
        user_id: values.user_id,
        role: values.role,
      };
      const response = await organizationMemberAddCall(accessToken, organizationId, member);

      NotificationsManager.success(t("organizationDetail.notifications.memberAdded"));
      setIsAddMemberModalVisible(false);
      form.resetFields();
      fetchOrgInfo();
    } catch (error) {
      NotificationsManager.fromBackend(t("organizationDetail.errors.memberAddFailed"));
      console.error("Error adding organization member:", error);
    }
  };

  const handleMemberUpdate = async (values: any) => {
    try {
      if (!accessToken) return;

      const member: Member = {
        user_email: values.user_email,
        user_id: values.user_id,
        role: values.role,
      };

      const response = await organizationMemberUpdateCall(accessToken, organizationId, member);
      NotificationsManager.success(t("organizationDetail.notifications.memberUpdated"));
      setIsEditMemberModalVisible(false);
      form.resetFields();
      fetchOrgInfo();
    } catch (error) {
      NotificationsManager.fromBackend(t("organizationDetail.errors.memberUpdateFailed"));
      console.error("Error updating organization member:", error);
    }
  };

  const handleMemberDelete = async (values: any) => {
    try {
      if (!accessToken) return;

      await organizationMemberDeleteCall(accessToken, organizationId, values.user_id);
      NotificationsManager.success(t("organizationDetail.notifications.memberDeleted"));
      setIsEditMemberModalVisible(false);
      form.resetFields();
      fetchOrgInfo();
    } catch (error) {
      NotificationsManager.fromBackend(t("organizationDetail.errors.memberDeleteFailed"));
      console.error("Error deleting organization member:", error);
    }
  };

  const handleOrgUpdate = async (values: any) => {
    try {
      if (!accessToken) return;
      setIsOrgSaving(true);

      const updateData: any = {
        organization_id: organizationId,
        organization_alias: values.organization_alias,
        models: values.models,
        litellm_budget_table: {
          tpm_limit: values.tpm_limit,
          rpm_limit: values.rpm_limit,
          max_budget: values.max_budget,
          budget_duration: values.budget_duration,
        },
        metadata: values.metadata ? JSON.parse(values.metadata) : null,
      };

      // Handle object_permission updates
      if (values.vector_stores !== undefined || values.mcp_servers_and_groups !== undefined) {
        updateData.object_permission = {
          ...orgData?.object_permission,
          vector_stores: values.vector_stores || [],
        };

        if (values.mcp_servers_and_groups !== undefined) {
          const { servers, accessGroups } = values.mcp_servers_and_groups || {
            servers: [],
            accessGroups: [],
          };
          if (servers && servers.length > 0) {
            updateData.object_permission.mcp_servers = servers;
          }
          if (accessGroups && accessGroups.length > 0) {
            updateData.object_permission.mcp_access_groups = accessGroups;
          }
        }
      }

      const response = await organizationUpdateCall(accessToken, updateData);

      NotificationsManager.success(t("organizationDetail.notifications.settingsUpdated"));
      setIsEditing(false);
      fetchOrgInfo();
    } catch (error) {
      NotificationsManager.fromBackend(t("organizationDetail.errors.settingsUpdateFailed"));
      console.error("Error updating organization:", error);
    } finally {
      setIsOrgSaving(false);
    }
  };

  if (loading) {
    return <div className="p-4">{t("organizationDetail.loading")}</div>;
  }

  if (!orgData) {
    return <div className="p-4">{t("organizationDetail.notFound")}</div>;
  }

  const copyToClipboard = async (text: string | null | undefined, key: string) => {
    const success = await utilCopyToClipboard(text);
    if (success) {
      setCopiedStates((prev) => ({ ...prev, [key]: true }));
      setTimeout(() => {
        setCopiedStates((prev) => ({ ...prev, [key]: false }));
      }, 2000);
    }
  };

  const orgExtraColumns: ColumnsType<Member> = [
    {
      title: t("organizationDetail.columns.spend"),
      key: "spend",
      render: (_: unknown, record: Member) => {
        const orgMember =
          record.user_id != null
            ? (orgData.members || []).find((m) => m.user_id === record.user_id)
            : undefined;
        return (
          <Typography.Text>
            {formatNumberWithCommas(orgMember?.spend ?? 0, 4)}
          </Typography.Text>
        );
      },
    },
    {
      title: t("organizationDetail.columns.createdAt"),
      key: "created_at",
      render: (_: unknown, record: Member) => {
        const orgMember =
          record.user_id != null
            ? (orgData.members || []).find((m) => m.user_id === record.user_id)
            : undefined;
        return (
          <Typography.Text>
            {orgMember?.created_at
              ? new Date(orgMember.created_at).toLocaleString()
              : "-"}
          </Typography.Text>
        );
      },
    },
  ];

  return (
    <div className="w-full h-screen p-4 bg-white">
      <div className="flex justify-between items-center mb-6">
        <div>
          <TremorButton icon={ArrowLeftIcon} onClick={onClose} variant="light" className="mb-4">
            {t("organizationDetail.backButton")}
          </TremorButton>
          <Title>{orgData.organization_alias}</Title>
          <div className="flex items-center cursor-pointer">
            <Text className="text-gray-500 font-mono">{orgData.organization_id}</Text>
            <Button
              type="text"
              size="small"
              icon={copiedStates["org-id"] ? <CheckIcon size={12} /> : <CopyIcon size={12} />}
              onClick={() => copyToClipboard(orgData.organization_id, "org-id")}
              className={`left-2 z-10 transition-all duration-200 ${copiedStates["org-id"]
                ? "text-green-600 bg-green-50 border-green-200"
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                }`}
            />
          </div>
        </div>
      </div>

      <Tabs
        defaultActiveKey={editOrg ? "settings" : "overview"}
        className="mb-4"
        items={[
          {
            key: "overview",
            label: t("organizationDetail.tabs.overview"),
            children: (
              <Grid numItems={1} numItemsSm={2} numItemsLg={3} className="gap-6">
                <Card>
                  <Text>{t("organizationDetail.overview.orgDetails")}</Text>
                  <div className="mt-2">
                    <Text>{t("organizationDetail.overview.created")}: {new Date(orgData.created_at).toLocaleDateString()}</Text>
                    <Text>{t("organizationDetail.overview.updated")}: {new Date(orgData.updated_at).toLocaleDateString()}</Text>
                    <Text>{t("organizationDetail.overview.createdBy")}: {orgData.created_by}</Text>
                  </div>
                </Card>

                <Card>
                  <Text>{t("organizationDetail.overview.budgetStatus")}</Text>
                  <div className="mt-2">
                    <Title>{formatNumberWithCommas(orgData.spend, 4)}</Title>
                    <Text>
                      {t("organizationDetail.overview.of")}{" "}
                      {orgData.litellm_budget_table.max_budget === null
                        ? t("organizationDetail.overview.unlimited")
                        : formatNumberWithCommas(orgData.litellm_budget_table.max_budget, 4)}
                    </Text>
                    {orgData.litellm_budget_table.budget_duration && (
                      <Text className="text-gray-500">{t("organizationDetail.overview.reset")}: {orgData.litellm_budget_table.budget_duration}</Text>
                    )}
                  </div>
                </Card>

                <Card>
                  <Text>{t("organizationDetail.overview.rateLimits")}</Text>
                  <div className="mt-2">
                    <Text>{t("organizationDetail.overview.tpm")}: {orgData.litellm_budget_table.tpm_limit || t("organizationDetail.overview.unlimited")}</Text>
                    <Text>{t("organizationDetail.overview.rpm")}: {orgData.litellm_budget_table.rpm_limit || t("organizationDetail.overview.unlimited")}</Text>
                    {orgData.litellm_budget_table.max_parallel_requests && (
                      <Text>{t("organizationDetail.overview.maxParallelRequests")}: {orgData.litellm_budget_table.max_parallel_requests}</Text>
                    )}
                  </div>
                </Card>

                <Card>
                  <Text>{t("organizationDetail.overview.models")}</Text>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {orgData.models.length === 0 ? (
                      <Badge color="red">{t("organizationDetail.overview.allProxyModels")}</Badge>
                    ) : (
                      orgData.models.map((model, index) => (
                        <Badge key={index} color="red">
                          {model}
                        </Badge>
                      ))
                    )}
                  </div>
                </Card>
                <Card>
                  <Text>{t("organizationDetail.overview.teams")}</Text>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {orgData.teams?.map((team, index) => (
                      <Badge key={index} color="red">
                        {teamAliasMap[team.team_id] || team.team_id}
                      </Badge>
                    ))}
                  </div>
                </Card>

                <ObjectPermissionsView
                  objectPermission={orgData.object_permission}
                  variant="card"
                  accessToken={accessToken}
                />
              </Grid>
            ),
          },
          {
            key: "members",
            label: t("organizationDetail.tabs.members"),
            children: (
              <div className="space-y-4">
                <MemberTable
                  members={(orgData.members || []).map((m) => ({
                    role: m.user_role || "",
                    user_id: m.user_id,
                    user_email: m.user_email,
                  }))}
                  canEdit={canEditOrg}
                  onEdit={(member) => {
                    setSelectedEditMember(member);
                    setIsEditMemberModalVisible(true);
                  }}
                  onDelete={(member) => handleMemberDelete(member)}
                  onAddMember={() => setIsAddMemberModalVisible(true)}
                  roleColumnTitle={t("organizationDetail.members.roleColumn")}
                  extraColumns={orgExtraColumns}
                  emptyText={t("organizationDetail.members.noMembers")}
                />
              </div>
            ),
          },
          {
            key: "settings",
            label: t("organizationDetail.tabs.settings"),
            children: (
              <Card className="overflow-y-auto max-h-[65vh]">
                <div className="flex justify-between items-center mb-4">
                  <Title>{t("organizationDetail.settings.title")}</Title>
                  {canEditOrg && !isEditing && (
                    <TremorButton onClick={() => setIsEditing(true)}>{t("organizationDetail.settings.editButton")}</TremorButton>
                  )}
                </div>

                {isEditing ? (
                  <Form
                    form={form}
                    onFinish={handleOrgUpdate}
                    initialValues={{
                      organization_alias: orgData.organization_alias,
                      models: orgData.models,
                      tpm_limit: orgData.litellm_budget_table.tpm_limit,
                      rpm_limit: orgData.litellm_budget_table.rpm_limit,
                      max_budget: orgData.litellm_budget_table.max_budget,
                      budget_duration: orgData.litellm_budget_table.budget_duration,
                      metadata: orgData.metadata ? JSON.stringify(orgData.metadata, null, 2) : "",
                      vector_stores: orgData.object_permission?.vector_stores || [],
                      mcp_servers_and_groups: {
                        servers: orgData.object_permission?.mcp_servers || [],
                        accessGroups: orgData.object_permission?.mcp_access_groups || [],
                      },
                    }}
                    layout="vertical"
                  >
                    <Form.Item
                      label={t("organizationDetail.settings.orgName")}
                      name="organization_alias"
                      rules={[
                        {
                          required: true,
                          message: t("organizationDetail.settings.orgNameRequired"),
                        },
                      ]}
                    >
                      <TextInput placeholder={t("organizations.modal.orgNamePlaceholder")} />
                    </Form.Item>

                    <Form.Item label={t("organizationDetail.settings.models")} name="models">
                      <ModelSelect
                        value={form.getFieldValue("models")}
                        onChange={(values) => form.setFieldValue("models", values)}
                        context="organization"
                        placeholder={t("organizations.modal.modelsPlaceholder")}
                        options={{
                          includeSpecialOptions: true,
                          showAllProxyModelsOverride: true,
                        }}
                      />
                    </Form.Item>

                    <Form.Item label={t("organizationDetail.settings.maxBudget")} name="max_budget">
                      <NumericalInput
                        step={0.01}
                        precision={2}
                        style={{ width: "100%" }}
                        placeholder={t("organizations.modal.maxBudgetPlaceholder")}
                      />
                    </Form.Item>

                    <Form.Item label={t("organizationDetail.settings.resetBudget")} name="budget_duration">
                      <Select placeholder={t("organizations.modal.budgetDurationPlaceholder")}>
                        <Select.Option value="24h">{t("organizationDetail.settings.daily")}</Select.Option>
                        <Select.Option value="7d">{t("organizationDetail.settings.weekly")}</Select.Option>
                        <Select.Option value="30d">{t("organizationDetail.settings.monthly")}</Select.Option>
                      </Select>
                    </Form.Item>

                    <Form.Item label={t("organizationDetail.settings.tpmLimit")} name="tpm_limit">
                      <NumericalInput
                        step={1}
                        style={{ width: "100%" }}
                        placeholder={t("organizations.modal.tpmLimitPlaceholder")}
                      />
                    </Form.Item>

                    <Form.Item label={t("organizationDetail.settings.rpmLimit")} name="rpm_limit">
                      <NumericalInput
                        step={1}
                        style={{ width: "100%" }}
                        placeholder={t("organizations.modal.rpmLimitPlaceholder")}
                      />
                    </Form.Item>

                    <Form.Item label={t("organizationDetail.settings.vectorStores")} name="vector_stores">
                      <VectorStoreSelector
                        onChange={(values) => form.setFieldValue("vector_stores", values)}
                        value={form.getFieldValue("vector_stores")}
                        accessToken={accessToken || ""}
                        placeholder={t("organizations.modal.vectorStoresPlaceholder")}
                      />
                    </Form.Item>

                    <Form.Item label={t("organizationDetail.settings.mcpServers")} name="mcp_servers_and_groups">
                      <MCPServerSelector
                        onChange={(values) => form.setFieldValue("mcp_servers_and_groups", values)}
                        value={form.getFieldValue("mcp_servers_and_groups")}
                        accessToken={accessToken || ""}
                        placeholder={t("organizations.modal.mcpServersPlaceholder")}
                      />
                    </Form.Item>

                    <Form.Item label={t("organizationDetail.settings.metadata")} name="metadata">
                      <Input.TextArea rows={4} placeholder={t("organizations.modal.metadata")} />
                    </Form.Item>

                    <div className="sticky z-10 bg-white p-4 border-t border-gray-200 bottom-[-1.5rem] inset-x-[-1.5rem]">
                      <div className="flex justify-end items-center gap-2">
                        <TremorButton variant="secondary" onClick={() => setIsEditing(false)} disabled={isOrgSaving}>
                          {t("organizationDetail.settings.cancel")}
                        </TremorButton>
                        <TremorButton type="submit" loading={isOrgSaving}>
                          {t("organizationDetail.settings.saveChanges")}
                        </TremorButton>
                      </div>
                    </div>
                  </Form>
                ) : (
                  <div className="space-y-4">
                    <div>
                      <Text className="font-medium">{t("organizationDetail.settings.orgName")}</Text>
                      <div>{orgData.organization_alias}</div>
                    </div>
                    <div>
                      <Text className="font-medium">{t("organizationDetail.settings.orgId")}</Text>
                      <div className="font-mono">{orgData.organization_id}</div>
                    </div>
                    <div>
                      <Text className="font-medium">{t("organizationDetail.settings.createdAt")}</Text>
                      <div>{new Date(orgData.created_at).toLocaleString()}</div>
                    </div>
                    <div>
                      <Text className="font-medium">{t("organizationDetail.settings.models")}</Text>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {orgData.models.map((model, index) => (
                          <Badge key={index} color="red">
                            {model}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Text className="font-medium">{t("organizationDetail.settings.rateLimits")}</Text>
                      <div>{t("organizationDetail.overview.tpm")}: {orgData.litellm_budget_table.tpm_limit || t("organizationDetail.overview.unlimited")}</div>
                      <div>{t("organizationDetail.overview.rpm")}: {orgData.litellm_budget_table.rpm_limit || t("organizationDetail.overview.unlimited")}</div>
                    </div>
                    <div>
                      <Text className="font-medium">{t("organizationDetail.settings.budget")}</Text>
                      <div>
                        {t("organizationDetail.settings.max")}:{" "}
                        {orgData.litellm_budget_table.max_budget !== null
                          ? formatNumberWithCommas(orgData.litellm_budget_table.max_budget, 4)
                          : t("organizationDetail.settings.noLimit")}
                      </div>
                      <div>{t("organizationDetail.settings.reset")}: {orgData.litellm_budget_table.budget_duration || t("organizationDetail.settings.never")}</div>
                    </div>

                    <ObjectPermissionsView
                      objectPermission={orgData.object_permission}
                      variant="inline"
                      className="pt-4 border-t border-gray-200"
                      accessToken={accessToken}
                    />
                  </div>
                )}
              </Card>
            ),
          },
        ]}
      />
      <UserSearchModal
        isVisible={isAddMemberModalVisible}
        onCancel={() => setIsAddMemberModalVisible(false)}
        onSubmit={handleMemberAdd}
        accessToken={accessToken}
        title={t("organizationDetail.members.addMemberTitle")}
        roles={[
          {
            label: "org_admin",
            value: "org_admin",
            description: t("organizationDetail.members.roles.orgAdmin.description"),
          },
          {
            label: "internal_user",
            value: "internal_user",
            description: t("organizationDetail.members.roles.internalUser.description"),
          },
          {
            label: "internal_user_viewer",
            value: "internal_user_viewer",
            description: t("organizationDetail.members.roles.internalUserViewer.description"),
          },
        ]}
        defaultRole="internal_user"
      />
      <MemberModal
        visible={isEditMemberModalVisible}
        onCancel={() => setIsEditMemberModalVisible(false)}
        onSubmit={handleMemberUpdate}
        initialData={selectedEditMember}
        mode="edit"
        config={{
          title: t("organizationDetail.members.editMemberTitle"),
          showEmail: true,
          showUserId: true,
          roleOptions: [
            { label: t("organizationDetail.members.roles.orgAdmin.label"), value: "org_admin" },
            { label: t("organizationDetail.members.roles.internalUser.label"), value: "internal_user" },
            { label: t("organizationDetail.members.roles.internalUserViewer.label"), value: "internal_user_viewer" },
          ],
        }}
      />
    </div>
  );
};

export default OrganizationInfoView;
