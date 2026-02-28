import React, { useState, useEffect } from "react";
import { Card, Title, Text, Divider, Button, TextInput } from "@tremor/react";
import { Typography, Spin, Switch, Select, InputNumber } from "antd";
import { useLanguage } from "@/contexts/LanguageContext";
import { PlusOutlined, DeleteOutlined } from "@ant-design/icons";
import { getInternalUserSettings, updateInternalUserSettings, modelAvailableCall } from "./networking";
import BudgetDurationDropdown, { getBudgetDurationLabel } from "./common_components/budget_duration_dropdown";
import { getModelDisplayName } from "./key_team_helpers/fetch_available_models_team_key";
import { formatNumberWithCommas } from "@/utils/dataUtils";
import NotificationManager from "./molecules/notifications_manager";

interface DefaultUserSettingsProps {
  accessToken: string | null;
  possibleUIRoles?: Record<string, Record<string, string>> | null;
  userID: string;
  userRole: string;
}

interface TeamEntry {
  team_id: string;
  max_budget_in_team?: number;
  user_role: "user" | "admin";
}

const ROLE_DESCRIPTION_ZH_MAP: Record<string, string> = {
  "view/create/delete their own keys, view their own spend": "可查看/创建/删除自己的密钥，并查看自己的花费",
  "view their own keys, view their own spend": "仅可查看自己的密钥和花费",
};

const FIELD_DESCRIPTION_I18N_BY_SCHEMA_TEXT: Record<string, string> = {
  "Default role assigned to new users created": "users.defaultSettings.fieldDescriptions.userRole",
  "Default maximum budget (in USD) for new users created": "users.defaultSettings.fieldDescriptions.maxBudget",
  "Default budget duration for new users (e.g. 'daily', 'weekly', 'monthly')":
    "users.defaultSettings.fieldDescriptions.budgetDuration",
  "Default allowed models for new users": "users.defaultSettings.fieldDescriptions.models",
  "Default team assignments for new users": "users.defaultSettings.fieldDescriptions.teams",
};

const DefaultUserSettings: React.FC<DefaultUserSettingsProps> = ({
  accessToken,
  possibleUIRoles,
  userID,
  userRole,
}) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState<boolean>(true);
  const [settings, setSettings] = useState<any>(null);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editedValues, setEditedValues] = useState<any>({});
  const [saving, setSaving] = useState<boolean>(false);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const { Paragraph } = Typography;
  const { Option } = Select;

  useEffect(() => {
    const fetchSSOSettings = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await getInternalUserSettings(accessToken);
        setSettings(data);
        setEditedValues(data.values || {});

        // Fetch available models
        if (accessToken) {
          try {
            const modelResponse = await modelAvailableCall(accessToken, userID, userRole);
            if (modelResponse && modelResponse.data) {
              const modelNames = modelResponse.data.map((model: { id: string }) => model.id);
              setAvailableModels(modelNames);
            }
          } catch (error) {
            console.error("Error fetching available models:", error);
          }
        }
      } catch (error) {
        console.error("Error fetching SSO settings:", error);
        NotificationManager.fromBackend("Failed to fetch SSO settings");
      } finally {
        setLoading(false);
      }
    };

    fetchSSOSettings();
  }, [accessToken]);

  const handleSaveSettings = async () => {
    if (!accessToken) return;

    setSaving(true);
    try {
      // Convert empty strings to null
      const processedValues = Object.entries(editedValues).reduce(
        (acc, [key, value]) => {
          acc[key] = value === "" ? null : value;
          return acc;
        },
        {} as Record<string, any>,
      );

      const updatedSettings = await updateInternalUserSettings(accessToken, processedValues);
      setSettings({ ...settings, values: updatedSettings.settings });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating SSO settings:", error);
      NotificationManager.fromBackend("Failed to update settings: " + error);
    } finally {
      setSaving(false);
    }
  };

  const handleTextInputChange = (key: string, value: any) => {
    setEditedValues((prev: Record<string, any>) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Helper function to normalize teams array to consistent format
  const normalizeTeams = (teams: any[]): TeamEntry[] => {
    if (!teams || !Array.isArray(teams)) return [];

    return teams.map((team) => {
      if (typeof team === "string") {
        return {
          team_id: team,
          user_role: "user" as const,
        };
      } else if (typeof team === "object" && team.team_id) {
        return {
          team_id: team.team_id,
          max_budget_in_team: team.max_budget_in_team,
          user_role: team.user_role || "user",
        };
      }
      return {
        team_id: "",
        user_role: "user" as const,
      };
    });
  };

  // Teams editor component
  const renderTeamsEditor = (teams: any[]) => {
    const normalizedTeams = normalizeTeams(teams);

    const updateTeam = (index: number, field: keyof TeamEntry, value: any) => {
      const updatedTeams = [...normalizedTeams];
      updatedTeams[index] = {
        ...updatedTeams[index],
        [field]: value,
      };
      handleTextInputChange("teams", updatedTeams);
    };

    const addTeam = () => {
      const newTeam: TeamEntry = {
        team_id: "",
        user_role: "user",
      };
      handleTextInputChange("teams", [...normalizedTeams, newTeam]);
    };

    const removeTeam = (index: number) => {
      const updatedTeams = normalizedTeams.filter((_, i) => i !== index);
      handleTextInputChange("teams", updatedTeams);
    };

    return (
      <div className="space-y-3">
        {normalizedTeams.map((team, index) => (
          <div key={index} className="border rounded-lg p-4 bg-gray-50">
            <div className="flex items-center justify-between mb-3">
              <Text className="font-medium">{t("users.defaultSettings.team")} {index + 1}</Text>
              <Button
                size="sm"
                variant="secondary"
                icon={DeleteOutlined}
                onClick={() => removeTeam(index)}
                className="text-red-500 hover:text-red-700"
              >
                {t("users.defaultSettings.remove")}
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Text className="text-sm font-medium mb-1">{t("users.defaultSettings.teamId")}</Text>
                <TextInput
                  value={team.team_id}
                  onChange={(e) => updateTeam(index, "team_id", e.target.value)}
                  placeholder={t("users.defaultSettings.teamIdPlaceholder")}
                />
              </div>

              <div>
                <Text className="text-sm font-medium mb-1">{t("users.defaultSettings.maxBudget")}</Text>
                <InputNumber
                  style={{ width: "100%" }}
                  value={team.max_budget_in_team}
                  onChange={(value) => updateTeam(index, "max_budget_in_team", value)}
                  placeholder={t("users.defaultSettings.notSpecified")}
                  min={0}
                  step={0.01}
                  precision={2}
                />
              </div>

              <div>
                <Text className="text-sm font-medium mb-1">{t("users.defaultSettings.userRole")}</Text>
                <Select
                  style={{ width: "100%" }}
                  value={team.user_role}
                  onChange={(value) => updateTeam(index, "user_role", value)}
                >
                  <Option value="user">{t("users.defaultSettings.userRoleUser")}</Option>
                  <Option value="admin">{t("users.defaultSettings.userRoleAdmin")}</Option>
                </Select>
              </div>
            </div>
          </div>
        ))}

        <Button variant="secondary" icon={PlusOutlined} onClick={addTeam} className="w-full">
          {t("users.defaultSettings.addTeam")}
        </Button>
      </div>
    );
  };

  const renderEditableField = (key: string, property: any, value: any) => {
    const type = property.type;

    if (key === "teams") {
      return <div className="mt-2">{renderTeamsEditor(editedValues[key] || [])}</div>;
    } else if (key === "user_role" && possibleUIRoles) {
      return (
        <Select
          style={{ width: "100%" }}
          value={editedValues[key] || ""}
          onChange={(value) => handleTextInputChange(key, value)}
          className="mt-2"
        >
          {Object.entries(possibleUIRoles)
            .filter(([role]) => role.includes("internal_user"))
            .map(([role, { ui_label, description }]) => (
              <Option key={role} value={role}>
                <div className="flex items-center">
                  <span>{ui_label}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {description ? ROLE_DESCRIPTION_ZH_MAP[description] || description : ""}
                  </span>
                </div>
              </Option>
            ))}
        </Select>
      );
    } else if (key === "budget_duration") {
      return (
        <BudgetDurationDropdown
          value={editedValues[key] || null}
          onChange={(value) => handleTextInputChange(key, value)}
          className="mt-2"
        />
      );
    } else if (type === "boolean") {
      return (
        <div className="mt-2">
          <Switch checked={!!editedValues[key]} onChange={(checked) => handleTextInputChange(key, checked)} />
        </div>
      );
    } else if (type === "array" && property.items?.enum) {
      return (
        <Select
          mode="multiple"
          style={{ width: "100%" }}
          value={editedValues[key] || []}
          onChange={(value) => handleTextInputChange(key, value)}
          className="mt-2"
        >
          {property.items.enum.map((option: string) => (
            <Option key={option} value={option}>
              {option}
            </Option>
          ))}
        </Select>
      );
    } else if (key === "models") {
      return (
        <Select
          mode="multiple"
          style={{ width: "100%" }}
          value={editedValues[key] || []}
          onChange={(value) => handleTextInputChange(key, value)}
          className="mt-2"
        >
          <Option key="no-default-models" value="no-default-models">
            {t("users.defaultSettings.noDefaultModels")}
          </Option>
          <Option key="all-proxy-models" value="all-proxy-models">
            {t("users.defaultSettings.allProxyModels")}
          </Option>
          {availableModels.map((model: string) => (
            <Option key={model} value={model}>
              {getModelDisplayName(model)}
            </Option>
          ))}
        </Select>
      );
    } else if (type === "string" && property.enum) {
      return (
        <Select
          style={{ width: "100%" }}
          value={editedValues[key] || ""}
          onChange={(value) => handleTextInputChange(key, value)}
          className="mt-2"
        >
          {property.enum.map((option: string) => (
            <Option key={option} value={option}>
              {option}
            </Option>
          ))}
        </Select>
      );
    } else if (type === "number" || type === "integer") {
      return (
        <InputNumber
          style={{ width: "100%" }}
          value={editedValues[key] === null || editedValues[key] === undefined ? undefined : editedValues[key]}
          onChange={(value) => handleTextInputChange(key, value)}
          placeholder={t("users.defaultSettings.notSpecified")}
          className="mt-2"
        />
      );
    } else {
      const description = property.description as string | undefined;
      const localizedPlaceholder =
        description && FIELD_DESCRIPTION_I18N_BY_SCHEMA_TEXT[description]
          ? t(FIELD_DESCRIPTION_I18N_BY_SCHEMA_TEXT[description])
          : description || "";

      return (
        <TextInput
          value={editedValues[key] === null || editedValues[key] === undefined ? "" : String(editedValues[key])}
          onChange={(e) => handleTextInputChange(key, e.target.value)}
          placeholder={localizedPlaceholder}
          className="mt-2"
        />
      );
    }
  };

  const renderValue = (key: string, value: any): JSX.Element => {
    if (value === null || value === undefined) return <span className="text-gray-400">{t("users.defaultSettings.notSet")}</span>;

    if (key === "teams" && Array.isArray(value)) {
      if (value.length === 0) return <span className="text-gray-400">{t("users.defaultSettings.noTeamsAssigned")}</span>;

      const normalizedTeams = normalizeTeams(value);

      return (
        <div className="space-y-2 mt-1">
          {normalizedTeams.map((team, index) => (
            <div key={index} className="border rounded-lg p-3 bg-white">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                <div>
                  <span className="font-medium text-gray-600">{t("users.defaultSettings.teamIdLabel")}</span>
                  <p className="text-gray-900">{team.team_id || t("users.defaultSettings.notSpecified")}</p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">{t("users.defaultSettings.maxBudget")}:</span>
                  <p className="text-gray-900">
                    {team.max_budget_in_team !== undefined
                      ? `¥${formatNumberWithCommas(team.max_budget_in_team, 4)}`
                      : t("users.defaultSettings.noLimit")}
                  </p>
                </div>
                <div>
                  <span className="font-medium text-gray-600">{t("users.defaultSettings.role")}:</span>
                  <p className="text-gray-900 capitalize">{team.user_role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      );
    }

    if (key === "user_role" && possibleUIRoles && possibleUIRoles[value]) {
      const { ui_label, description } = possibleUIRoles[value];
      return (
        <div>
          <span className="font-medium">{ui_label}</span>
          {description && (
            <p className="text-xs text-gray-500 mt-1">{ROLE_DESCRIPTION_ZH_MAP[description] || description}</p>
          )}
        </div>
      );
    }

    if (key === "budget_duration") {
      return <span>{getBudgetDurationLabel(value)}</span>;
    }

    if (typeof value === "boolean") {
      return <span>{value ? t("users.defaultSettings.enabled") : t("users.defaultSettings.disabled")}</span>;
    }

    if (key === "models" && Array.isArray(value)) {
      if (value.length === 0) return <span className="text-gray-400">{t("users.defaultSettings.none")}</span>;

      return (
        <div className="flex flex-wrap gap-2 mt-1">
          {value.map((model, index) => (
            <span key={index} className="px-2 py-1 bg-blue-100 rounded text-xs">
              {getModelDisplayName(model)}
            </span>
          ))}
        </div>
      );
    }

    if (typeof value === "object") {
      if (Array.isArray(value)) {
        if (value.length === 0) return <span className="text-gray-400">{t("users.defaultSettings.none")}</span>;

        return (
          <div className="flex flex-wrap gap-2 mt-1">
            {value.map((item, index) => (
              <span key={index} className="px-2 py-1 bg-blue-100 rounded text-xs">
                {typeof item === "object" ? JSON.stringify(item) : String(item)}
              </span>
            ))}
          </div>
        );
      }

      return <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto mt-1">{JSON.stringify(value, null, 2)}</pre>;
    }

    return <span>{String(value)}</span>;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!settings) {
    return (
      <Card>
        <Text>{t("users.defaultSettings.notAvailable")}</Text>
      </Card>
    );
  }

  const getLocalizedSchemaDescription = (description?: string) => {
    if (!description) return "";
    if (description.includes("Default parameters to apply when a new user signs in via SSO")) {
      return t("users.defaultSettings.schemaDescription");
    }
    return description;
  };

  const getFieldDisplayName = (key: string) => {
    const fieldLabels: Record<string, string> = {
      user_role: t("users.defaultSettings.fieldLabels.userRole"),
      max_budget: t("users.defaultSettings.fieldLabels.maxBudget"),
      budget_duration: t("users.defaultSettings.fieldLabels.budgetDuration"),
      models: t("users.defaultSettings.fieldLabels.models"),
      teams: t("users.defaultSettings.fieldLabels.teams"),
    };
    return fieldLabels[key] || key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const getFieldDescription = (key: string, fallback?: string) => {
    const fieldDescriptions: Record<string, string> = {
      user_role: t("users.defaultSettings.fieldDescriptions.userRole"),
      max_budget: t("users.defaultSettings.fieldDescriptions.maxBudget"),
      budget_duration: t("users.defaultSettings.fieldDescriptions.budgetDuration"),
      models: t("users.defaultSettings.fieldDescriptions.models"),
      teams: t("users.defaultSettings.fieldDescriptions.teams"),
    };
    if (fieldDescriptions[key]) return fieldDescriptions[key];

    if (fallback) {
      const translationKey = FIELD_DESCRIPTION_I18N_BY_SCHEMA_TEXT[fallback];
      if (translationKey) return t(translationKey);
      return fallback;
    }

    return t("users.defaultSettings.noDescription");
  };

  // Dynamically render settings based on the schema
  const renderSettings = () => {
    const { values, field_schema } = settings;

    if (!field_schema || !field_schema.properties) {
      return <Text>{t("users.defaultSettings.noSchema")}</Text>;
    }

    return Object.entries(field_schema.properties).map(([key, property]: [string, any]) => {
      const value = values[key];
      const displayName = getFieldDisplayName(key);
      const description = getFieldDescription(key, property.description);

      return (
        <div key={key} className="mb-6 pb-6 border-b border-gray-200 last:border-0">
          <Text className="font-medium text-lg">{displayName}</Text>
          <Paragraph className="text-sm text-gray-500 mt-1">
            {description}
          </Paragraph>

          {isEditing ? (
            <div className="mt-2">{renderEditableField(key, property, value)}</div>
          ) : (
            <div className="mt-1 p-2 bg-gray-50 rounded">{renderValue(key, value)}</div>
          )}
        </div>
      );
    });
  };

  return (
    <Card>
      <div className="flex justify-between items-center mb-4">
        <Title>{t("users.defaultSettings.title")}</Title>
        {!loading &&
          settings &&
          (isEditing ? (
            <div className="flex gap-2">
              <Button
                variant="secondary"
                onClick={() => {
                  setIsEditing(false);
                  setEditedValues(settings.values || {});
                }}
                disabled={saving}
              >
                {t("users.defaultSettings.cancel")}
              </Button>
              <Button onClick={handleSaveSettings} loading={saving}>
                {t("users.defaultSettings.saveChanges")}
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>{t("users.defaultSettings.editSettings")}</Button>
          ))}
      </div>

      {settings?.field_schema?.description && (
        <Paragraph className="mb-4">{getLocalizedSchemaDescription(settings.field_schema.description)}</Paragraph>
      )}
      <Divider />

      <div className="mt-4 space-y-4">{renderSettings()}</div>
    </Card>
  );
};

export default DefaultUserSettings;
