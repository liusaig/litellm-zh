const DEFAULT_HIDDEN_SIDEBAR_PAGES = ["api_ref", "model-hub-table", "experimental", "access-groups", "budgets"];
const DEFAULT_HIDDEN_SIDEBAR_GROUPS = ["开发者工具"];

const normalize = (value: string): string => value.trim().toLowerCase();

const parseCsvEnv = (value: string | undefined): string[] => {
  if (!value) {
    return [];
  }

  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
};

const hiddenPages = new Set<string>([
  ...DEFAULT_HIDDEN_SIDEBAR_PAGES.map(normalize),
  ...parseCsvEnv(process.env.NEXT_PUBLIC_HIDDEN_SIDEBAR_PAGES).map(normalize),
]);

const hiddenGroups = new Set<string>([
  ...DEFAULT_HIDDEN_SIDEBAR_GROUPS.map(normalize),
  ...parseCsvEnv(process.env.NEXT_PUBLIC_HIDDEN_SIDEBAR_GROUPS).map(normalize),
]);

export const shouldHideSidebarPage = (page: string): boolean => hiddenPages.has(normalize(page));

export const shouldHideSidebarGroupLabel = (groupLabel: string): boolean =>
  hiddenGroups.has(normalize(groupLabel));

