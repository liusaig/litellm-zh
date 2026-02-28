import React, { useState, useEffect } from "react";
import { Button, TabGroup, TabList, Tab, TabPanels, TabPanel } from "@tremor/react";
import { Dropdown } from "antd";
import { DownOutlined, PlusOutlined, CodeOutlined } from "@ant-design/icons";
import { getGuardrailsList, deleteGuardrailCall } from "./networking";
import AddGuardrailForm from "./guardrails/add_guardrail_form";
import GuardrailTable from "./guardrails/guardrail_table";
import { isAdminRole } from "@/utils/roles";
import { useLanguage } from "@/contexts/LanguageContext";
import GuardrailInfoView from "./guardrails/guardrail_info";
import GuardrailTestPlayground from "./guardrails/GuardrailTestPlayground";
import NotificationsManager from "./molecules/notifications_manager";
import { Guardrail, GuardrailDefinitionLocation } from "./guardrails/types";
import DeleteResourceModal from "./common_components/DeleteResourceModal";
import { getGuardrailLogoAndName } from "./guardrails/guardrail_info_helpers";
import { CustomCodeModal } from "./guardrails/custom_code";
import GuardrailGarden from "./guardrails/guardrail_garden";

interface GuardrailsPanelProps {
  accessToken: string | null;
  userRole?: string;
}

interface GuardrailItem {
  guardrail_id?: string;
  guardrail_name: string | null;
  litellm_params: {
    guardrail: string;
    mode: string;
    default_on: boolean;
  };
  guardrail_info: Record<string, any> | null;
  created_at?: string;
  updated_at?: string;
  guardrail_definition_location: GuardrailDefinitionLocation;
}

interface GuardrailsResponse {
  guardrails: Guardrail[];
}

const GuardrailsPanel: React.FC<GuardrailsPanelProps> = ({ accessToken, userRole }) => {
  const { t, locale } = useLanguage();
  const tr = (key: string, zh: string) => {
    const value = t(key);
    return value === key && locale === "zh-CN" ? zh : value;
  };
  const [guardrailsList, setGuardrailsList] = useState<Guardrail[]>([]);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isCustomCodeModalVisible, setIsCustomCodeModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [guardrailToDelete, setGuardrailToDelete] = useState<Guardrail | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedGuardrailId, setSelectedGuardrailId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<number>(0);

  const isAdmin = userRole ? isAdminRole(userRole) : false;

  const fetchGuardrails = async () => {
    if (!accessToken) {
      return;
    }

    setIsLoading(true);
    try {
      const response: GuardrailsResponse = await getGuardrailsList(accessToken);
      console.log(`guardrails: ${JSON.stringify(response)}`);
      setGuardrailsList(response.guardrails);
    } catch (error) {
      console.error("Error fetching guardrails:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchGuardrails();
  }, [accessToken]);

  const handleAddGuardrail = () => {
    if (selectedGuardrailId) {
      setSelectedGuardrailId(null);
    }
    setIsAddModalVisible(true);
  };

  const handleAddCustomCodeGuardrail = () => {
    if (selectedGuardrailId) {
      setSelectedGuardrailId(null);
    }
    setIsCustomCodeModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsAddModalVisible(false);
  };

  const handleCloseCustomCodeModal = () => {
    setIsCustomCodeModalVisible(false);
  };

  const handleSuccess = () => {
    fetchGuardrails();
  };

  const handleDeleteClick = (guardrailId: string, guardrailName: string) => {
    const guardrail = guardrailsList.find((g) => g.guardrail_id === guardrailId) || null;
    setGuardrailToDelete(guardrail);
    setIsDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!guardrailToDelete || !accessToken) return;

    setIsDeleting(true);
    try {
      await deleteGuardrailCall(accessToken, guardrailToDelete.guardrail_id);
      NotificationsManager.success(
        tr("guardrailsPage.notifications.deleteSuccess", "护栏 \"{name}\" 删除成功").replace(
          "{name}",
          guardrailToDelete.guardrail_name || ""
        )
      );
      await fetchGuardrails();
    } catch (error) {
      console.error("Error deleting guardrail:", error);
      NotificationsManager.fromBackend(tr("guardrailsPage.notifications.deleteFailed", "删除护栏失败"));
    } finally {
      setIsDeleting(false);
      setIsDeleteModalOpen(false);
      setGuardrailToDelete(null);
    }
  };

  const handleDeleteCancel = () => {
    setIsDeleteModalOpen(false);
    setGuardrailToDelete(null);
  };

  const providerDisplayName =
    guardrailToDelete && guardrailToDelete.litellm_params
      ? getGuardrailLogoAndName(guardrailToDelete.litellm_params.guardrail).displayName
      : undefined;

  return (
    <div className="w-full mx-auto flex-auto overflow-y-auto m-8 p-2">
      <TabGroup index={activeTab} onIndexChange={setActiveTab}>
        <TabList className="mb-4">
          <Tab>{tr("guardrailsPage.tabs.garden", "护栏广场")}</Tab>
          <Tab>{tr("guardrailsPage.tabs.guardrails", "护栏")}</Tab>
          <Tab disabled={!accessToken || guardrailsList.length === 0}>
            {tr("guardrailsPage.tabs.testPlayground", "测试操场")}
          </Tab>
        </TabList>

        <TabPanels>
          {/* Guardrail Garden Tab */}
          <TabPanel>
            <GuardrailGarden
              accessToken={accessToken}
              onGuardrailCreated={handleSuccess}
            />
          </TabPanel>

          {/* Existing Guardrails Tab */}
          <TabPanel>
            <div className="flex justify-between items-center mb-4">
              <Dropdown
                menu={{
                  items: [
                    {
                      key: "provider",
                      icon: <PlusOutlined />,
                      label: tr("guardrailsPage.actions.addProviderGuardrail", "添加提供商护栏"),
                      onClick: handleAddGuardrail,
                    },
                    {
                      key: "custom_code",
                      icon: <CodeOutlined />,
                      label: tr("guardrailsPage.actions.createCustomCodeGuardrail", "创建自定义代码护栏"),
                      onClick: handleAddCustomCodeGuardrail,
                    },
                  ],
                }}
                trigger={["click"]}
                disabled={!accessToken}
              >
                <Button disabled={!accessToken}>
                  {tr("guardrailsPage.actions.addNewGuardrail", "+ 添加新护栏")} <DownOutlined className="ml-2" />
                </Button>
              </Dropdown>
            </div>

            {selectedGuardrailId ? (
              <GuardrailInfoView
                guardrailId={selectedGuardrailId}
                onClose={() => setSelectedGuardrailId(null)}
                accessToken={accessToken}
                isAdmin={isAdmin}
              />
            ) : (
              <GuardrailTable
                guardrailsList={guardrailsList}
                isLoading={isLoading}
                onDeleteClick={handleDeleteClick}
                accessToken={accessToken}
                onGuardrailUpdated={fetchGuardrails}
                isAdmin={isAdmin}
                onGuardrailClick={(id) => setSelectedGuardrailId(id)}
              />
            )}

            <AddGuardrailForm
              visible={isAddModalVisible}
              onClose={handleCloseModal}
              accessToken={accessToken}
              onSuccess={handleSuccess}
            />

            <CustomCodeModal
              visible={isCustomCodeModalVisible}
              onClose={handleCloseCustomCodeModal}
              accessToken={accessToken}
              onSuccess={handleSuccess}
            />

            <DeleteResourceModal
              isOpen={isDeleteModalOpen}
              title={tr("guardrailsPage.deleteModal.title", "删除护栏")}
              message={tr("guardrailsPage.deleteModal.message", "确认删除护栏：{name}？此操作不可撤销。").replace(
                "{name}",
                guardrailToDelete?.guardrail_name || ""
              )}
              resourceInformationTitle={tr("guardrailsPage.deleteModal.resourceInformationTitle", "护栏信息")}
              resourceInformation={[
                { label: tr("guardrailsPage.deleteModal.fields.name", "名称"), value: guardrailToDelete?.guardrail_name },
                { label: tr("guardrailsPage.deleteModal.fields.id", "ID"), value: guardrailToDelete?.guardrail_id, code: true },
                { label: tr("guardrailsPage.deleteModal.fields.provider", "提供商"), value: providerDisplayName },
                { label: tr("guardrailsPage.deleteModal.fields.mode", "模式"), value: guardrailToDelete?.litellm_params.mode },
                {
                  label: tr("guardrailsPage.deleteModal.fields.defaultOn", "默认启用"),
                  value: guardrailToDelete?.litellm_params.default_on
                    ? tr("guardrailsPage.deleteModal.fields.yes", "是")
                    : tr("guardrailsPage.deleteModal.fields.no", "否"),
                },
              ]}
              onCancel={handleDeleteCancel}
              onOk={handleDeleteConfirm}
              confirmLoading={isDeleting}
            />
          </TabPanel>

          {/* Test Playground Tab */}
          <TabPanel>
            <GuardrailTestPlayground
              guardrailsList={guardrailsList}
              isLoading={isLoading}
              accessToken={accessToken}
              onClose={() => setActiveTab(0)}
            />
          </TabPanel>
        </TabPanels>
      </TabGroup>
    </div>
  );
};

export default GuardrailsPanel;
