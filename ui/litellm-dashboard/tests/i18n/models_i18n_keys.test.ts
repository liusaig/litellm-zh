import { describe, expect, it } from "vitest";
import { buildTranslationsForLocale } from "@/i18n/translations";

const getValueByPath = (obj: Record<string, any>, path: string): unknown => {
  return path.split(".").reduce<unknown>((acc, key) => {
    if (acc && typeof acc === "object" && key in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[key];
    }
    return undefined;
  }, obj);
};

describe("models i18n keys", () => {
  it("should include required models list keys in zh-CN", () => {
    const zhCN = buildTranslationsForLocale("zh-CN");
    const requiredKeys = [
      "models.tabs.passThrough",
      "models.tabs.healthCheck",
      "models.tabs.retrySettings",
      "models.tabs.modelAlias",
      "models.tabs.priceReload",
      "models.allModels.currentTeam",
      "models.allModels.personal",
      "models.allModels.view",
      "models.allModels.currentTeamModels",
      "models.allModels.searchPlaceholder",
      "models.allModels.showingResults",
      "models.allModels.previousPage",
      "models.allModels.nextPage",
      "models.columns.modelId",
      "models.columns.modelInformation",
      "models.columns.credentials",
      "models.columns.createdBy",
      "models.columns.updatedAt",
      "models.columns.costs",
      "models.columns.modelAccessGroup",
      "models.columns.actions",
      "models.credentials.addButton",
      "models.credentials.description",
      "models.credentials.credentialName",
      "models.credentials.provider",
      "models.credentials.actions",
      "models.credentials.noCredentials",
      "models.credentials.deleteTitle",
      "models.credentials.deleteMessage",
      "models.credentials.deleteInfoTitle",
      "models.credentials.updated",
      "models.credentials.added",
      "models.credentials.deleted",
      "models.credentials.deleteFailed",
      "models.credentials.addModalTitle",
      "models.credentials.credentialNameLabel",
      "models.credentials.credentialNameRequired",
      "models.credentials.credentialNamePlaceholder",
      "models.credentials.providerLabel",
      "models.credentials.providerTooltip",
      "models.credentials.needHelp",
      "models.credentials.cancel",
      "models.credentials.addCredential",
    ];

    for (const key of requiredKeys) {
      expect(getValueByPath(zhCN as Record<string, any>, key), `missing key: ${key}`).toBeTypeOf("string");
    }
  });
});
