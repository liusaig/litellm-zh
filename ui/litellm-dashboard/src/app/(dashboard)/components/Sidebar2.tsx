"use client";

import { ConfigProvider, Layout, Menu, type MenuProps } from "antd";
import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { isAdminRole } from "@/utils/roles";
import UsageIndicator from "@/components/UsageIndicator";
import { serverRootPath } from "@/components/networking";
import { menuGroups } from "@/components/leftnav";
import { shouldHideSidebarGroupLabel, shouldHideSidebarPage } from "@/components/sidebar_visibility";

const { Sider } = Layout;

interface SidebarProps {
  accessToken: string | null;
  userRole: string;
  defaultSelectedKey: string;
  collapsed?: boolean;
}

interface SidebarMenuItem {
  key: string;
  page: string;
  label: string | React.ReactNode;
  roles?: string[];
  children?: SidebarMenuItem[];
  icon?: React.ReactNode;
  external_url?: string;
}

interface SidebarMenuGroup {
  groupLabel: string;
  items: SidebarMenuItem[];
  roles?: string[];
}

const getBasePath = () => {
  const raw = process.env.NEXT_PUBLIC_BASE_URL ?? "";
  const trimmed = raw.replace(/^\/+|\/+$/g, "");
  const uiPath = trimmed ? `/${trimmed}/` : "/";

  if (serverRootPath && serverRootPath !== "/") {
    const cleanServerRoot = serverRootPath.replace(/\/+$/, "");
    const cleanUiPath = uiPath.replace(/^\/+/, "");
    return `${cleanServerRoot}/${cleanUiPath}`;
  }

  return uiPath;
};

const routeFor = (slug: string): string => {
  switch (slug) {
    case "api-keys":
      return "virtual-keys";
    case "llm-playground":
      return "test-key";
    case "models":
      return "models-and-endpoints";
    case "agents":
      return "agents";
    case "new_usage":
      return "usage";
    case "teams":
      return "teams";
    case "organizations":
      return "organizations";
    case "users":
      return "users";
    case "access-groups":
      return "access-groups";
    case "api_ref":
      return "api-reference";
    case "model-hub-table":
      return "model-hub";
    case "logs":
      return "logs";
    case "guardrails":
      return "guardrails";
    case "guardrails-monitor":
      return "guardrails-monitor";
    case "policies":
      return "policies";
    case "mcp-servers":
      return "tools/mcp-servers";
    case "search-tools":
      return "tools/search-tools";
    case "vector-stores":
      return "tools/vector-stores";
    case "tool-policies":
      return "tools/tool-policies";
    case "caching":
      return "experimental/caching";
    case "prompts":
      return "experimental/prompts";
    case "budgets":
      return "experimental/budgets";
    case "transform-request":
      return "experimental/api-playground";
    case "tag-management":
      return "experimental/tag-management";
    case "claude-code-plugins":
      return "experimental/claude-code-plugins";
    case "usage":
      return "experimental/old-usage";
    case "router-settings":
      return "settings/router-settings";
    case "logging-and-alerts":
      return "settings/logging-and-alerts";
    case "admin-panel":
      return "settings/admin-settings";
    case "cost-tracking":
      return "settings/cost-tracking";
    case "ui-theme":
      return "settings/ui-theme";
    default:
      return slug.replace(/^\/+/, "");
  }
};

const toHref = (slugOrPath: string) => {
  const base = getBasePath();
  const rel = routeFor(slugOrPath).replace(/^\/+|\/+$/g, "");
  return `${base}${rel}`;
};

const Sidebar2: React.FC<SidebarProps> = ({ accessToken, userRole, defaultSelectedKey, collapsed = false }) => {
  const router = useRouter();
  const pathname = usePathname() || "/";

  const visibleGroups = React.useMemo<SidebarMenuGroup[]>(() => {
    const role = userRole;

    const filterItemsByRole = (items: SidebarMenuItem[]): SidebarMenuItem[] => {
      return items
        .filter((item) => !shouldHideSidebarPage(item.page))
        .map((item) => ({
          ...item,
          children: item.children ? filterItemsByRole(item.children) : undefined,
        }))
        .filter((item) => !item.roles || item.roles.includes(role));
    };

    return (menuGroups as SidebarMenuGroup[])
      .filter((group) => !shouldHideSidebarGroupLabel(group.groupLabel))
      .filter((group) => !group.roles || group.roles.includes(role))
      .map((group) => ({
        ...group,
        items: filterItemsByRole(group.items),
      }))
      .filter((group) => group.items.length > 0);
  }, [userRole]);

  const selectedMenuKey = React.useMemo(() => {
    const base = getBasePath();
    const rel = pathname.startsWith(base) ? pathname.slice(base.length) : pathname.replace(/^\/+/, "");
    const relLower = rel.toLowerCase();

    const matchesPath = (slug: string) => {
      const route = routeFor(slug).toLowerCase();
      return relLower === route || relLower.startsWith(`${route}/`);
    };

    for (const group of visibleGroups) {
      for (const item of group.items) {
        if (!item.children && matchesPath(item.page)) return item.key;
        if (item.children) {
          for (const child of item.children) {
            if (matchesPath(child.page)) return child.key;
          }
        }
      }
    }

    for (const group of visibleGroups) {
      for (const item of group.items) {
        if (item.page === defaultSelectedKey) return item.key;
        const child = item.children?.find((c) => c.page === defaultSelectedKey);
        if (child) return child.key;
      }
    }

    return "api-keys";
  }, [pathname, visibleGroups, defaultSelectedKey]);

  const goTo = (item: SidebarMenuItem) => {
    if (item.external_url) {
      window.open(item.external_url, "_blank");
      return;
    }
    router.push(toHref(item.page));
  };

  const menuItems = React.useMemo<MenuProps["items"]>(() => {
    return visibleGroups.map((group) => ({
      type: "group",
      label: collapsed ? null : (
        <span
          style={{
            fontSize: "10px",
            fontWeight: 600,
            color: "#6b7280",
            letterSpacing: "0.05em",
            padding: "12px 0 4px 12px",
            display: "block",
            marginBottom: "2px",
          }}
        >
          {group.groupLabel}
        </span>
      ),
      children: group.items.map((item) => ({
        key: item.key,
        icon: item.icon,
        label: item.label,
        children: item.children?.map((child) => ({
          key: child.key,
          icon: child.icon,
          label: child.label,
          onClick: () => goTo(child),
        })),
        onClick: !item.children ? () => goTo(item) : undefined,
      })),
    }));
  }, [visibleGroups, collapsed]);

  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Sider
        theme="light"
        width={220}
        collapsed={collapsed}
        collapsedWidth={80}
        collapsible
        trigger={null}
        style={{
          transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          position: "relative",
        }}
      >
        <ConfigProvider
          theme={{
            components: {
              Menu: {
                iconSize: 15,
                fontSize: 13,
                itemMarginInline: 4,
                itemPaddingInline: 8,
                itemHeight: 30,
                itemBorderRadius: 6,
                subMenuItemBorderRadius: 6,
                groupTitleFontSize: 10,
                groupTitleLineHeight: 1.5,
              },
            },
          }}
        >
          <Menu
            mode="inline"
            selectedKeys={[selectedMenuKey]}
            inlineCollapsed={collapsed}
            className="custom-sidebar-menu"
            style={{
              borderRight: 0,
              backgroundColor: "transparent",
              fontSize: "13px",
              paddingTop: "4px",
            }}
            items={menuItems}
          />
        </ConfigProvider>
        {isAdminRole(userRole) && !collapsed && <UsageIndicator accessToken={accessToken} width={220} />}
      </Sider>
    </Layout>
  );
};

export default Sidebar2;
