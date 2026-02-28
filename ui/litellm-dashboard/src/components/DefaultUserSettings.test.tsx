import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import DefaultUserSettings from "./DefaultUserSettings";
import * as networking from "./networking";

vi.mock("@/contexts/LanguageContext", () => ({
  useLanguage: () => ({
    locale: "en-US",
    setLocale: vi.fn(),
    t: (key: string) => {
      const translations: Record<string, string> = {
        "users.defaultSettings.title": "Default User Settings",
        "users.defaultSettings.editSettings": "Edit Settings",
        "users.defaultSettings.cancel": "Cancel",
        "users.defaultSettings.saveChanges": "Save Changes",
        "users.defaultSettings.schemaDescription":
          "Default parameters to apply when a new user signs in via SSO or is created on the /user/new API endpoint",
        "users.defaultSettings.fieldLabels.userRole": "User Role",
        "users.defaultSettings.fieldLabels.maxBudget": "Max Budget",
        "users.defaultSettings.fieldLabels.budgetDuration": "Budget Duration",
        "users.defaultSettings.fieldLabels.models": "Models",
        "users.defaultSettings.fieldLabels.teams": "Teams",
        "users.defaultSettings.fieldDescriptions.userRole": "Default role assigned to new users created",
        "users.defaultSettings.fieldDescriptions.maxBudget": "Default maximum budget (in USD) for new users created",
        "users.defaultSettings.fieldDescriptions.budgetDuration":
          "Default budget duration for new users (e.g. 'daily', 'weekly', 'monthly')",
        "users.defaultSettings.fieldDescriptions.models": "Default allowed models for new users",
        "users.defaultSettings.fieldDescriptions.teams": "Default team assignments for new users",
        "users.defaultSettings.notSet": "Not Set",
        "users.defaultSettings.noTeamsAssigned": "No teams assigned",
        "users.defaultSettings.teamIdLabel": "Team ID:",
        "users.defaultSettings.notSpecified": "Not Specified",
        "users.defaultSettings.noLimit": "No Limit",
        "users.defaultSettings.role": "Role",
        "users.defaultSettings.enabled": "Enabled",
        "users.defaultSettings.disabled": "Disabled",
        "users.defaultSettings.none": "None",
        "users.defaultSettings.notAvailable": "Default user settings are not available",
        "users.defaultSettings.noSchema": "Schema not available",
        "users.defaultSettings.noDescription": "No description",
        "users.defaultSettings.team": "Team",
        "users.defaultSettings.remove": "Remove",
        "users.defaultSettings.teamId": "Team ID",
        "users.defaultSettings.teamIdPlaceholder": "Enter team ID",
        "users.defaultSettings.maxBudget": "Max Budget",
        "users.defaultSettings.userRole": "User Role",
        "users.defaultSettings.userRoleUser": "User",
        "users.defaultSettings.userRoleAdmin": "Admin",
        "users.defaultSettings.addTeam": "Add Team",
        "users.defaultSettings.noDefaultModels": "No Default Models",
        "users.defaultSettings.allProxyModels": "All Proxy Models",
      };
      return translations[key] || key;
    },
  }),
}));

vi.mock("./networking", () => ({
  getInternalUserSettings: vi.fn(),
  updateInternalUserSettings: vi.fn(),
  modelAvailableCall: vi.fn(),
}));

vi.mock("./common_components/budget_duration_dropdown", () => ({
  default: ({ value, onChange }: { value: string | null; onChange: (value: string | null) => void }) => (
    <select data-testid="budget-duration" value={value || ""} onChange={(e) => onChange(e.target.value || null)}>
      <option value="">Select duration</option>
      <option value="daily">Daily</option>
      <option value="monthly">Monthly</option>
    </select>
  ),
  getBudgetDurationLabel: (value: string) => value,
}));

vi.mock("./key_team_helpers/fetch_available_models_team_key", () => ({
  getModelDisplayName: (model: string) => model,
}));

describe("DefaultUserSettings", () => {
  const mockGetInternalUserSettings = vi.mocked(networking.getInternalUserSettings);
  const mockUpdateInternalUserSettings = vi.mocked(networking.updateInternalUserSettings);
  const mockModelAvailableCall = vi.mocked(networking.modelAvailableCall);

  const defaultProps = {
    accessToken: "test-token",
    userID: "user-123",
    userRole: "Admin",
    possibleUIRoles: {
      internal_user_admin: {
        ui_label: "Admin",
        description: "Full access",
      },
      internal_user_viewer: {
        ui_label: "Viewer",
        description: "Read-only access",
      },
    },
  };

  const mockSettings = {
    values: {
      user_role: "internal_user_admin",
      budget_duration: "monthly",
      max_budget: 1000,
      teams: [],
    },
    field_schema: {
      description: "Default user settings",
      properties: {
        user_role: {
          type: "string",
          description: "User role",
        },
        budget_duration: {
          type: "string",
          description: "Budget duration",
        },
        max_budget: {
          type: "number",
          description: "Maximum budget",
        },
        teams: {
          type: "array",
          description: "Teams",
        },
      },
    },
  };

  beforeEach(() => {
    mockGetInternalUserSettings.mockClear();
    mockUpdateInternalUserSettings.mockClear();
    mockModelAvailableCall.mockClear();
    mockModelAvailableCall.mockResolvedValue({
      data: [{ id: "gpt-4" }, { id: "gpt-3.5-turbo" }],
    });
  });

  it("should render", async () => {
    mockGetInternalUserSettings.mockResolvedValue(mockSettings);

    render(<DefaultUserSettings {...defaultProps} />);

    await waitFor(() => {
      expect(mockGetInternalUserSettings).toHaveBeenCalled();
    });

    expect(screen.getByText("Default User Settings")).toBeInTheDocument();
  });

  it("should toggle edit mode when edit button is clicked", async () => {
    mockGetInternalUserSettings.mockResolvedValue(mockSettings);

    render(<DefaultUserSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Edit Settings")).toBeInTheDocument();
    });

    const editButton = screen.getByText("Edit Settings");
    act(() => {
      fireEvent.click(editButton);
    });

    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Save Changes")).toBeInTheDocument();
    expect(screen.queryByText("Edit Settings")).not.toBeInTheDocument();
  });

  it("should save settings when save button is clicked", async () => {
    mockGetInternalUserSettings.mockResolvedValue(mockSettings);
    mockUpdateInternalUserSettings.mockResolvedValue({
      settings: {
        ...mockSettings.values,
        max_budget: 2000,
      },
    });

    render(<DefaultUserSettings {...defaultProps} />);

    await waitFor(() => {
      expect(screen.getByText("Edit Settings")).toBeInTheDocument();
    });

    const editButton = screen.getByText("Edit Settings");
    act(() => {
      fireEvent.click(editButton);
    });

    await waitFor(() => {
      expect(screen.getByText("Save Changes")).toBeInTheDocument();
    });

    const saveButton = screen.getByText("Save Changes");
    act(() => {
      fireEvent.click(saveButton);
    });

    await waitFor(() => {
      expect(mockUpdateInternalUserSettings).toHaveBeenCalled();
    });

    expect(screen.getByText("Edit Settings")).toBeInTheDocument();
  });
});
