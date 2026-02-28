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

describe("playground i18n keys", () => {
  it("should include required playground keys in zh-CN", () => {
    const zhCN = buildTranslationsForLocale("zh-CN") as Record<string, any>;
    const requiredKeys = [
      "playground.tabs.chat",
      "playground.tabs.compare",
      "playground.tabs.compliance",
      "playground.tabs.agentBuilder",
      "playground.chat.configurations",
      "playground.chat.virtualKeySource",
      "playground.chat.currentUiSession",
      "playground.chat.customProxyBaseUrl",
      "playground.chat.endpointType",
      "playground.chat.selectModel",
      "playground.chat.selectAgent",
      "playground.chat.tags",
      "playground.chat.mcpServers",
      "playground.chat.vectorStore",
      "playground.chat.guardrails",
      "playground.chat.policies",
      "playground.chat.title.chat",
      "playground.chat.title.testKey",
      "playground.chat.clearChat",
      "playground.chat.getCode",
      "playground.chat.emptyState",
      "playground.chat.inputPlaceholder.default",
      "playground.chat.generatedCode",
      "playground.chat.copyToClipboard",
      "playground.chat.notifications.chatCleared",
    ];

    for (const key of requiredKeys) {
      expect(getValueByPath(zhCN, key), `missing key: ${key}`).toBeTypeOf("string");
    }
  });
});
