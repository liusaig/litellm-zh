import fs from "fs";
import path from "path";
import { describe, expect, it } from "vitest";
import { buildTranslationsForLocale } from "@/i18n/translations";

type KeyUsage = {
  filePath: string;
  key: string;
  line: number;
};

const repoRoot = path.resolve(__dirname, "..", "..");
const srcRoot = path.join(repoRoot, "src");

const targetPaths = [
  "app/(dashboard)/models-and-endpoints",
  "components/add_model",
  "components/model_add",
  "components/model_dashboard",
  "components/molecules/models",
  "components/model_info_view.tsx",
  "components/model_group_alias_settings.tsx",
  "components/add_pass_through.tsx",
  "components/pass_through_settings.tsx",
  "components/price_data_reload.tsx",
];

const keyPattern = /\b(?:t|tf)\(\s*["'`]([^"'`$]+)["'`]/g;

const isObject = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const getValueByPath = (obj: Record<string, unknown>, dotPath: string): unknown => {
  return dotPath.split(".").reduce<unknown>((acc, segment) => {
    if (isObject(acc) && segment in acc) {
      return acc[segment];
    }
    return undefined;
  }, obj);
};

const collectFiles = (absolutePath: string): string[] => {
  if (!fs.existsSync(absolutePath)) {
    return [];
  }

  const stat = fs.statSync(absolutePath);
  if (stat.isFile()) {
    return /\.(ts|tsx)$/.test(absolutePath) ? [absolutePath] : [];
  }

  return fs
    .readdirSync(absolutePath)
    .flatMap((entry) => collectFiles(path.join(absolutePath, entry)));
};

const extractKeyUsages = (absoluteFilePath: string): KeyUsage[] => {
  const content = fs.readFileSync(absoluteFilePath, "utf8");
  const usages: KeyUsage[] = [];

  for (const match of content.matchAll(keyPattern)) {
    const key = match[1]?.trim();
    if (!key) continue;

    const matchIndex = match.index ?? 0;
    const line = content.slice(0, matchIndex).split("\n").length;
    usages.push({
      filePath: absoluteFilePath,
      key,
      line,
    });
  }

  return usages;
};

describe("models i18n usage coverage", () => {
  it("should include every statically referenced models key in zh-CN merged translations", () => {
    const zhCN = buildTranslationsForLocale("zh-CN") as Record<string, unknown>;

    const files = targetPaths.flatMap((relativePath) => collectFiles(path.join(srcRoot, relativePath)));
    const allUsages = files.flatMap((filePath) => extractKeyUsages(filePath));

    const modelUsages = allUsages.filter(
      ({ key }) => key.startsWith("models.") || key.startsWith("modelInfo."),
    );

    const missing = modelUsages.filter(({ key }) => typeof getValueByPath(zhCN, key) !== "string");

    expect(missing).toEqual([]);
  });
});
