export const DEFAULT_BRAND_LOGO_URL = "/ui/assets/logos/litellm.svg";
export const LEGACY_LOGO_ENDPOINT_PATH = "/get_image";

const LEGACY_DEFAULT_LOGO_URL_MARKERS = ["@lobehub/icons-static-png", "siliconcloud-color.png"];

export const isLegacyDefaultLogoUrl = (url: string | null | undefined): boolean => {
  if (!url) {
    return false;
  }

  return LEGACY_DEFAULT_LOGO_URL_MARKERS.some((marker) => url.includes(marker));
};

export const isSvgLogoUrl = (url: string | null | undefined): boolean => {
  if (!url) {
    return false;
  }

  const normalizedUrl = url.trim().toLowerCase();

  if (normalizedUrl.startsWith("data:image/svg+xml")) {
    return true;
  }

  return normalizedUrl.endsWith(".svg") || normalizedUrl.includes(".svg?");
};
