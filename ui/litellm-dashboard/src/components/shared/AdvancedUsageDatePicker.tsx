import React, { useState, useCallback, useEffect } from "react";
import { DatePicker, Select, Space, Typography } from "antd";
import zhCNPickerLocale from "antd/es/date-picker/locale/zh_CN";
import enUSPickerLocale from "antd/es/date-picker/locale/en_US";
import type { Dayjs } from "dayjs";
import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear";
import "dayjs/locale/zh-cn";
import { useLanguage } from "@/contexts/LanguageContext";

const { Text } = Typography;
const { RangePicker } = DatePicker;
dayjs.extend(weekOfYear);

export type TimeRangeType = "day" | "week" | "month";

export interface DateRangeValue {
  from?: Date;
  to?: Date;
}

export interface AdvancedUsageDatePickerProps {
  value: DateRangeValue;
  onValueChange: (value: DateRangeValue, type: TimeRangeType) => void;
  className?: string;
}

const getWeekRange = (date: Dayjs): DateRangeValue => {
  return {
    from: date.startOf("week").startOf("day").toDate(),
    to: date.endOf("week").endOf("day").toDate(),
  };
};

const getMonthRange = (date: Dayjs): DateRangeValue => {
  return {
    from: date.startOf("month").startOf("day").toDate(),
    to: date.endOf("month").endOf("day").toDate(),
  };
};

const AdvancedUsageDatePicker: React.FC<AdvancedUsageDatePickerProps> = ({ value, onValueChange, className }) => {
  const { t, locale } = useLanguage();
  const [rangeType, setRangeType] = useState<TimeRangeType>("week");
  const pickerLocale = locale === "zh-CN" ? zhCNPickerLocale : enUSPickerLocale;

  useEffect(() => {
    dayjs.locale(locale === "zh-CN" ? "zh-cn" : "en");
  }, [locale]);

  useEffect(() => {
    // Default to current week on first load
    onValueChange(getWeekRange(dayjs()), "week");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleRangeTypeChange = useCallback(
    (newType: TimeRangeType) => {
      setRangeType(newType);
      const anchorDate = dayjs(value.to || value.from || new Date());
      if (newType === "week") {
        onValueChange(getWeekRange(anchorDate), "week");
      } else if (newType === "month") {
        onValueChange(getMonthRange(anchorDate), "month");
      }
    },
    [onValueChange, value.from, value.to],
  );

  const handleDayRangeChange = useCallback(
    (dates: [Dayjs | null, Dayjs | null] | null) => {
      if (!dates || !dates[0] || !dates[1]) return;
      onValueChange(
        {
          from: dates[0].startOf("day").toDate(),
          to: dates[1].endOf("day").toDate(),
        },
        "day",
      );
    },
    [onValueChange],
  );

  const handleWeekChange = useCallback(
    (date: Dayjs | null) => {
      if (!date) return;
      onValueChange(getWeekRange(date), "week");
    },
    [onValueChange],
  );

  const handleMonthChange = useCallback(
    (date: Dayjs | null) => {
      if (!date) return;
      onValueChange(getMonthRange(date), "month");
    },
    [onValueChange],
  );

  return (
    <div className={className}>
      <Space
        size={8}
        wrap
        className="rounded-xl border border-gray-200 bg-white px-3 py-2 shadow-sm"
      >
        <Text type="secondary" className="whitespace-nowrap text-xs">
          {t("usagePage.datePicker.type")}
        </Text>

        <Select<TimeRangeType>
          value={rangeType}
          onChange={handleRangeTypeChange}
          style={{ width: 120 }}
          options={[
            { label: t("usagePage.datePicker.day"), value: "day" },
            { label: t("usagePage.datePicker.week"), value: "week" },
            { label: t("usagePage.datePicker.month"), value: "month" },
          ]}
        />

        {rangeType === "day" && (
          <RangePicker
            locale={pickerLocale}
            value={[value.from ? dayjs(value.from) : null, value.to ? dayjs(value.to) : null]}
            onChange={handleDayRangeChange}
            allowClear={false}
            inputReadOnly
            placeholder={[t("usagePage.datePicker.placeholder.day"), t("usagePage.datePicker.placeholder.day")]}
          />
        )}

        {rangeType === "week" && (
          <DatePicker
            locale={pickerLocale}
            picker="week"
            value={value.from ? dayjs(value.from) : null}
            onChange={handleWeekChange}
            allowClear={false}
            inputReadOnly
            format={(date) => `${date.year()}年${date.week()}周`}
            placeholder={t("usagePage.datePicker.placeholder.week")}
          />
        )}

        {rangeType === "month" && (
          <DatePicker
            locale={pickerLocale}
            picker="month"
            value={value.from ? dayjs(value.from) : null}
            onChange={handleMonthChange}
            allowClear={false}
            inputReadOnly
            format={locale === "zh-CN" ? "YYYY年M月" : "YYYY-MM"}
            placeholder={t("usagePage.datePicker.placeholder.month")}
          />
        )}
      </Space>
    </div>
  );
};

export default AdvancedUsageDatePicker;
