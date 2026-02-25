import { useOrganizations } from "@/app/(dashboard)/hooks/organizations/useOrganizations";
import AvailableTeamsPanel from "@/components/team/available_teams";
import TeamInfoView from "@/components/team/TeamInfo";
import TeamSSOSettings from "@/components/TeamSSOSettings";
import { isProxyAdminRole } from "@/utils/roles";
import { InfoCircleOutlined } from "@ant-design/icons";
import { ChevronDownIcon, ChevronRightIcon, RefreshIcon } from "@heroicons/react/outline";
import { FilterInput } from "@/components/common_components/Filters/FilterInput";
import { FiltersButton } from "@/components/common_components/Filters/FiltersButton";
import { ResetFiltersButton } from "@/components/common_components/Filters/ResetFiltersButton";
import { Search, User } from "lucide-react";
import {
  Accordion,
  AccordionBody,
  AccordionHeader,
  Badge,
  Button,
  Card,
  Col,
  Grid,
  Icon,
  Select,
  SelectItem,
  Tab,
  TabGroup,
  TabList,
  TabPanel,
  TabPanels,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeaderCell,
  TableRow,
  Text,
  TextInput,
} from "@tremor/react";
import { Button as Button2, Form, Input, Modal, Select as Select2, Switch, Tooltip, Typography } from "antd";
import React, { useEffect, useState } from "react";
import { formatNumberWithCommas } from "../utils/dataUtils";
import AccessGroupSelector from "./common_components/AccessGroupSelector";
import AgentSelector from "./agent_management/AgentSelector";
import { fetchTeams } from "./common_components/fetch_teams";
import ModelAliasManager from "./common_components/ModelAliasManager";
import PremiumLoggingSettings from "./common_components/PremiumLoggingSettings";
import RouterSettingsAccordion, { RouterSettingsAccordionValue } from "./common_components/RouterSettingsAccordion";
import {
  fetchAvailableModelsForTeamOrKey,
  getModelDisplayName,
  unfurlWildcardModelsInList,
} from "./key_team_helpers/fetch_available_models_team_key";
import type { KeyResponse, Team } from "./key_team_helpers/key_list";
import MCPServerSelector from "./mcp_server_management/MCPServerSelector";
import MCPToolPermissions from "./mcp_server_management/MCPToolPermissions";
import NotificationsManager from "./molecules/notifications_manager";
import { Organization, fetchMCPAccessGroups, getGuardrailsList, getPoliciesList, teamDeleteCall } from "./networking";
import NumericalInput from "./shared/numerical_input";
import VectorStoreSelector from "./vector_store_management/VectorStoreSelector";

interface TeamProps {
  teams: Team[] | null;
  searchParams: any;
  accessToken: string | null;
  setTeams: React.Dispatch<React.SetStateAction<Team[] | null>>;
  userID: string | null;
  userRole: string | null;
  organizations: Organization[] | null;
  premiumUser?: boolean;
}

interface FilterState {
  team_id: string;
  team_alias: string;
  organization_id: string;
  sort_by: string;
  sort_order: "asc" | "desc";
}

interface EditTeamModalProps {
  visible: boolean;
  onCancel: () => void;
  team: any; // Assuming TeamType is a type representing your team object
  onSubmit: (data: FormData) => void; // Assuming FormData is the type of data to be submitted
}

import { updateExistingKeys } from "@/utils/dataUtils";
import DeleteResourceModal from "./common_components/DeleteResourceModal";
import TableIconActionButton from "./common_components/IconActionButton/TableIconActionButtons/TableIconActionButton";
import { Member, teamCreateCall, v2TeamListCall } from "./networking";
import { ModelSelect } from "./ModelSelect/ModelSelect";

interface TeamInfo {
  members_with_roles: Member[];
}

interface PerTeamInfo {
  keys: KeyResponse[];
  team_info: TeamInfo;
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

const canCreateOrManageTeams = (
  userRole: string | null,
  userID: string | null,
  organizations: Organization[] | null,
): boolean => {
  // Admin role always has permission
  if (userRole === "Admin") {
    return true;
  }

  // Check if user is an org_admin in any organization
  if (organizations && userID) {
    return organizations.some((org) =>
      org.members?.some((member) => member.user_id === userID && member.user_role === "org_admin"),
    );
  }

  return false;
};

const getAdminOrganizations = (
  userRole: string | null,
  userID: string | null,
  organizations: Organization[] | null,
): Organization[] => {
  // Global Admin can see all organizations
  if (userRole === "Admin") {
    return organizations || [];
  }

  // Org Admin can only see organizations they're an admin for
  if (organizations && userID) {
    return organizations.filter((org) =>
      org.members?.some((member) => member.user_id === userID && member.user_role === "org_admin"),
    );
  }

  return [];
};

const getOrganizationAlias = (
  organizationId: string | null | undefined,
  organizations: Organization[] | null | undefined,
): string => {
  if (!organizationId || !organizations) {
    return organizationId || "N/A";
  }

  const organization = organizations.find((org) => org.organization_id === organizationId);
  return organization?.organization_alias || organizationId;
};

// @deprecated
const Teams: React.FC<TeamProps> = ({
  teams,
  searchParams,
  accessToken,
  setTeams,
  userID,
  userRole,
  organizations,
  premiumUser = false,
}) => {
  console.log(`organizations: ${JSON.stringify(organizations)}`);
  const { data: organizationsData } = useOrganizations();
  const [lastRefreshed, setLastRefreshed] = useState("");
  const [currentOrg, setCurrentOrg] = useState<Organization | null>(null);
  const [currentOrgForCreateTeam, setCurrentOrgForCreateTeam] = useState<Organization | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    team_id: "",
    team_alias: "",
    organization_id: "",
    sort_by: "created_at",
    sort_order: "desc",
  });

  useEffect(() => {
    console.log(`inside useeffect - ${lastRefreshed}`);
    if (accessToken) {
      // Call your function here
      fetchTeams(accessToken, userID, userRole, currentOrg, setTeams);
    }
    handleRefreshClick();
  }, [lastRefreshed]);

  const [form] = Form.useForm();
  const [memberForm] = Form.useForm();
  const { Title, Paragraph } = Typography;
  const [value, setValue] = useState("");
  const [editModalVisible, setEditModalVisible] = useState(false);

  const [selectedTeam, setSelectedTeam] = useState<null | any>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [editTeam, setEditTeam] = useState<boolean>(false);

  const [isTeamModalVisible, setIsTeamModalVisible] = useState(false);
  const [isAddMemberModalVisible, setIsAddMemberModalVisible] = useState(false);
  const [isEditMemberModalVisible, setIsEditMemberModalVisible] = useState(false);
  const [userModels, setUserModels] = useState<string[]>([]);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [modelsToPick, setModelsToPick] = useState<string[]>([]);
  const [perTeamInfo, setPerTeamInfo] = useState<Record<string, PerTeamInfo>>({});
  const [isTeamDeleting, setIsTeamDeleting] = useState(false);
  // Add this state near the other useState declarations
  const [guardrailsList, setGuardrailsList] = useState<string[]>([]);
  const [policiesList, setPoliciesList] = useState<string[]>([]);
  const [expandedAccordions, setExpandedAccordions] = useState<Record<string, boolean>>({});
  const [loggingSettings, setLoggingSettings] = useState<any[]>([]);
  const [mcpAccessGroups, setMcpAccessGroups] = useState<string[]>([]);
  const [mcpAccessGroupsLoaded, setMcpAccessGroupsLoaded] = useState(false);
  const [modelAliases, setModelAliases] = useState<{ [key: string]: string }>({});
  const [routerSettings, setRouterSettings] = useState<RouterSettingsAccordionValue | null>(null);
  const [routerSettingsKey, setRouterSettingsKey] = useState<number>(0);

  useEffect(() => {
    console.log(`currentOrgForCreateTeam: ${currentOrgForCreateTeam}`);
    const models = getOrganizationModels(currentOrgForCreateTeam, userModels);
    console.log(`models: ${models}`);
    setModelsToPick(models);
    form.setFieldValue("models", []);
  }, [currentOrgForCreateTeam, userModels]);

  // Handle organization preselection when modal opens
  useEffect(() => {
    if (isTeamModalVisible) {
      const adminOrgs = getAdminOrganizations(userRole, userID, organizations);

      // If there's exactly one organization the user is admin for, preselect it
      if (adminOrgs.length === 1) {
        const org = adminOrgs[0];
        form.setFieldValue("organization_id", org.organization_id);
        setCurrentOrgForCreateTeam(org);
      } else {
        // Reset the organization selection for multiple orgs
        form.setFieldValue("organization_id", currentOrg?.organization_id || null);
        setCurrentOrgForCreateTeam(currentOrg);
      }
    }
  }, [isTeamModalVisible, userRole, userID, organizations, currentOrg]);

  // Add this useEffect to fetch guardrails
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
  }, [accessToken]);

  useEffect(() => {
    const fetchTeamInfo = () => {
      if (!teams) return;

      const newPerTeamInfo = teams.reduce(
        (acc, team) => {
          acc[team.team_id] = {
            keys: team.keys || [],
            team_info: {
              members_with_roles: team.members_with_roles || [],
            },
          };
          return acc;
        },
        {} as Record<string, PerTeamInfo>,
      );

      setPerTeamInfo(newPerTeamInfo);
    };

    fetchTeamInfo();
  }, [teams]);

  const handleOk = () => {
    setIsTeamModalVisible(false);
    form.resetFields();
    setLoggingSettings([]);
    setModelAliases({});
    setRouterSettings(null);
    setRouterSettingsKey((prev) => prev + 1);
  };

  const handleMemberOk = () => {
    setIsAddMemberModalVisible(false);
    setIsEditMemberModalVisible(false);
    memberForm.resetFields();
  };

  const handleCancel = () => {
    setIsTeamModalVisible(false);
    form.resetFields();
    setLoggingSettings([]);
    setModelAliases({});
    setRouterSettings(null);
    setRouterSettingsKey((prev) => prev + 1);
  };

  const handleMemberCancel = () => {
    setIsAddMemberModalVisible(false);
    setIsEditMemberModalVisible(false);
    memberForm.resetFields();
  };

  const handleDelete = async (team: Team) => {
    // Set the team to delete and open the confirmation modal
    setTeamToDelete(team);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (teamToDelete == null || teams == null || accessToken == null) {
      return;
    }

    try {
      setIsTeamDeleting(true);
      await teamDeleteCall(accessToken, teamToDelete.team_id);
      await fetchTeams(accessToken, userID, userRole, currentOrg, setTeams);
      NotificationsManager.success("分组删除成功");
    } catch (error) {
      NotificationsManager.fromBackend("删除分组失败: " + error);
    } finally {
      setIsTeamDeleting(false);
      setIsDeleteModalOpen(false);
      setTeamToDelete(null);
    }
  };

  const cancelDelete = () => {
    setIsDeleteModalOpen(false);
    setTeamToDelete(null);
  };

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
        }

        // Transform allowed_mcp_access_groups into object_permission
        if (formValues.allowed_mcp_access_groups && formValues.allowed_mcp_access_groups.length > 0) {
          if (!formValues.object_permission) {
            formValues.object_permission = {};
          }
          formValues.object_permission.mcp_access_groups = formValues.allowed_mcp_access_groups;
          delete formValues.allowed_mcp_access_groups;
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

        // Add model_aliases if any are defined
        if (Object.keys(modelAliases).length > 0) {
          formValues.model_aliases = modelAliases;
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
        setRouterSettings(null);
        setRouterSettingsKey((prev) => prev + 1);
        setIsTeamModalVisible(false);
      }
    } catch (error) {
      console.error("Error creating the team:", error);
      NotificationsManager.fromBackend("创建分组失败: " + error);
    }
  };

  const is_team_admin = (team: any) => {
    if (team == null || team.members_with_roles == null) {
      return false;
    }
    for (let i = 0; i < team.members_with_roles.length; i++) {
      let member = team.members_with_roles[i];
      if (member.user_id == userID && member.role == "admin") {
        return true;
      }
    }
    return false;
  };

  const handleRefreshClick = () => {
    // Update the 'lastRefreshed' state to the current date and time
    const currentDate = new Date();
    setLastRefreshed(currentDate.toLocaleString());
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    // Call teamListCall with the new filters
    if (accessToken) {
      v2TeamListCall(
        accessToken,
        newFilters.organization_id || null,
        null,
        newFilters.team_id || null,
        newFilters.team_alias || null,
      )
        .then((response) => {
          if (response && response.teams) {
            setTeams(response.teams);
          }
        })
        .catch((error) => {
          console.error("Error fetching teams:", error);
        });
    }
  };

  const handleSortChange = (sortBy: string, sortOrder: "asc" | "desc") => {
    const newFilters = {
      ...filters,
      sort_by: sortBy,
      sort_order: sortOrder,
    };
    setFilters(newFilters);
    // Call teamListCall with the new sort parameters
    if (accessToken) {
      v2TeamListCall(
        accessToken,
        filters.organization_id || null,
        null,
        filters.team_id || null,
        filters.team_alias || null,
      )
        .then((response) => {
          if (response && response.teams) {
            setTeams(response.teams);
          }
        })
        .catch((error) => {
          console.error("Error fetching teams:", error);
        });
    }
  };

  const handleFilterReset = () => {
    setFilters({
      team_id: "",
      team_alias: "",
      organization_id: "",
      sort_by: "created_at",
      sort_order: "desc",
    });
    // Reset teams list
    if (accessToken) {
      v2TeamListCall(accessToken, null, userID || null, null, null)
        .then((response) => {
          if (response && response.teams) {
            setTeams(response.teams);
          }
        })
        .catch((error) => {
          console.error("Error fetching teams:", error);
        });
    }
  };

  return (
    <div className="w-full mx-4 h-[75vh]">
      <Grid numItems={1} className="gap-2 p-8 w-full mt-2">
        <Col numColSpan={1} className="flex flex-col gap-2">
          {canCreateOrManageTeams(userRole, userID, organizations) && (
            <Button className="w-fit" onClick={() => setIsTeamModalVisible(true)}>
              + 创建新分组
            </Button>
          )}
          {selectedTeamId ? (
            <TeamInfoView
              teamId={selectedTeamId}
              onUpdate={(data) => {
                setTeams((teams) => {
                  if (teams == null) {
                    return teams;
                  }
                  const updated = teams.map((team) => {
                    if (data.team_id === team.team_id) {
                      return updateExistingKeys(team, data);
                    }
                    return team;
                  });
                  // Minimal fix: refresh the full team list after an update
                  if (accessToken) {
                    fetchTeams(accessToken, userID, userRole, currentOrg, setTeams);
                  }
                  return updated;
                });
              }}
              onClose={() => {
                setSelectedTeamId(null);
                setEditTeam(false);
              }}
              accessToken={accessToken}
              is_team_admin={is_team_admin(teams?.find((team) => team.team_id === selectedTeamId))}
              is_proxy_admin={userRole == "Admin"}
              userModels={userModels}
              editTeam={editTeam}
              premiumUser={premiumUser}
            />
          ) : (
            <TabGroup className="gap-2 h-[75vh] w-full">
              <TabList className="flex justify-between mt-2 w-full items-center">
                <div className="flex">
                  <Tab>我的分组</Tab>
                  <Tab>可加入分组</Tab>
                  {isProxyAdminRole(userRole || "") && <Tab>默认分组设置</Tab>}
                </div>
                <div className="flex items-center space-x-2">
                  {lastRefreshed && <Text>最近刷新：{lastRefreshed}</Text>}
                  <Icon
                    icon={RefreshIcon} // Modify as necessary for correct icon name
                    variant="shadow"
                    size="xs"
                    className="self-center"
                    onClick={handleRefreshClick}
                  />
                </div>
              </TabList>
              <TabPanels>
                <TabPanel>
                  <Text>
                    点击 &ldquo;分组 ID&rdquo; 可查看分组详情并管理分组成员。
                  </Text>
                  <Grid numItems={1} className="gap-2 pt-2 pb-2 h-[75vh] w-full mt-2">
                    <Col numColSpan={1}>
                      <Card className="w-full mx-auto flex-auto overflow-hidden overflow-y-auto max-h-[50vh]">
                        <div className="border-b px-6 py-4">
                          <div className="flex flex-col space-y-4">
                            {/* Search and Filter Controls */}
                            <div className="flex flex-wrap items-center gap-3">
                              {/* Team Alias Search */}
                              <FilterInput
                                placeholder="按分组名称搜索..."
                                value={filters.team_alias}
                                onChange={(value) => handleFilterChange("team_alias", value)}
                                icon={Search}
                              />

                              {/* Filter Button */}
                              <FiltersButton
                                onClick={() => setShowFilters(!showFilters)}
                                active={showFilters}
                                hasActiveFilters={!!(filters.team_id || filters.team_alias || filters.organization_id)}
                                label="筛选"
                              />

                              {/* Reset Filters Button */}
                                <ResetFiltersButton onClick={handleFilterReset} label="重置筛选" />
                            </div>

                            {/* Additional Filters */}
                            {showFilters && (
                              <div className="flex flex-wrap items-center gap-3 mt-3">
                                {/* Team ID Search */}
                                <FilterInput
                                  placeholder="输入分组 ID"
                                  value={filters.team_id}
                                  onChange={(value) => handleFilterChange("team_id", value)}
                                  icon={User}
                                />

                                {/* Organization Dropdown */}
                                <div className="w-64">
                                  <Select
                                    value={filters.organization_id || ""}
                                    onValueChange={(value) => handleFilterChange("organization_id", value)}
                                    placeholder="选择组织"
                                  >
                                    {organizations?.map((org) => (
                                      <SelectItem key={org.organization_id} value={org.organization_id || ""}>
                                        {org.organization_alias || org.organization_id}
                                      </SelectItem>
                                    ))}
                                  </Select>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                        <Table>
                          <TableHead>
                            <TableRow>
                              <TableHeaderCell>分组名称</TableHeaderCell>
                              <TableHeaderCell>分组 ID</TableHeaderCell>
                              <TableHeaderCell>创建时间</TableHeaderCell>
                              <TableHeaderCell>花费</TableHeaderCell>
                              <TableHeaderCell>预算</TableHeaderCell>
                              <TableHeaderCell>模型</TableHeaderCell>
                              <TableHeaderCell>组织</TableHeaderCell>
                              <TableHeaderCell>信息</TableHeaderCell>
                              <TableHeaderCell>操作</TableHeaderCell>
                            </TableRow>
                          </TableHead>

                          <TableBody>
                            {teams && teams.length > 0 ? (
                              teams
                                .filter((team) => {
                                  if (!currentOrg) return true;
                                  return team.organization_id === currentOrg.organization_id;
                                })
                                .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                                .map((team: any) => (
                                  <TableRow key={team.team_id}>
                                    <TableCell
                                      style={{
                                        maxWidth: "4px",
                                        whiteSpace: "pre-wrap",
                                        overflow: "hidden",
                                      }}
                                    >
                                      {team["team_alias"]}
                                    </TableCell>
                                    <TableCell>
                                      <div className="overflow-hidden">
                                        <Tooltip title={team.team_id}>
                                          <Button
                                            size="xs"
                                            variant="light"
                                            className="font-mono text-blue-500 bg-blue-50 hover:bg-blue-100 text-xs font-normal px-2 py-0.5 text-left overflow-hidden truncate max-w-[200px]"
                                            onClick={() => {
                                              // Add click handler
                                              setSelectedTeamId(team.team_id);
                                            }}
                                          >
                                            {team.team_id.slice(0, 7)}...
                                          </Button>
                                        </Tooltip>
                                      </div>
                                    </TableCell>
                                    <TableCell
                                      style={{
                                        maxWidth: "4px",
                                        whiteSpace: "pre-wrap",
                                        overflow: "hidden",
                                      }}
                                    >
                                      {team.created_at ? new Date(team.created_at).toLocaleDateString() : "无"}
                                    </TableCell>
                                    <TableCell
                                      style={{
                                        maxWidth: "4px",
                                        whiteSpace: "pre-wrap",
                                        overflow: "hidden",
                                      }}
                                    >
                                      {formatNumberWithCommas(team["spend"], 4)}
                                    </TableCell>
                                    <TableCell
                                      style={{
                                        maxWidth: "4px",
                                        whiteSpace: "pre-wrap",
                                        overflow: "hidden",
                                      }}
                                    >
                                      {team["max_budget"] !== null && team["max_budget"] !== undefined
                                        ? team["max_budget"]
                                        : "不限制"}
                                    </TableCell>
                                    <TableCell
                                      style={{
                                        maxWidth: "8-x",
                                        whiteSpace: "pre-wrap",
                                        overflow: "hidden",
                                      }}
                                      className={team.models.length > 3 ? "px-0" : ""}
                                    >
                                      <div className="flex flex-col">
                                        {Array.isArray(team.models) ? (
                                          <div className="flex flex-col">
                                            {team.models.length === 0 ? (
                                              <Badge size={"xs"} className="mb-1" color="red">
                                                <Text>全部代理模型</Text>
                                              </Badge>
                                            ) : (
                                              <>
                                                <div className="flex items-start">
                                                  {team.models.length > 3 && (
                                                    <div>
                                                      <Icon
                                                        icon={
                                                          expandedAccordions[team.team_id]
                                                            ? ChevronDownIcon
                                                            : ChevronRightIcon
                                                        }
                                                        className="cursor-pointer"
                                                        size="xs"
                                                        onClick={() => {
                                                          setExpandedAccordions((prev) => ({
                                                            ...prev,
                                                            [team.team_id]: !prev[team.team_id],
                                                          }));
                                                        }}
                                                      />
                                                    </div>
                                                  )}
                                                  <div className="flex flex-wrap gap-1">
                                                    {team.models.slice(0, 3).map((model: string, index: number) =>
                                                      model === "all-proxy-models" ? (
                                                        <Badge key={index} size={"xs"} color="red">
                                                          <Text>全部代理模型</Text>
                                                        </Badge>
                                                      ) : (
                                                        <Badge key={index} size={"xs"} color="blue">
                                                          <Text>
                                                            {model.length > 30
                                                              ? `${getModelDisplayName(model).slice(0, 30)}...`
                                                              : getModelDisplayName(model)}
                                                          </Text>
                                                        </Badge>
                                                      ),
                                                    )}
                                                    {team.models.length > 3 && !expandedAccordions[team.team_id] && (
                                                      <Badge size={"xs"} color="gray" className="cursor-pointer">
                                                        <Text>
                                                          +{team.models.length - 3}{" "}
                                                          个模型
                                                        </Text>
                                                      </Badge>
                                                    )}
                                                    {expandedAccordions[team.team_id] && (
                                                      <div className="flex flex-wrap gap-1">
                                                        {team.models.slice(3).map((model: string, index: number) =>
                                                          model === "all-proxy-models" ? (
                                                            <Badge key={index + 3} size={"xs"} color="red">
                                                              <Text>全部代理模型</Text>
                                                            </Badge>
                                                          ) : (
                                                            <Badge key={index + 3} size={"xs"} color="blue">
                                                              <Text>
                                                                {model.length > 30
                                                                  ? `${getModelDisplayName(model).slice(0, 30)}...`
                                                                  : getModelDisplayName(model)}
                                                              </Text>
                                                            </Badge>
                                                          ),
                                                        )}
                                                      </div>
                                                    )}
                                                  </div>
                                                </div>
                                              </>
                                            )}
                                          </div>
                                        ) : null}
                                      </div>
                                    </TableCell>

                                    <TableCell>
                                      {getOrganizationAlias(team.organization_id, organizationsData || organizations)}
                                    </TableCell>
                                    <TableCell>
                                      <Text>
                                        {perTeamInfo &&
                                          team.team_id &&
                                          perTeamInfo[team.team_id] &&
                                          perTeamInfo[team.team_id].keys &&
                                          perTeamInfo[team.team_id].keys.length}{" "}
                                        个密钥
                                      </Text>
                                      <Text>
                                        {perTeamInfo &&
                                          team.team_id &&
                                          perTeamInfo[team.team_id] &&
                                          perTeamInfo[team.team_id].team_info &&
                                          perTeamInfo[team.team_id].team_info.members_with_roles &&
                                          perTeamInfo[team.team_id].team_info.members_with_roles.length}{" "}
                                        个成员
                                      </Text>
                                    </TableCell>
                                    <TableCell>
                                      {userRole == "Admin" ? (
                                        <>
                                          <TableIconActionButton
                                            variant="Edit"
                                            onClick={() => {
                                              setSelectedTeamId(team.team_id);
                                              setEditTeam(true);
                                            }}
                                            dataTestId="edit-team-button"
                                            tooltipText="编辑分组"
                                          />
                                          <TableIconActionButton
                                            variant="Delete"
                                            onClick={() => handleDelete(team)}
                                            dataTestId="delete-team-button"
                                            tooltipText="删除分组"
                                          />
                                        </>
                                      ) : null}
                                    </TableCell>
                                  </TableRow>
                                ))
                            ) : (
                              <TableRow>
                                <TableCell colSpan={9} className="text-center">
                                  <div className="flex flex-col items-center justify-center py-4">
                                    <Text className="text-lg font-medium mb-2">未找到分组</Text>
                                    <Text className="text-sm">请调整筛选条件或创建新分组</Text>
                                  </div>
                                </TableCell>
                              </TableRow>
                            )}
                          </TableBody>
                        </Table>
                        <DeleteResourceModal
                          isOpen={isDeleteModalOpen}
                          title="删除分组？"
                          alertMessage={
                            teamToDelete?.keys?.length === 0
                              ? undefined
                              : `警告：该分组关联了 ${teamToDelete?.keys?.length} 个密钥。删除分组将同时删除所有关联密钥，此操作不可恢复。`
                          }
                          message="确认要删除该分组及其所有密钥吗？此操作无法撤销。"
                          resourceInformationTitle="分组信息"
                          resourceInformation={[
                            { label: "分组 ID", value: teamToDelete?.team_id, code: true },
                            { label: "分组名称", value: teamToDelete?.team_alias },
                            { label: "密钥数", value: teamToDelete?.keys?.length },
                            { label: "成员数", value: teamToDelete?.members_with_roles?.length },
                          ]}
                          requiredConfirmation={teamToDelete?.team_alias}
                          onCancel={cancelDelete}
                          onOk={confirmDelete}
                          confirmLoading={isTeamDeleting}
                        />
                      </Card>
                    </Col>
                  </Grid>
                </TabPanel>
                <TabPanel>
                  <AvailableTeamsPanel accessToken={accessToken} userID={userID} />
                </TabPanel>
                {isProxyAdminRole(userRole || "") && (
                  <TabPanel>
                    <TeamSSOSettings accessToken={accessToken} userID={userID || ""} userRole={userRole || ""} />
                  </TabPanel>
                )}
              </TabPanels>
            </TabGroup>
          )}
          {canCreateOrManageTeams(userRole, userID, organizations) && (
            <Modal
              title="创建分组"
              open={isTeamModalVisible}
              width={1000}
              footer={null}
              onOk={handleOk}
              onCancel={handleCancel}
            >
              <Form
                form={form}
                onFinish={handleCreate}
                labelCol={{ span: 8 }}
                wrapperCol={{ span: 16 }}
                labelAlign="left"
              >
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
                  {(() => {
                    const adminOrgs = getAdminOrganizations(userRole, userID, organizations);
                    const isOrgAdmin = userRole !== "Admin";
                    const isSingleOrg = adminOrgs.length === 1;
                    const hasNoOrgs = adminOrgs.length === 0;

                    return (
                      <>
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
                          rules={
                            isOrgAdmin
                              ? [
                                {
                                  required: true,
                                  message: "请选择组织",
                                },
                              ]
                              : []
                          }
                          help={
                            isSingleOrg
                              ? "你只能在该组织下创建分组"
                              : isOrgAdmin
                                ? "必填"
                                : ""
                          }
                        >
                          <Select2
                            showSearch
                            allowClear={!isOrgAdmin}
                            disabled={isSingleOrg}
                            placeholder={hasNoOrgs ? "暂无可用组织" : "搜索或选择组织"}
                            onChange={(value) => {
                              form.setFieldValue("organization_id", value);
                              setCurrentOrgForCreateTeam(
                                adminOrgs?.find((org) => org.organization_id === value) || null,
                              );
                            }}
                            filterOption={(input, option) => {
                              if (!option) return false;
                              const optionValue = option.children?.toString() || "";
                              return optionValue.toLowerCase().includes(input.toLowerCase());
                            }}
                            optionFilterProp="children"
                          >
                            {adminOrgs?.map((org) => (
                              <Select2.Option key={org.organization_id} value={org.organization_id}>
                                <span className="font-medium">{org.organization_alias}</span>{" "}
                                <span className="text-gray-500">({org.organization_id})</span>
                              </Select2.Option>
                            ))}
                          </Select2>
                        </Form.Item>

                        {/* Show message when org admin needs to select organization */}
                        {isOrgAdmin && !isSingleOrg && adminOrgs.length > 1 && (
                          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-md">
                            <Text className="text-blue-800 text-sm">
                              请选择要创建分组的组织。你只能在自己具有管理员权限的组织下创建分组。
                            </Text>
                          </div>
                        )}
                      </>
                    );
                  })()}
                  <Form.Item
                    label={
                      <span>
                        模型{" "}
                        <Tooltip title="这些是当前分组可访问的模型">
                          <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                        </Tooltip>
                      </span>
                    }
                    rules={[
                      {
                        required: true,
                        message: "请至少选择一个模型",
                      },
                    ]}
                    name="models"
                  >
                    <ModelSelect
                      value={form.getFieldValue("models") || []}
                      onChange={(values) => form.setFieldValue("models", values)}
                      organizationID={form.getFieldValue("organization_id")}
                      placeholder="选择模型"
                      options={{
                        includeSpecialOptions: true,
                        showAllProxyModelsOverride: !form.getFieldValue("organization_id"),
                      }}
                      context="team"
                      dataTestId="create-team-models-select"
                    />
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
                          placeholder="请输入分组 ID（可选）"
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
                          disabled={!premiumUser}
                          checkedChildren={
                            premiumUser ? "是" : "高级功能：升级后可按分组禁用全局护栏"
                          }
                          unCheckedChildren={
                            premiumUser ? "否" : "高级功能：升级后可按分组禁用全局护栏"
                          }
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
                            访问组{" "}
                            <Tooltip title="将访问组分配给该分组。访问组决定该分组可使用的模型、MCP 服务与智能体。">
                              <InfoCircleOutlined style={{ marginLeft: "4px" }} />
                            </Tooltip>
                          </span>
                        }
                        name="access_group_ids"
                        className="mt-8"
                        help="选择要分配给该分组的访问组"
                      >
                        <AccessGroupSelector placeholder="选择访问组（可选）" />
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
                              <PremiumLoggingSettings
                                value={loggingSettings}
                                onChange={setLoggingSettings}
                                premiumUser={premiumUser}
                              />
                            </div>
                          </AccordionBody>
                        </Accordion>

                        <Accordion key={`router-settings-accordion-${routerSettingsKey}`} className="mb-4">
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
                                modelData={
                                  userModels.length > 0 ? { data: userModels.map((model) => ({ model_name: model })) } : undefined
                                }
                              />
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
          )}
        </Col>
      </Grid>
    </div>
  );
};

export default Teams;
