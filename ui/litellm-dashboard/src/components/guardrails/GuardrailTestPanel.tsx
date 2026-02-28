import React, { useState } from "react";
import { Button } from "@tremor/react";
import { Input, Typography, Tooltip } from "antd";
import { CopyOutlined, InfoCircleOutlined } from "@ant-design/icons";
import NotificationsManager from "../molecules/notifications_manager";
import GuardrailTestResults from "./GuardrailTestResults";
import { useLanguage } from "@/contexts/LanguageContext";

const { TextArea } = Input;
const { Text } = Typography;

interface GuardrailTestPanelProps {
  guardrailNames: string[];
  onSubmit: (text: string) => void;
  isLoading: boolean;
  results: Array<{ guardrailName: string; response_text: string; latency: number }> | null;
  errors: Array<{ guardrailName: string; error: Error; latency: number }> | null;
  onClose: () => void;
}

export function GuardrailTestPanel({
  guardrailNames,
  onSubmit,
  isLoading,
  results,
  errors,
  onClose,
}: GuardrailTestPanelProps) {
  const { t, locale } = useLanguage();
  const tr = (key: string, zh: string) => {
    const value = t(key);
    return value === key && locale === "zh-CN" ? zh : value;
  };
  const [inputText, setInputText] = useState("");

  const handleSubmit = () => {
    if (!inputText.trim()) {
      NotificationsManager.fromBackend(tr("guardrailsPage.testPanel.notifications.enterText", "请输入要测试的文本"));
      return;
    }

    onSubmit(inputText);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(text);
        return true;
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (!successful) {
          throw new Error("execCommand failed");
        }
        return true;
      }
    } catch (error) {
      console.error("Copy failed:", error);
      return false;
    }
  };

  const handleCopyInput = async () => {
    const success = await copyToClipboard(inputText);
    if (success) {
      NotificationsManager.success(tr("guardrailsPage.testPanel.notifications.inputCopied", "输入已复制到剪贴板"));
    } else {
      NotificationsManager.fromBackend(
        tr("guardrailsPage.testPanel.notifications.inputCopyFailed", "复制输入失败")
      );
    }
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-1">
              <h2 className="text-lg font-semibold text-gray-900">
                {tr("guardrailsPage.testPanel.title", "测试护栏：")}
              </h2>
              <div className="flex flex-wrap gap-2">
                {guardrailNames.map((name) => (
                  <div
                    key={name}
                    className="inline-flex items-center space-x-1 bg-blue-50 px-3 py-1 rounded-md border border-blue-200"
                  >
                    <span className="font-mono text-blue-700 font-medium text-sm">{name}</span>
                  </div>
                ))}
              </div>
            </div>
            <p className="text-sm text-gray-500">
              {tr("guardrailsPage.testPanel.subtitle", "测试 {count} 个护栏并对比结果").replace(
                "{count}",
                String(guardrailNames.length)
              )}
            </p>
          </div>
        </div>
      </div>

      {/* Input Section */}
      <div className="flex-1 overflow-auto space-y-4">
        <div className="space-y-3">
          <div>
            <div className="flex justify-between items-center mb-2">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Input Text</label>
                <Tooltip title={tr("guardrailsPage.testPanel.input.tooltip", "按 Enter 提交，Shift+Enter 换行。")}>
                  <InfoCircleOutlined className="text-gray-400 cursor-help" />
                </Tooltip>
              </div>
              {inputText && (
                <Button
                  size="xs"
                  variant="secondary"
                  icon={CopyOutlined}
                  onClick={handleCopyInput}
                >
                  {tr("guardrailsPage.testPanel.input.copyButton", "复制输入")}
                </Button>
              )}
            </div>
            <TextArea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={tr("guardrailsPage.testPanel.input.placeholder", "输入要用护栏测试的文本...")}
              rows={8}
              className="font-mono text-sm"
            />
            <div className="flex justify-between items-center mt-1">
              <Text className="text-xs text-gray-500">
                {tr("guardrailsPage.testPanel.input.shortcutPrefix", "按")}{" "}
                <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                  Enter
                </kbd>{" "}
                {tr("guardrailsPage.testPanel.input.shortcutMiddle", "提交 •")}{" "}
                <kbd className="px-1 py-0.5 bg-gray-100 border border-gray-300 rounded text-xs">
                  Shift+Enter
                </kbd>{" "}
                {tr("guardrailsPage.testPanel.input.shortcutSuffix", "换行")}
              </Text>
              <Text className="text-xs text-gray-500">
                {tr("guardrailsPage.testPanel.input.characters", "字符数：{count}").replace(
                  "{count}",
                  String(inputText.length)
                )}
              </Text>
            </div>
          </div>

          <div className="pt-2">
            <Button
              onClick={handleSubmit}
              loading={isLoading}
              disabled={!inputText.trim()}
              className="w-full"
            >
              {isLoading
                ? tr("guardrailsPage.testPanel.buttons.testing", "正在测试 {count} 个护栏...").replace(
                    "{count}",
                    String(guardrailNames.length)
                  )
                : tr("guardrailsPage.testPanel.buttons.test", "测试 {count} 个护栏").replace(
                    "{count}",
                    String(guardrailNames.length)
                  )}
            </Button>
          </div>
        </div>

        {/* Results Section */}
        <GuardrailTestResults results={results} errors={errors} />
      </div>
    </div>
  );
}

export default GuardrailTestPanel;
