import React, { useState, useEffect } from "react";
import { Card, Title, Text, Divider, Button, TextInput } from "@tremor/react";
import { Typography, Spin, Switch, Select } from "antd";
import { getDefaultTeamSettings, updateDefaultTeamSettings, modelAvailableCall } from "./networking";
import BudgetDurationDropdown, { getBudgetDurationLabel } from "./common_components/budget_duration_dropdown";
import { getModelDisplayName } from "./key_team_helpers/fetch_available_models_team_key";
import NotificationsManager from "./molecules/notifications_manager";
import { ModelSelect } from "./ModelSelect/ModelSelect";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  teamDefaultSettingsFieldDescription,
  teamDefaultSettingsFieldLabel,
  teamT,
} from "@/app/(dashboard)/teams/utils/teamI18n";

interface TeamSSOSettingsProps {
  accessToken: string | null;
  userID: string;
  userRole: string;
}

const TeamSSOSettings: React.FC<TeamSSOSettingsProps> = ({ accessToken, userID, userRole }) => {
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
    const fetchTeamSSOSettings = async () => {
      if (!accessToken) {
        setLoading(false);
        return;
      }

      try {
        const data = await getDefaultTeamSettings(accessToken);
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
        console.error("Error fetching team SSO settings:", error);
        NotificationsManager.fromBackend(teamT(t, "teams.defaultSettings.loadFailed"));
      } finally {
        setLoading(false);
      }
    };

    fetchTeamSSOSettings();
  }, [accessToken]);

  const handleSaveSettings = async () => {
    if (!accessToken) return;

    setSaving(true);
    try {
      const updatedSettings = await updateDefaultTeamSettings(accessToken, editedValues);
      setSettings({ ...settings, values: updatedSettings.settings });
      setIsEditing(false);
      NotificationsManager.success(teamT(t, "teams.defaultSettings.saveSuccess"));
    } catch (error) {
      console.error("Error updating team settings:", error);
      NotificationsManager.fromBackend(teamT(t, "teams.defaultSettings.updateFailed"));
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

  const renderEditableField = (key: string, property: any, value: any) => {
    const type = property.type;

    if (key === "budget_duration") {
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
        <ModelSelect
          value={editedValues[key] || []}
          onChange={(value) => handleTextInputChange(key, value)}
          context="global"
          style={{ width: "100%" }}
          options={{
            includeSpecialOptions: true,
          }}
        />
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
    } else {
      return (
        <TextInput
          value={editedValues[key] !== undefined ? String(editedValues[key]) : ""}
          onChange={(e) => handleTextInputChange(key, e.target.value)}
          placeholder={property.description || ""}
          className="mt-2"
        />
      );
    }
  };

  const renderValue = (key: string, value: any): JSX.Element => {
    if (value === null || value === undefined) return <span className="text-gray-400">{teamT(t, "teams.defaultSettings.notSet")}</span>;

    if (key === "budget_duration") {
      return <span>{getBudgetDurationLabel(value)}</span>;
    }

    if (typeof value === "boolean") {
      return <span>{value ? teamT(t, "teams.defaultSettings.enabled") : teamT(t, "teams.defaultSettings.disabled")}</span>;
    }

    if (key === "models" && Array.isArray(value)) {
      if (value.length === 0) return <span className="text-gray-400">{teamT(t, "teams.defaultSettings.none")}</span>;

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
        if (value.length === 0) return <span className="text-gray-400">{teamT(t, "teams.defaultSettings.none")}</span>;

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
        <Text>{teamT(t, "teams.defaultSettings.notAvailable")}</Text>
      </Card>
    );
  }

  const schemaDescription = settings?.field_schema?.description as string | undefined;
  const normalizedDescription =
    schemaDescription && schemaDescription.includes("Default parameters to apply")
      ? teamT(t, "teams.defaultSettings.description")
      : schemaDescription || teamT(t, "teams.defaultSettings.description");

  // Dynamically render settings based on the schema
  const renderSettings = () => {
    const { values, field_schema } = settings;

    if (!field_schema || !field_schema.properties) {
      return <Text>{teamT(t, "teams.defaultSettings.noSchema")}</Text>;
    }

    return Object.entries(field_schema.properties).map(([key, property]: [string, any]) => {
      const value = values[key];
      const defaultDisplayName = key.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
      const displayName = teamDefaultSettingsFieldLabel(key, defaultDisplayName);

      return (
        <div key={key} className="mb-6 pb-6 border-b border-gray-200 last:border-0">
          <Text className="font-medium text-lg">{displayName}</Text>
          <Paragraph className="text-sm text-gray-500 mt-1">
            {teamDefaultSettingsFieldDescription(key, property.description)}
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
        <Title className="text-xl">{teamT(t, "teams.defaultSettings.title")}</Title>
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
                {teamT(t, "teams.defaultSettings.cancel")}
              </Button>
              <Button onClick={handleSaveSettings} loading={saving}>
                {teamT(t, "teams.defaultSettings.saveChanges")}
              </Button>
            </div>
          ) : (
            <Button onClick={() => setIsEditing(true)}>{teamT(t, "teams.defaultSettings.editSettings")}</Button>
          ))}
      </div>

      <Text>{normalizedDescription}</Text>
      <Divider />

      <div className="mt-4 space-y-4">{renderSettings()}</div>
    </Card>
  );
};

export default TeamSSOSettings;
