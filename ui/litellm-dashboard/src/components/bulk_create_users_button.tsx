import React, { useState, useEffect } from "react";
import { Button as TremorButton, Text } from "@tremor/react";
import { Modal, Table, Upload, Typography } from "antd";
import {
  UploadOutlined,
  DownloadOutlined,
  WarningOutlined,
  FileTextOutlined,
  DeleteOutlined,
  FileExclamationOutlined,
} from "@ant-design/icons";
import { userCreateCall, invitationCreateCall, getProxyUISettings } from "./networking";
import Papa from "papaparse";
import { CheckCircleIcon, XCircleIcon, ExclamationIcon } from "@heroicons/react/outline";
import { CopyToClipboard } from "react-copy-to-clipboard";
import NotificationsManager from "./molecules/notifications_manager";

interface BulkCreateUsersProps {
  accessToken: string;
  teams: any[] | null;
  possibleUIRoles: null | Record<string, Record<string, string>>;
  onUsersCreated?: () => void;
}

interface UserData {
  user_email: string;
  user_role: string;
  teams?: string | string[];
  metadata?: string;
  max_budget?: string | number;
  budget_duration?: string;
  models?: string | string[];
  status?: string;
  error?: string;
  rowNumber?: number;
  isValid?: boolean;
  key?: string;
  invitation_link?: string;
}

// Define an interface for the UI settings
interface UISettings {
  PROXY_BASE_URL: string | null;
  PROXY_LOGOUT_URL: string | null;
  DEFAULT_TEAM_DISABLED: boolean;
  SSO_ENABLED: boolean;
}

const BulkCreateUsersButton: React.FC<BulkCreateUsersProps> = ({
  accessToken,
  teams,
  possibleUIRoles,
  onUsersCreated,
}) => {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [parsedData, setParsedData] = useState<UserData[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [csvStructureError, setCsvStructureError] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uiSettings, setUISettings] = useState<UISettings | null>(null);
  const [baseUrl, setBaseUrl] = useState("http://localhost:4000");

  useEffect(() => {
    // Get UI settings
    const fetchUISettings = async () => {
      try {
        const uiSettingsResponse = await getProxyUISettings(accessToken);
        setUISettings(uiSettingsResponse);
      } catch (error) {
        console.error("Error fetching UI settings:", error);
      }
    };

    fetchUISettings();

    // Set base URL
    const base = new URL("/", window.location.href);
    setBaseUrl(base.toString());
  }, [accessToken]);

  const downloadTemplate = () => {
    const template = [
      ["user_email", "user_role", "teams", "max_budget", "budget_duration", "models"],
      ["user@example.com", "internal_user", "team-id-1,team-id-2", "100", "30d", "gpt-3.5-turbo,gpt-4"],
    ];

    const csv = Papa.unparse(template);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_users_template.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleFileUpload = (file: File) => {
    // Reset all error states
    setParseError(null);
    setCsvStructureError(null);
    setFileError(null);

    // Set the selected file - always show the file even if it's invalid
    setSelectedFile(file);

    // Check file type
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setFileError(`文件类型无效：${file.name}。请上传 CSV 文件（.csv 后缀）。`);
      NotificationsManager.fromBackend("文件类型无效，请上传 CSV 文件。");
      return false;
    }

    // Check file size (limit to 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setFileError(
        `文件过大（${(file.size / (1024 * 1024)).toFixed(1)} MB）。请上传小于 5MB 的 CSV 文件。`,
      );
      return false;
    }

    Papa.parse(file, {
      complete: (results) => {
        // Check if file is empty
        if (!results.data || results.data.length === 0) {
          setCsvStructureError("CSV 文件为空，请上传包含数据的文件。");
          setParsedData([]);
          return;
        }

        // Check if there's only header row
        if (results.data.length === 1) {
          setCsvStructureError("CSV 文件仅包含表头，没有用户数据。请在 CSV 中添加用户数据。");
          setParsedData([]);
          return;
        }

        const headers = results.data[0] as string[];

        // Check if headers exist
        if (headers.length === 0 || (headers.length === 1 && headers[0] === "")) {
          setCsvStructureError("CSV 文件不包含列名，请确认 CSV 包含表头。");
          setParsedData([]);
          return;
        }

        const requiredColumns = ["user_email", "user_role"];

        // Check if all required columns are present
        const missingColumns = requiredColumns.filter((col) => !headers.includes(col));
        if (missingColumns.length > 0) {
          setCsvStructureError(
            `CSV 缺少必填列：${missingColumns.join(", ")}。请补充后重试。`,
          );
          setParsedData([]);
          return;
        }

        try {
          const userData = results.data
            .slice(1)
            .map((row: any, index: number) => {
              // Skip empty rows
              if (row.length === 0 || (row.length === 1 && row[0] === "")) {
                return null;
              }

              // Check if row has enough columns
              if (row.length < headers.length) {
                return {
                  rowNumber: index + 2,
                  isValid: false,
                  error: `第 ${index + 2} 行列数少于表头，请检查 CSV 格式。`,
                  user_email: "",
                  user_role: "",
                } as UserData;
              }

              const user: UserData = {
                user_email: row[headers.indexOf("user_email")]?.trim() || "",
                user_role: row[headers.indexOf("user_role")]?.trim() || "",
                teams: row[headers.indexOf("teams")]?.trim(),
                max_budget: row[headers.indexOf("max_budget")]?.trim(),
                budget_duration: row[headers.indexOf("budget_duration")]?.trim(),
                models: row[headers.indexOf("models")]?.trim(),
                rowNumber: index + 2,
                isValid: true,
                error: "",
              };

              // Validate the row
              const errors: string[] = [];

              // Email validation
              if (!user.user_email) {
                errors.push("邮箱为必填项");
              } else if (!user.user_email.includes("@") || !user.user_email.includes(".")) {
                errors.push("邮箱格式无效（需包含 @ 和域名）");
              }

              // Role validation
              if (!user.user_role) {
                errors.push("角色为必填项");
              } else {
                // Validate user role
                const validRoles = ["proxy_admin", "proxy_admin_viewer", "internal_user", "internal_user_viewer"];
                if (!validRoles.includes(user.user_role)) {
                  errors.push(`角色 "${user.user_role}" 无效，可选值：${validRoles.join(", ")}`);
                }
              }

              // Budget validation
              if (user.max_budget && user.max_budget.toString().trim() !== "") {
                if (isNaN(parseFloat(user.max_budget.toString()))) {
                  errors.push(`预算上限 "${user.max_budget}" 必须是数字`);
                } else if (parseFloat(user.max_budget.toString()) <= 0) {
                  errors.push("预算上限必须大于 0");
                }
              }

              // Budget duration validation
              if (user.budget_duration && !user.budget_duration.match(/^\d+[dhmwy]$|^\d+mo$/)) {
                errors.push(
                  `预算重置周期格式无效 "${user.budget_duration}"，示例：30d、1mo、2w、6h`,
                );
              }

              // Teams validation
              if (user.teams && typeof user.teams === "string") {
                // Check if teams exist (if teams data is available)
                if (teams && teams.length > 0) {
                  const teamIds = teams.map((t) => t.team_id);
                  const userTeams = user.teams.split(",").map((t) => t.trim());
                  const invalidTeams = userTeams.filter((t) => !teamIds.includes(t));
                  if (invalidTeams.length > 0) {
                    errors.push(`未知分组：${invalidTeams.join(", ")}`);
                  }
                }
              }

              if (errors.length > 0) {
                user.isValid = false;
                user.error = errors.join(", ");
              }

              return user;
            })
            .filter(Boolean) as UserData[]; // Filter out null values (empty rows)

          const validData = userData.filter((user) => user.isValid);
          setParsedData(userData);

          if (userData.length === 0) {
            setCsvStructureError("CSV 中未找到有效数据行，请检查文件格式。");
          } else if (validData.length === 0) {
            setParseError("CSV 中没有可创建的有效用户，请根据下方错误提示修正后重试。");
          } else if (validData.length < userData.length) {
            setParseError(
              `共 ${userData.length} 行，其中 ${userData.length - validData.length} 行存在错误，请修正后继续。`,
            );
          } else {
            NotificationsManager.success(`解析成功，共 ${validData.length} 个用户`);
          }
        } catch (error: unknown) {
          const errorMessage = error instanceof Error ? error.message : "未知错误";
          setParseError(`CSV 解析失败：${errorMessage}`);
          setParsedData([]);
        }
      },
      error: (error) => {
        setParseError(`CSV 解析失败：${error.message}`);
        setParsedData([]);
      },
      header: false,
    });
    return false;
  };

  const removeSelectedFile = () => {
    setSelectedFile(null);
    setParsedData([]);
    setParseError(null);
    setCsvStructureError(null);
    setFileError(null);
  };

  const handleBulkCreate = async () => {
    setIsProcessing(true);
    const updatedData = parsedData.map((user) => ({ ...user, status: "pending" }));
    setParsedData(updatedData);

    let anySuccessful = false;

    for (let index = 0; index < updatedData.length; index++) {
      const user = updatedData[index];
      try {
        // Create a clean user object with only non-empty values
        const cleanUser: Partial<UserData> = {
          user_email: user.user_email,
          user_role: user.user_role,
        };

        // Only add optional fields if they have values
        if (user.teams && typeof user.teams === "string" && user.teams.trim() !== "") {
          cleanUser.teams = user.teams
            .split(",")
            .map((team) => team.trim())
            .filter(Boolean);
          // Only include teams if there's at least one valid team
          if (cleanUser.teams.length === 0) {
            delete cleanUser.teams;
          }
        }

        // Only add models if provided and non-empty
        if (user.models && typeof user.models === "string" && user.models.trim() !== "") {
          cleanUser.models = user.models
            .split(",")
            .map((model) => model.trim())
            .filter(Boolean);
          // Only include models if there's at least one valid model
          if (cleanUser.models.length === 0) {
            delete cleanUser.models;
          }
        }

        // Only add max_budget if it's a valid number
        if (user.max_budget && user.max_budget.toString().trim() !== "") {
          const budgetValue = parseFloat(user.max_budget.toString());
          if (!isNaN(budgetValue) && budgetValue > 0) {
            cleanUser.max_budget = budgetValue;
          }
        }

        // Only add budget_duration if provided and non-empty
        if (user.budget_duration && user.budget_duration.trim() !== "") {
          cleanUser.budget_duration = user.budget_duration.trim();
        }

        // Only add metadata if provided and non-empty
        if (user.metadata && typeof user.metadata === "string" && user.metadata.trim() !== "") {
          cleanUser.metadata = user.metadata.trim();
        }

        console.log("Sending user data:", cleanUser);
        const response = await userCreateCall(accessToken, null, cleanUser);
        console.log("Full response:", response);

        // Check if response has key or user_id, indicating success
        if (response && (response.key || response.user_id)) {
          anySuccessful = true;
          console.log("Success case triggered");
          const user_id = response.data?.user_id || response.user_id;

          // Create invitation link for the user
          try {
            if (!uiSettings?.SSO_ENABLED) {
              // Regular invitation flow
              const invitationData = await invitationCreateCall(accessToken, user_id);
              const invitationUrl = new URL(`/ui?invitation_id=${invitationData.id}`, baseUrl).toString();

              setParsedData((current) =>
                current.map((u, i) =>
                  i === index
                    ? {
                      ...u,
                      status: "success",
                      key: response.key || response.user_id,
                      invitation_link: invitationUrl,
                    }
                    : u,
                ),
              );
            } else {
              // SSO flow - just use the base URL
              const invitationUrl = new URL("/ui", baseUrl).toString();

              setParsedData((current) =>
                current.map((u, i) =>
                  i === index
                    ? {
                      ...u,
                      status: "success",
                      key: response.key || response.user_id,
                      invitation_link: invitationUrl,
                    }
                    : u,
                ),
              );
            }
          } catch (inviteError) {
            console.error("Error creating invitation:", inviteError);
            setParsedData((current) =>
              current.map((u, i) =>
                i === index
                  ? {
                    ...u,
                    status: "success",
                    key: response.key || response.user_id,
                    error: "用户创建成功，但生成邀请链接失败",
                  }
                  : u,
              ),
            );
          }
        } else {
          console.log("Error case triggered");
          const errorMessage = response?.error || "创建用户失败";
          console.log("Error message:", errorMessage);
          setParsedData((current) =>
            current.map((u, i) => (i === index ? { ...u, status: "failed", error: errorMessage } : u)),
          );
        }
      } catch (error) {
        console.error("Caught error:", error);
        const errorMessage = (error as any)?.response?.data?.error || (error as Error)?.message || String(error);
        setParsedData((current) =>
          current.map((u, i) => (i === index ? { ...u, status: "failed", error: errorMessage } : u)),
        );
      }
    }

    setIsProcessing(false);

    // Call the callback if any users were successfully created
    if (anySuccessful && onUsersCreated) {
      onUsersCreated();
    }
  };

  const downloadResults = () => {
    const results = parsedData.map((user) => ({
      user_email: user.user_email,
      user_role: user.user_role,
      status: user.status,
      key: user.key || "",
      invitation_link: user.invitation_link || "",
      error: user.error || "",
    }));

    const csv = Papa.unparse(results);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "bulk_users_results.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const columns = [
    {
      title: "行号",
      dataIndex: "rowNumber",
      key: "rowNumber",
      width: 80,
    },
    {
      title: "邮箱",
      dataIndex: "user_email",
      key: "user_email",
    },
    {
      title: "角色",
      dataIndex: "user_role",
      key: "user_role",
    },
    {
      title: "分组",
      dataIndex: "teams",
      key: "teams",
    },
    {
      title: "预算",
      dataIndex: "max_budget",
      key: "max_budget",
    },
    {
      title: "状态",
      key: "status",
      render: (_: any, record: UserData) => {
        if (!record.isValid) {
          return (
            <div>
              <div className="flex items-center">
                <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
                <span className="text-red-500">无效</span>
              </div>
              {record.error && <span className="text-sm text-red-500 ml-7">{record.error}</span>}
            </div>
          );
        }
        if (!record.status || record.status === "pending") {
          return <span className="text-gray-500">处理中</span>;
        }
        if (record.status === "success") {
          return (
            <div>
              <div className="flex items-center">
                <CheckCircleIcon className="h-5 w-5 text-green-500 mr-2" />
                <span className="text-green-500">成功</span>
              </div>
              {record.invitation_link && (
                <div className="mt-1">
                  <div className="flex items-center">
                    <span className="text-xs text-gray-500 truncate max-w-[150px]">{record.invitation_link}</span>
                    <CopyToClipboard
                      text={record.invitation_link}
                      onCopy={() => NotificationsManager.success("邀请链接已复制")}
                    >
                      <button className="ml-1 text-blue-500 text-xs hover:text-blue-700">复制</button>
                    </CopyToClipboard>
                  </div>
                </div>
              )}
            </div>
          );
        }
        return (
          <div>
            <div className="flex items-center">
              <XCircleIcon className="h-5 w-5 text-red-500 mr-2" />
              <span className="text-red-500">失败</span>
            </div>
            {record.error && <span className="text-sm text-red-500 ml-7">{JSON.stringify(record.error)}</span>}
          </div>
        );
      },
    },
  ];

  return (
    <>
      <TremorButton className="mb-0" onClick={() => setIsModalVisible(true)}>
        + 批量创建
      </TremorButton>

      <Modal
        title="批量创建"
        open={isModalVisible}
        width={800}
        onCancel={() => setIsModalVisible(false)}
        bodyStyle={{ maxHeight: "70vh", overflow: "auto" }}
        footer={null}
      >
        <div className="flex flex-col">
          {/* Step indicator */}
          {parsedData.length === 0 ? (
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3">
                  1
                </div>
                <h3 className="text-lg font-medium">下载并填写模板</h3>
              </div>

              <div className="ml-11 mb-6">
                <p className="mb-4">按照以下步骤一次性批量创建用户：</p>
                <ol className="list-decimal list-inside space-y-2 ml-2 mb-4">
                  <li>下载 CSV 模板</li>
                  <li>在表格中填写用户信息</li>
                  <li>保存并上传 CSV 文件</li>
                  <li>创建完成后，下载包含每个用户虚拟密钥的结果文件</li>
                </ol>

                <div className="bg-gray-50 p-4 rounded-md border border-gray-200 mb-4">
                  <h4 className="font-medium mb-2">模板字段说明</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 mr-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium">user_email</p>
                        <p className="text-sm text-gray-600">用户邮箱（必填）</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-red-500 mt-1.5 mr-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium">user_role</p>
                        <p className="text-sm text-gray-600">
                          用户角色（可选值：&quot;proxy_admin&quot;、&quot;proxy_admin_viewer&quot;、
                          &quot;internal_user&quot;、&quot;internal_user_viewer&quot;）
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-gray-300 mt-1.5 mr-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium">teams</p>
                        <p className="text-sm text-gray-600">
                          逗号分隔的分组 ID（示例：&quot;team-1,team-2&quot;）
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-gray-300 mt-1.5 mr-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium">max_budget</p>
                        <p className="text-sm text-gray-600">预算上限（数字，示例：&quot;100&quot;）</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-gray-300 mt-1.5 mr-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium">budget_duration</p>
                        <p className="text-sm text-gray-600">
                          预算重置周期（示例：&quot;30d&quot;、&quot;1mo&quot;）
                        </p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="w-3 h-3 rounded-full bg-gray-300 mt-1.5 mr-2 flex-shrink-0"></div>
                      <div>
                        <p className="font-medium">models</p>
                        <p className="text-sm text-gray-600">
                          逗号分隔的可用模型（示例：&quot;gpt-3.5-turbo,gpt-4&quot;）
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <TremorButton onClick={downloadTemplate} size="lg" className="w-full md:w-auto">
                  <DownloadOutlined className="mr-2" /> 下载 CSV 模板
                </TremorButton>
              </div>

              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3">
                  2
                </div>
                <h3 className="text-lg font-medium">上传已填写的 CSV</h3>
              </div>

              <div className="ml-11">
                {selectedFile ? (
                  <div
                    className={`mb-4 p-4 rounded-md border ${fileError ? "bg-red-50 border-red-200" : "bg-blue-50 border-blue-200"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {fileError ? (
                          <FileExclamationOutlined className="text-red-500 text-xl mr-3" />
                        ) : (
                          <FileTextOutlined className="text-blue-500 text-xl mr-3" />
                        )}
                        <div>
                          <Typography.Text strong className={fileError ? "text-red-800" : "text-blue-800"}>
                            {selectedFile.name}
                          </Typography.Text>
                          <Typography.Text className={`block text-xs ${fileError ? "text-red-600" : "text-blue-600"}`}>
                            {(selectedFile.size / 1024).toFixed(1)} KB • {new Date().toLocaleDateString()}
                          </Typography.Text>
                        </div>
                      </div>
                      <TremorButton
                        size="xs"
                        variant="secondary"
                        onClick={removeSelectedFile}
                        className="flex items-center"
                      >
                        <DeleteOutlined className="mr-1" /> 移除
                      </TremorButton>
                    </div>

                    {fileError ? (
                      <div className="mt-3 text-red-600 text-sm flex items-start">
                        <WarningOutlined className="mr-2 mt-0.5" />
                        <span>{fileError}</span>
                      </div>
                    ) : (
                      !csvStructureError && (
                        <div className="mt-3 flex items-center">
                          <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-blue-500 h-1.5 rounded-full w-full animate-pulse"></div>
                          </div>
                          <span className="ml-2 text-xs text-blue-600">处理中...</span>
                        </div>
                      )
                    )}
                  </div>
                ) : (
                  <Upload beforeUpload={handleFileUpload} accept=".csv" maxCount={1} showUploadList={false}>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer">
                      <UploadOutlined className="text-3xl text-gray-400 mb-2" />
                      <p className="mb-1">将 CSV 文件拖拽到这里</p>
                      <p className="text-sm text-gray-500 mb-3">或</p>
                      <TremorButton size="sm">选择文件</TremorButton>
                      <p className="text-xs text-gray-500 mt-4">仅支持 CSV 文件（.csv）</p>
                    </div>
                  </Upload>
                )}

                {csvStructureError && (
                  <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                    <div className="flex items-start">
                      <ExclamationIcon className="h-5 w-5 text-yellow-500 mr-2 mt-0.5" />
                      <div>
                        <Typography.Text strong className="text-yellow-800">
                          CSV 结构错误
                        </Typography.Text>
                        <Typography.Paragraph className="text-yellow-700 mt-1 mb-0">
                          {csvStructureError}
                        </Typography.Paragraph>
                        <Typography.Paragraph className="text-yellow-700 mt-2 mb-0">
                          请下载模板并确保 CSV 格式符合要求。
                        </Typography.Paragraph>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center mr-3">
                  3
                </div>
                <h3 className="text-lg font-medium">
                  {parsedData.some((user) => user.status === "success" || user.status === "failed")
                    ? "创建结果"
                    : "确认并创建用户"}
                </h3>
              </div>

              {parseError && (
                <div className="ml-11 mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex items-start">
                    <WarningOutlined className="text-red-500 mr-2 mt-1" />
                    <div>
                      <Text className="text-red-600 font-medium">{parseError}</Text>
                      {parsedData.some((user) => !user.isValid) && (
                        <ul className="mt-2 list-disc list-inside text-red-600 text-sm">
                          <li>请查看下方表格中每一行的具体错误</li>
                          <li>
                            常见问题包括邮箱格式错误、必填项缺失或角色值不正确
                          </li>
                          <li>修复后请重新上传 CSV 文件</li>
                        </ul>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="ml-11">
                <div className="flex justify-between items-center mb-3">
                  <div className="flex items-center">
                    {parsedData.some((user) => user.status === "success" || user.status === "failed") ? (
                      <div className="flex items-center">
                        <Text className="text-lg font-medium mr-3">创建汇总</Text>
                        <Text className="text-sm bg-green-100 text-green-800 px-2 py-1 rounded mr-2">
                          成功 {parsedData.filter((d) => d.status === "success").length}
                        </Text>
                        {parsedData.some((d) => d.status === "failed") && (
                          <Text className="text-sm bg-red-100 text-red-800 px-2 py-1 rounded">
                            失败 {parsedData.filter((d) => d.status === "failed").length}
                          </Text>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <Text className="text-lg font-medium mr-3">用户预览</Text>
                        <Text className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          有效用户 {parsedData.filter((d) => d.isValid).length} / {parsedData.length}
                        </Text>
                      </div>
                    )}
                  </div>

                  {!parsedData.some((user) => user.status === "success" || user.status === "failed") && (
                    <div className="flex space-x-3">
                      <TremorButton
                        onClick={() => {
                          setParsedData([]);
                          setParseError(null);
                        }}
                        variant="secondary"
                      >
                        返回
                      </TremorButton>
                      <TremorButton
                        onClick={handleBulkCreate}
                        disabled={parsedData.filter((d) => d.isValid).length === 0 || isProcessing}
                      >
                        {isProcessing ? "创建中..." : `创建 ${parsedData.filter((d) => d.isValid).length} 个用户`}
                      </TremorButton>
                    </div>
                  )}
                </div>

                {parsedData.some((user) => user.status === "success") && (
                  <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
                    <div className="flex items-start">
                      <div className="mr-3 mt-1">
                        <CheckCircleIcon className="h-5 w-5 text-blue-500" />
                      </div>
                      <div>
                        <Text className="font-medium text-blue-800">用户创建完成</Text>
                        <Text className="block text-sm text-blue-700 mt-1">
                          <span className="font-medium">下一步：</span>
                          下载包含虚拟密钥和邀请链接的结果文件，用户可使用虚拟密钥通过 LiteLLM 发起 LLM 请求。
                        </Text>
                      </div>
                    </div>
                  </div>
                )}

                <Table
                  dataSource={parsedData}
                  columns={columns}
                  size="small"
                  pagination={{ pageSize: 5 }}
                  scroll={{ y: 300 }}
                  rowClassName={(record) => (!record.isValid ? "bg-red-50" : "")}
                />

                {!parsedData.some((user) => user.status === "success" || user.status === "failed") && (
                  <div className="flex justify-end mt-4">
                    <TremorButton
                      onClick={() => {
                        setParsedData([]);
                        setParseError(null);
                      }}
                      variant="secondary"
                      className="mr-3"
                    >
                      返回
                    </TremorButton>
                    <TremorButton
                      onClick={handleBulkCreate}
                      disabled={parsedData.filter((d) => d.isValid).length === 0 || isProcessing}
                    >
                      {isProcessing ? "创建中..." : `创建 ${parsedData.filter((d) => d.isValid).length} 个用户`}
                    </TremorButton>
                  </div>
                )}

                {parsedData.some((user) => user.status === "success" || user.status === "failed") && (
                  <div className="flex justify-end mt-4">
                    <TremorButton
                      onClick={() => {
                        setParsedData([]);
                        setParseError(null);
                      }}
                      variant="secondary"
                      className="mr-3"
                    >
                      重新开始批量导入
                    </TremorButton>
                    <TremorButton onClick={downloadResults} variant="primary" className="flex items-center">
                      <DownloadOutlined className="mr-2" /> 下载用户凭证结果
                    </TremorButton>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
};

export default BulkCreateUsersButton;
