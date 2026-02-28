const ROLE_LABELS_ZH_CN: Record<string, string> = {
  proxy_admin: "管理员（全部权限）",
  proxy_admin_viewer: "管理员（仅查看）",
  internal_user: "内部用户（可创建/删除/查看）",
  internal_user_viewer: "内部用户（仅查看）",
};

const ROLE_LABELS_BY_ENGLISH_TEXT: Record<string, string> = {
  "Admin (All Permissions)": "管理员（全部权限）",
  "Admin (View Only)": "管理员（仅查看）",
  "Internal User (Create/Delete/View)": "内部用户（可创建/删除/查看）",
  "Internal User (View Only)": "内部用户（仅查看）",
};

export const localizePossibleUIRoles = (
  possibleUIRoles: Record<string, Record<string, string>> | null | undefined,
): Record<string, Record<string, string>> | null => {
  if (!possibleUIRoles) return null;

  const localizedRoles: Record<string, Record<string, string>> = {};

  for (const [roleKey, roleValue] of Object.entries(possibleUIRoles)) {
    const localizedLabel =
      ROLE_LABELS_ZH_CN[roleKey] ||
      (roleValue.ui_label ? ROLE_LABELS_BY_ENGLISH_TEXT[roleValue.ui_label] : undefined) ||
      roleValue.ui_label ||
      roleKey;

    localizedRoles[roleKey] = {
      ...roleValue,
      ui_label: localizedLabel,
    };
  }

  return localizedRoles;
};
