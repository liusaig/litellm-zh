"use client";

import { useState, useEffect } from "react";
import ChatUI from "@/components/playground/chat_ui/ChatUI";
import CompareUI from "@/components/playground/compareUI/CompareUI";
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from "@tremor/react";
import useAuthorized from "@/app/(dashboard)/hooks/useAuthorized";
import { fetchProxySettings } from "@/utils/proxyUtils";
import { buildTranslationsForLocale, Translations } from "@/i18n/translations";

interface ProxySettings {
  PROXY_BASE_URL?: string;
  LITELLM_UI_API_DOC_BASE_URL?: string | null;
}

export default function PlaygroundPage() {
  const { accessToken, userRole, userId, disabledPersonalKeyCreation, token } = useAuthorized();
  const translations = buildTranslationsForLocale("zh-CN") as Translations;
  const fallbackTranslations = buildTranslationsForLocale("en-US") as Translations;
  const resolveKey = (source: Translations, key: string): string | null => {
    const keys = key.split(".");
    let value: any = source;
    for (const k of keys) {
      if (value && typeof value === "object" && k in value) {
        value = value[k];
      } else {
        return null;
      }
    }
    return typeof value === "string" ? value : null;
  };
  const tr = (key: string, fallback: string) => {
    return resolveKey(translations, key) || resolveKey(fallbackTranslations, key) || fallback;
  };
  const [proxySettings, setProxySettings] = useState<ProxySettings | undefined>(undefined);

  useEffect(() => {
    const initializeProxySettings = async () => {
      if (accessToken) {
        const settings = await fetchProxySettings(accessToken);
        if (settings) {
          setProxySettings({
            PROXY_BASE_URL: settings.PROXY_BASE_URL,
            LITELLM_UI_API_DOC_BASE_URL: settings.LITELLM_UI_API_DOC_BASE_URL,
          });
        }
      }
    };

    initializeProxySettings();
  }, [accessToken]);

  return (
    <TabGroup className="h-full w-full">
      <TabList className="mb-0">
        <Tab>{tr("playground.tabs.chat", "Chat")}</Tab>
        <Tab>{tr("playground.tabs.compare", "Compare")}</Tab>
      </TabList>
      <TabPanels className="h-full">
        <TabPanel className="h-full">
          <ChatUI
            accessToken={accessToken}
            token={token}
            userRole={userRole}
            userID={userId}
            disabledPersonalKeyCreation={disabledPersonalKeyCreation}
            proxySettings={proxySettings}
          />
        </TabPanel>
        <TabPanel className="h-full">
          <CompareUI accessToken={accessToken} disabledPersonalKeyCreation={disabledPersonalKeyCreation} />
        </TabPanel>
      </TabPanels>
    </TabGroup>
  );
}
