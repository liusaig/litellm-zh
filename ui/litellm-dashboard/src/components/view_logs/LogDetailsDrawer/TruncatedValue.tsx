import { Typography, Tooltip } from "antd";
import { DEFAULT_MAX_WIDTH, FONT_FAMILY_MONO, FONT_SIZE_SMALL } from "./constants";
import { useLanguage } from "@/contexts/LanguageContext";

const { Text } = Typography;

interface TruncatedValueProps {
  value?: string;
  maxWidth?: number;
}

/**
 * Displays a truncated value with tooltip and copy functionality.
 * Useful for displaying long IDs, URLs, or other text that may overflow.
 */
export function TruncatedValue({ value, maxWidth = DEFAULT_MAX_WIDTH }: TruncatedValueProps) {
  const { t } = useLanguage();
  if (!value) return <Text type="secondary">-</Text>;

  return (
    <Tooltip title={value}>
      <Text
        copyable={{ text: value, tooltips: [t("logs.details.copy"), t("logs.details.copied")] }}
        style={{
          maxWidth,
          display: "inline-block",
          verticalAlign: "bottom",
          fontFamily: FONT_FAMILY_MONO,
          fontSize: FONT_SIZE_SMALL,
        }}
        ellipsis
      >
        {value}
      </Text>
    </Tooltip>
  );
}
