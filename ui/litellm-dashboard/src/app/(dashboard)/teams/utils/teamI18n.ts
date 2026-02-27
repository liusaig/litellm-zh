const TEAM_ZH_FALLBACK: Record<string, string> = {
  "teams.create": "+ 创建新分组",
  "teams.tabs.myTeams": "我的分组",
  "teams.tabs.defaultSettings": "默认分组设置",
  "teams.lastRefreshed": "最近刷新：",
  "teams.clickToView": "点击 \"分组 ID\" 查看分组详情并管理团队成员。",
  "teams.filters.searchPlaceholder": "按分组名称搜索...",
  "teams.filters.filter": "筛选",
  "teams.filters.reset": "重置筛选",
  "teams.filters.teamIdPlaceholder": "输入分组 ID",
  "teams.filters.selectOrganization": "选择组织",
  "teams.table.teamName": "分组名称",
  "teams.table.teamId": "分组 ID",
  "teams.table.createdAt": "创建时间",
  "teams.table.spend": "花费",
  "teams.table.budget": "预算",
  "teams.table.models": "模型",
  "teams.table.organization": "组织",
  "teams.table.yourRole": "角色",
  "teams.table.info": "信息",
  "teams.table.none": "无",
  "teams.table.unlimited": "不限制",
  "teams.table.keys": "个密钥",
  "teams.table.members": "个成员",
  "teams.table.moreModels": "个更多模型",
  "teams.allProxyModels": "所有代理模型",
  "teams.roleBadges.admin": "分组管理员",
  "teams.roleBadges.member": "成员",
};

export const teamT = (t: (key: string) => string, key: string): string => {
  const translated = t(key);
  if (translated === key) {
    return TEAM_ZH_FALLBACK[key] ?? key;
  }
  return translated;
};
