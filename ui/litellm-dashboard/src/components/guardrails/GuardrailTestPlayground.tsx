import React, { useState } from "react";
import { Card, Title, Text, TextInput } from "@tremor/react";
import { List, Empty, Spin, Checkbox } from "antd";
import { ExperimentOutlined, SearchOutlined } from "@ant-design/icons";
import GuardrailTestPanel from "./GuardrailTestPanel";
import { applyGuardrail } from "../networking";
import NotificationsManager from "../molecules/notifications_manager";
import { useLanguage } from "@/contexts/LanguageContext";

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
}

interface GuardrailTestPlaygroundProps {
  guardrailsList: GuardrailItem[];
  isLoading: boolean;
  accessToken: string | null;
  onClose: () => void;
}

interface TestResult {
  guardrailName: string;
  response_text: string;
  latency: number;
}

interface TestError {
  guardrailName: string;
  error: Error;
  latency: number;
}

const GuardrailTestPlayground: React.FC<GuardrailTestPlaygroundProps> = ({
  guardrailsList,
  isLoading,
  accessToken,
  onClose,
}) => {
  const { t, locale } = useLanguage();
  const tr = (key: string, zh: string) => {
    const value = t(key);
    return value === key && locale === "zh-CN" ? zh : value;
  };
  const [selectedGuardrails, setSelectedGuardrails] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState("");
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const [testErrors, setTestErrors] = useState<TestError[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const filteredGuardrails = guardrailsList.filter((guardrail) =>
    guardrail.guardrail_name?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleGuardrailSelection = (guardrailName: string) => {
    const newSelection = new Set(selectedGuardrails);
    if (newSelection.has(guardrailName)) {
      newSelection.delete(guardrailName);
    } else {
      newSelection.add(guardrailName);
    }
    setSelectedGuardrails(newSelection);
  };

  const handleTestGuardrails = async (text: string) => {
    if (selectedGuardrails.size === 0 || !accessToken) {
      return;
    }

    setIsTesting(true);
    setTestResults([]);
    setTestErrors([]);

    const results: TestResult[] = [];
    const errors: TestError[] = [];

    await Promise.all(
      Array.from(selectedGuardrails).map(async (guardrailName) => {
        const startTime = Date.now();
        try {
          const result = await applyGuardrail(accessToken, guardrailName, text, null, null);
          const latency = Date.now() - startTime;
          results.push({
            guardrailName,
            response_text: result.response_text,
            latency,
          });
        } catch (error) {
          const latency = Date.now() - startTime;
          console.error(`Error testing guardrail ${guardrailName}:`, error);
          errors.push({
            guardrailName,
            error: error as Error,
            latency,
          });
        }
      })
    );

    setTestResults(results);
    setTestErrors(errors);
    setIsTesting(false);

    if (results.length > 0) {
      NotificationsManager.success(
        tr("guardrailsPage.playground.notifications.appliedSuccess", "成功应用 {count} 个护栏").replace(
          "{count}",
          String(results.length)
        )
      );
    }
    if (errors.length > 0) {
      NotificationsManager.fromBackend(
        tr("guardrailsPage.playground.notifications.failed", "{count} 个护栏执行失败").replace(
          "{count}",
          String(errors.length)
        )
      );
    }
  };

  return (
    <div className="w-full h-[calc(100vh-200px)]">
      <Card className="h-full">
        <div className="flex h-full">
          {/* Left Sidebar - Guardrails List */}
          <div className="w-1/4 border-r border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="mb-3">
                <Title className="text-lg font-semibold mb-3">
                  {tr("guardrailsPage.playground.sidebar.title", "护栏")}
                </Title>
                <TextInput
                  icon={SearchOutlined}
                  placeholder={tr("guardrailsPage.playground.sidebar.searchPlaceholder", "搜索护栏...")}
                  value={searchQuery}
                  onValueChange={setSearchQuery}
                />
              </div>
            </div>

            <div className="flex-1 overflow-auto">
              {isLoading ? (
                <div className="flex items-center justify-center h-32">
                  <Spin />
                </div>
              ) : filteredGuardrails.length === 0 ? (
                <div className="p-4">
                  <Empty
                    description={
                      searchQuery
                        ? tr("guardrailsPage.playground.sidebar.noMatch", "没有匹配搜索条件的护栏")
                        : tr("guardrailsPage.playground.sidebar.noAvailable", "暂无可用护栏")
                    }
                  />
                </div>
              ) : (
                <List
                  dataSource={filteredGuardrails}
                  renderItem={(guardrail) => (
                    <List.Item
                      onClick={() => {
                        if (guardrail.guardrail_name) {
                          toggleGuardrailSelection(guardrail.guardrail_name);
                        }
                      }}
                      className={`cursor-pointer hover:bg-gray-50 transition-colors px-4 ${
                        selectedGuardrails.has(guardrail.guardrail_name || "")
                          ? "bg-blue-50 border-l-4 border-l-blue-500"
                          : "border-l-4 border-l-transparent"
                      }`}
                    >
                      <List.Item.Meta
                        avatar={
                          <Checkbox
                            checked={selectedGuardrails.has(guardrail.guardrail_name || "")}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (guardrail.guardrail_name) {
                                toggleGuardrailSelection(guardrail.guardrail_name);
                              }
                            }}
                          />
                        }
                        title={
                          <div className="flex items-center space-x-2">
                            <ExperimentOutlined className="text-gray-400" />
                            <span className="font-medium text-gray-900">
                              {guardrail.guardrail_name}
                            </span>
                          </div>
                        }
                        description={
                          <div className="text-xs space-y-1 mt-1">
                            <div>
                              <span className="font-medium">
                                {tr("guardrailsPage.playground.sidebar.typeLabel", "类型：")}{" "}
                              </span>
                              <span className="text-gray-600">
                                {guardrail.litellm_params.guardrail}
                              </span>
                            </div>
                            <div>
                              <span className="font-medium">
                                {tr("guardrailsPage.playground.sidebar.modeLabel", "模式：")}{" "}
                              </span>
                              <span className="text-gray-600">
                                {guardrail.litellm_params.mode}
                              </span>
                            </div>
                          </div>
                        }
                      />
                    </List.Item>
                  )}
                />
              )}
            </div>

            <div className="p-3 border-t border-gray-200 bg-gray-50">
              <Text className="text-xs text-gray-600">
                {tr("guardrailsPage.playground.sidebar.selectedCount", "已选择 {selected} / {total}")
                  .replace("{selected}", String(selectedGuardrails.size))
                  .replace("{total}", String(filteredGuardrails.length))}
              </Text>
            </div>
          </div>

          {/* Right Panel - Test Area */}
          <div className="w-3/4 flex flex-col bg-white">
            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
              <Title className="text-xl font-semibold mb-0">
                {tr("guardrailsPage.playground.main.title", "护栏测试操场")}
              </Title>
            </div>

            <div className="flex-1 overflow-auto p-4">
              {selectedGuardrails.size === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-gray-400">
                  <ExperimentOutlined style={{ fontSize: "48px", marginBottom: "16px" }} />
                  <Text className="text-lg font-medium text-gray-600 mb-2">
                    {tr("guardrailsPage.playground.empty.title", "选择要测试的护栏")}
                  </Text>
                  <Text className="text-center text-gray-500 max-w-md">
                    {tr("guardrailsPage.playground.empty.description", "从左侧选择一个或多个护栏，开始测试并对比结果。")}
                  </Text>
                </div>
              ) : (
                <div className="h-full">
                  <GuardrailTestPanel
                    guardrailNames={Array.from(selectedGuardrails)}
                    onSubmit={handleTestGuardrails}
                    results={testResults.length > 0 ? testResults : null}
                    errors={testErrors.length > 0 ? testErrors : null}
                    isLoading={isTesting}
                    onClose={() => setSelectedGuardrails(new Set())}
                  />
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GuardrailTestPlayground;
