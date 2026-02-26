"use client";

import { useLogin } from "@/app/(dashboard)/hooks/login/useLogin";
import { useUIConfig } from "@/app/(dashboard)/hooks/uiConfig/useUIConfig";
import LoadingScreen from "@/components/common_components/LoadingScreen";
import { getProxyBaseUrl } from "@/components/networking";
import { getCookie } from "@/utils/cookieUtils";
import { isJwtExpired } from "@/utils/jwtUtils";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Alert, Button, Card, Form, Input, Popover, Space, Typography } from "antd";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

function LoginPageContent() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const { data: uiConfig, isLoading: isConfigLoading } = useUIConfig();
  const loginMutation = useLogin();
  const router = useRouter();

  useEffect(() => {
    if (isConfigLoading) {
      return;
    }

    // Check if admin UI is disabled
    if (uiConfig && uiConfig.admin_ui_disabled) {
      setIsLoading(false);
      return;
    }

    const rawToken = getCookie("token");
    if (rawToken && !isJwtExpired(rawToken)) {
      router.replace(`${getProxyBaseUrl()}/ui`);
      return;
    }

    if (uiConfig && uiConfig.auto_redirect_to_sso) {
      router.push(`${getProxyBaseUrl()}/sso/key/generate`);
      return;
    }

    setIsLoading(false);
  }, [isConfigLoading, router, uiConfig]);

  const handleSubmit = () => {
    loginMutation.mutate(
      { username, password },
      {
        onSuccess: (data) => {
          router.push(data.redirect_url);
        },
      },
    );
  };

  const error = loginMutation.error instanceof Error ? loginMutation.error.message : null;
  const isLoginLoading = loginMutation.isPending;

  const { Title, Text, Paragraph } = Typography;

  if (isConfigLoading || isLoading) {
    return <LoadingScreen />;
  }

  // Show disabled message if admin UI is disabled
  if (uiConfig && uiConfig.admin_ui_disabled) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-lg shadow-md">
          <Space direction="vertical" size="middle" className="w-full">
            <Alert
              message="管理后台已禁用"
              description={
                <>
                  <Paragraph className="text-sm">
                    管理员已禁用管理后台。若需重新启用，请更新以下环境变量：
                  </Paragraph>
                  <Paragraph className="text-sm">
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-xs">DISABLE_ADMIN_UI=False</code>
                  </Paragraph>
                </>
              }
              type="warning"
              showIcon
            />
          </Space>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-lg shadow-md">
        <Space direction="vertical" size="middle" className="w-full">
          <div className="text-center">
            <Title level={3}>登录</Title>
            <Text type="secondary">访问网关管理后台。</Text>
          </div>

          {error && <Alert message={error} type="error" showIcon />}

          <Form onFinish={handleSubmit} layout="vertical" requiredMark={true}>
            <Form.Item
              label="用户名"
              name="username"
              rules={[{ required: true, message: "请输入用户名" }]}
            >
              <Input
                placeholder="请输入用户名"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                disabled={isLoginLoading}
                size="large"
                className="rounded-md border-gray-300"
              />
            </Form.Item>

            <Form.Item
              label="密码"
              name="password"
              rules={[{ required: true, message: "请输入密码" }]}
            >
              <Input.Password
                placeholder="请输入密码"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoginLoading}
                size="large"
              />
            </Form.Item>

            <Form.Item>
              <Button
                type="primary"
                htmlType="submit"
                loading={isLoginLoading}
                disabled={isLoginLoading}
                block
                size="large"
              >
                {isLoginLoading ? "登录中..." : "登录"}
              </Button>
            </Form.Item>
            <Form.Item>
              {!uiConfig?.sso_configured ? (
                <Popover
                  content="请先配置 SSO 后再使用 SSO 登录。"
                  trigger="hover"
                >
                  <Button disabled block size="large">
                    使用 SSO 登录
                  </Button>
                </Popover>
              ) : (
                <Button
                  disabled={isLoginLoading}
                  onClick={() =>
                    router.push(`${getProxyBaseUrl()}/sso/key/generate`)
                  }
                  block
                  size="large"
                >
                  使用 SSO 登录
                </Button>
              )}
            </Form.Item>
          </Form>
        </Space>
        {uiConfig?.sso_configured && (
          <Alert
            type="info"
            showIcon
            closable
            message={
              <Text>
                已启用单点登录（SSO）。Silinex 现在在加载此页面时不再自动跳转到 SSO 登录流程。若要恢复自动跳转，请在环境配置中设置
                <Text code>AUTO_REDIRECT_UI_LOGIN_TO_SSO=true</Text>。
              </Text>
            }
          />
        )}
      </Card>
    </div>
  );
}

export default function LoginPage() {
  const queryClient = new QueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <LoginPageContent />
    </QueryClientProvider>
  );
}
