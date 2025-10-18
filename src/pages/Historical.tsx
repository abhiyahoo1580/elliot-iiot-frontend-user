import { formatInTimeZone } from "date-fns-tz";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { writeFile, utils } from "xlsx-js-style"; // Use styling-capable Excel generator
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "react-datepicker/dist/react-datepicker.css";
import { VariableSizeGrid as Grid } from "react-window";
import CustomSpinner from "../components/CustomSpinner";
import { formatDate } from "../utils/dateUtils";
import { useFullUser } from "../hooks/useFullUser";
import { useParamData } from "../hooks/useParamData";
import { useParamLine } from "../hooks/useParamLine";
import type { GraphGroup, GraphSeries } from "../hooks/useParamLine";
import { useUserAsset } from "../hooks/useUserAsset";
import { Asset, ParamDataItem } from "../types/user.types";
import { set } from "lodash";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useLocation } from "react-router-dom";

function mean(arr: number[]) {
  if (!arr.length) return 0;
  return arr.reduce((a, b) => a + b, 0) / arr.length;
}
function max(arr: number[]) {
  return arr.length ? Math.max(...arr) : 0;
}
function min(arr: number[]) {
  return arr.length ? Math.min(...arr) : 0;
}

type DateRange = { start: string | null; end: string | null };
type WeekRange = { start: Date; end: Date } | null;
type MonthRange = { start: Date; end: Date } | null;
function useParentWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        if (newWidth > 0) setWidth(newWidth);
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);
  return { ref, width };
}
const getDescriptionColWidth = (parentWidth: number) =>
  Math.max(parentWidth * 0.18, 120);
const getDataGridWidth = (parentWidth: number) =>
  Math.max(parentWidth - getDescriptionColWidth(parentWidth) - 10, 300);
const getColumnWidth = (parentWidth: number, colCount: number) => {
  if (colCount > 0 && parentWidth > 0) {
    const remaining = parentWidth - getDescriptionColWidth(parentWidth);
    return Math.max(remaining / colCount, 100);
  }
  return 90;
};
export default function Historical() {
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("Today");
  const [selectedDate, setSelectedDate] = useState<string>(
    formatDate(new Date())
  );
  const formatDDMMYYYYString = (date: Date | string | null) => {
    if (!date) return "";
    const d = typeof date === "string" ? new Date(date) : date;
    const day = String(d.getDate()).padStart(2, "0");
    const monthName = d.toLocaleString("en-GB", { month: "short" });
    const year = d.getFullYear();
    return `${day} ${monthName} ${year}`;
  };
  const [deviceName, setDeviceName] = useState<string>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: null,
    end: null,
  });
  const [selectedWeek, setSelectedWeek] = useState<WeekRange>(null);
  const [selectedMonth, setSelectedMonth] = useState<MonthRange>(null);
  const [selectedView, setSelectedView] = useState<string>("Table");
  const { user } = useFullUser(localStorage.getItem("userId") ?? undefined);
  const { assets } = useUserAsset(localStorage.getItem("userId") ?? undefined);
  const [asset_id, setAssetId] = useState<string>("");
  const location = useLocation();
  const [todayFDate, setTodayFDate] = useState<string>("");
  const [todayTDate, setTodayTDate] = useState<string>("");
  const [todayDate, setTodayDate] = useState<string>("");
  const [weekFDate, setWeekFDate] = useState<string>("");
  const [weekTDate, setWeekTDate] = useState<string>("");
  const [weekDate, setWeekDate] = useState<string>("");
  const [monthFDate, setMonthFDate] = useState<string>("");
  const [monthTDate, setMonthTDate] = useState<string>("");
  const [monthDate, setMonthDate] = useState<string>("");
  const [customFDate, setCustomFDate] = useState<string>("");
  const [customTDate, setCustomTDate] = useState<string>("");
  const [customDate, setCustomDate] = useState<string>("");
  const { ref: containerRef, width: parentWidth } = useParentWidth();
  const [gridReady, setGridReady] = useState(false);
  const pickerTriggerRef = useRef<HTMLDivElement>(null);
  const datepickerRef = useRef<HTMLDivElement>(null);
  // Ref for the split-button dropdown in Historical page
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const today = new Date();
  useEffect(() => {
    if (parentWidth > 0) setGridReady(true);
  }, [parentWidth]);
  useEffect(() => {
    document.title = "Historical";
  }, []);
  useEffect(() => {
    const urlAssetId = new URLSearchParams(location.search).get("assetId");
    if (assets && assets.length > 0 && !urlAssetId && !asset_id) {
      const firstAsset = assets[0];
      setDeviceName(firstAsset.AssetName);
      setAssetId(firstAsset.AssetId || "");
    }
  }, [assets, location.search, asset_id]);
  function getTzOffsetString(tz: string) {
    try {
      return formatInTimeZone(new Date(), tz, "xxx");
    } catch {
      return "Z";
    }
  }
  const handlePickerTriggerClick = () => {
    if (selectedTimeRange === "Custom") {
      setShowDatePicker(!showDatePicker);
    }
  };
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        (datepickerRef.current &&
          datepickerRef.current.contains(event.target as Node)) ||
        (pickerTriggerRef.current &&
          pickerTriggerRef.current.contains(event.target as Node))
      )
        return;
      setShowDatePicker(false);
    };
    if (showDatePicker) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDatePicker]);

  // Close the dropdown when clicking outside or pressing Escape
  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      if (
        dropdownRef.current &&
        target &&
        !dropdownRef.current.contains(target)
      ) {
        setShowDropdown(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setShowDropdown(false);
    }
    document.addEventListener("mousedown", handleOutside);
    document.addEventListener("touchstart", handleOutside);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handleOutside);
      document.removeEventListener("touchstart", handleOutside);
      document.removeEventListener("keydown", handleKey);
    };
  }, []);
  const minDate = new Date(today);
  minDate.setMonth(minDate.getMonth() - 2);
  function getMsInTimeZone(
    date: Date,
    hour: number,
    min: number,
    sec: number,
    ms: number,
    tz: string
  ) {
    const dateStr = formatInTimeZone(date, tz, "yyyy-MM-dd");
    const localDateTime = `${dateStr}T${String(hour).padStart(2, "0")}:${String(
      min
    ).padStart(2, "0")}:${String(sec).padStart(2, "0")}.${String(ms).padStart(
      3,
      "0"
    )}`;
    const offset = formatInTimeZone(date, tz, "xxx");
    const dateTimeWithOffset = `${localDateTime}${offset}`;
    return new Date(dateTimeWithOffset).getTime();
  }
  function getCurrentWeek(tz: string) {
    const now = new Date();
    const dayOfWeek = Number(formatInTimeZone(now, tz, "i")) % 7;
    const todayStr = formatInTimeZone(now, tz, "yyyy-MM-dd");
    const todayMidnight = new Date(
      `${todayStr}T00:00:00${formatInTimeZone(now, tz, "xxx")}`
    );
    const firstDay = new Date(
      todayMidnight.getTime() - dayOfWeek * 24 * 60 * 60 * 1000
    );
    const lastDay = new Date(firstDay.getTime() + 6 * 24 * 60 * 60 * 1000);
    return { start: firstDay, end: lastDay };
  }
  function getCurrentMonth(tz: string) {
    const now = new Date();
    const year = Number(formatInTimeZone(now, tz, "yyyy"));
    const month = Number(formatInTimeZone(now, tz, "MM"));
    const firstDayStr = `${year}-${String(month).padStart(2, "0")}-01`;
    const firstDay = new Date(
      `${firstDayStr}T00:00:00${formatInTimeZone(now, tz, "xxx")}`
    );
    const nextMonth = month === 12 ? 1 : month + 1;
    const nextMonthYear = month === 12 ? year + 1 : year;
    const nextMonthStr = `${nextMonthYear}-${String(nextMonth).padStart(
      2,
      "0"
    )}-01`;
    const firstOfNextMonth = new Date(
      `${nextMonthStr}T00:00:00${formatInTimeZone(now, tz, "xxx")}`
    );
    const lastDay = new Date(firstOfNextMonth.getTime() - 1);
    return { start: firstDay, end: lastDay };
  }

  useEffect(() => {
    if (!assets || assets.length === 0) return;
    const selectedAsset =
      assets.find((a) => a.AssetId === asset_id) || assets[0];
    const deviceTimeZone = selectedAsset?.timeZone || "UTC";
    if (selectedTimeRange === "Today") {
      const now = new Date();
      const fDate = getMsInTimeZone(now, 0, 0, 0, 0, deviceTimeZone);
      const tDate = getMsInTimeZone(now, 23, 59, 59, 999, deviceTimeZone);
      setSelectedDate(formatDate(new Date(fDate)));
      setDateRange({
        start: new Date(fDate).toISOString(),
        end: new Date(tDate).toISOString(),
      });
      setCustomFDate("");
      setCustomTDate("");
      setCustomDate("");
    } else if (selectedTimeRange === "This week") {
      const currentWeek = getCurrentWeek(deviceTimeZone);
      setSelectedWeek(currentWeek);
      setSelectedDate(
        `${formatDate(currentWeek.start)} - ${formatDate(currentWeek.end)}`
      );
      const fDate = getMsInTimeZone(
        currentWeek.start,
        0,
        0,
        0,
        0,
        deviceTimeZone
      );
      const tDate = getMsInTimeZone(
        currentWeek.end,
        23,
        59,
        59,
        999,
        deviceTimeZone
      );
      setDateRange({
        start: new Date(fDate).toISOString(),
        end: new Date(tDate).toISOString(),
      });
      setCustomFDate("");
      setCustomTDate("");
      setCustomDate("");
    } else if (selectedTimeRange === "This month") {
      const currentMonth = getCurrentMonth(deviceTimeZone);
      setSelectedMonth(currentMonth);
      setSelectedDate(
        `${formatDate(currentMonth.start)} - ${formatDate(currentMonth.end)}`
      );
      const fDate = getMsInTimeZone(
        currentMonth.start,
        0,
        0,
        0,
        0,
        deviceTimeZone
      );
      const tDate = getMsInTimeZone(
        currentMonth.end,
        23,
        59,
        59,
        999,
        deviceTimeZone
      );
      setDateRange({
        start: new Date(fDate).toISOString(),
        end: new Date(tDate).toISOString(),
      });
      setCustomFDate("");
      setCustomTDate("");
      setCustomDate("");
    } else if (selectedTimeRange === "Custom") {
      setDateRange({ start: null, end: null });
      setSelectedDate("Select a date range");
      setCustomFDate("");
      setCustomTDate("");
      setCustomDate("");
    }
  }, [selectedTimeRange, asset_id, assets]);
  useEffect(() => {
    if (!asset_id || !assets || assets.length === 0) return;
    const selectedAsset =
      assets.find((a) => a.AssetId === asset_id) || assets[0];
    const deviceTimeZone = selectedAsset?.timeZone || "UTC";
    if (selectedTimeRange === "Today") {
      const now = new Date();
      const fDate = getMsInTimeZone(now, 0, 0, 0, 0, deviceTimeZone);
      const tDate = getMsInTimeZone(now, 23, 59, 59, 999, deviceTimeZone);
      setTodayFDate(fDate.toString());
      setTodayTDate(tDate.toString());
      setTodayDate(fDate.toString());
    } else if (selectedTimeRange === "This week" && selectedWeek) {
      const startStr = formatInTimeZone(
        selectedWeek.start,
        deviceTimeZone,
        "yyyy-MM-dd"
      );
      const endStr = formatInTimeZone(
        selectedWeek.end,
        deviceTimeZone,
        "yyyy-MM-dd"
      );
      const startOfWeek = new Date(
        `${startStr}T00:00:00.000${getTzOffsetString(deviceTimeZone)}`
      );
      const endOfWeek = new Date(
        `${endStr}T23:59:59.999${getTzOffsetString(deviceTimeZone)}`
      );
      setWeekFDate(startOfWeek.getTime().toString());
      setWeekTDate(endOfWeek.getTime().toString());
      setWeekDate(startOfWeek.getTime().toString());
    } else if (selectedTimeRange === "This month" && selectedMonth) {
      const startStr = formatInTimeZone(
        selectedMonth.start,
        deviceTimeZone,
        "yyyy-MM-dd"
      );
      const endStr = formatInTimeZone(
        selectedMonth.end,
        deviceTimeZone,
        "yyyy-MM-dd"
      );
      const startOfMonth = new Date(
        `${startStr}T00:00:00.000${getTzOffsetString(deviceTimeZone)}`
      );
      const endOfMonth = new Date(
        `${endStr}T23:59:59.999${getTzOffsetString(deviceTimeZone)}`
      );
      setMonthFDate(startOfMonth.getTime().toString());
      setMonthTDate(endOfMonth.getTime().toString());
      setMonthDate(startOfMonth.getTime().toString());
    } else if (
      selectedTimeRange === "Custom" &&
      dateRange.start &&
      dateRange.end
    ) {
      const start = new Date(dateRange.start);
      const end = new Date(dateRange.end);
      const startStr = formatInTimeZone(start, deviceTimeZone, "yyyy-MM-dd");
      const endStr = formatInTimeZone(end, deviceTimeZone, "yyyy-MM-dd");
      const startOfCustom = new Date(
        `${startStr}T00:00:00.000${getTzOffsetString(deviceTimeZone)}`
      );
      const endOfCustom = new Date(
        `${endStr}T23:59:59.999${getTzOffsetString(deviceTimeZone)}`
      );
      setCustomFDate(startOfCustom.getTime().toString());
      setCustomTDate(endOfCustom.getTime().toString());
      setCustomDate(startOfCustom.getTime().toString());
    }
  }, [
    selectedTimeRange,
    asset_id,
    assets,
    selectedWeek,
    selectedMonth,
    dateRange,
  ]);
  const {
    data: todayParamData,
    loading: todayParamLoading,
    error: todayParamError,
  } = useParamData(
    selectedTimeRange === "Today" && todayFDate && todayTDate && todayDate
      ? asset_id
      : "",
    selectedTimeRange === "Today" ? todayFDate : "",
    selectedTimeRange === "Today" ? todayTDate : "",
    selectedTimeRange === "Today" ? todayDate : ""
  );
  const {
    data: weekParamData,
    loading: weekParamLoading,
    error: weekParamError,
  } = useParamData(
    selectedTimeRange === "This week" && weekFDate && weekTDate && weekDate
      ? asset_id
      : "",
    selectedTimeRange === "This week" ? weekFDate : "",
    selectedTimeRange === "This week" ? weekTDate : "",
    selectedTimeRange === "This week" ? weekDate : ""
  );
  const {
    data: monthParamData,
    loading: monthParamLoading,
    error: monthParamError,
  } = useParamData(
    selectedTimeRange === "This month" && monthFDate && monthTDate && monthDate
      ? asset_id
      : "",
    selectedTimeRange === "This month" ? monthFDate : "",
    selectedTimeRange === "This month" ? monthTDate : "",
    selectedTimeRange === "This month" ? monthDate : ""
  );
  const {
    data: customParamData,
    loading: customParamLoading,
    error: customParamError,
  } = useParamData(
    selectedTimeRange === "Custom" && customFDate && customTDate && customDate
      ? asset_id
      : "",
    selectedTimeRange === "Custom" ? customFDate : "",
    selectedTimeRange === "Custom" ? customTDate : "",
    selectedTimeRange === "Custom" ? customDate : ""
  );
  // Only load line/chart data when user selects the Line Chart view
  const shouldLoadLine = selectedView === "Line Chart";
  const {
    data: lineDataToday,
    loading: lineLoadingToday,
    error: lineErrorToday,
  } = useParamLine(
    shouldLoadLine && selectedTimeRange === "Today" ? asset_id : "",
    shouldLoadLine && selectedTimeRange === "Today" ? todayFDate : "",
    shouldLoadLine && selectedTimeRange === "Today" ? todayTDate : "",
    shouldLoadLine && selectedTimeRange === "Today" ? todayDate : ""
  );
  const {
    data: lineDataWeek,
    loading: lineLoadingWeek,
    error: lineErrorWeek,
  } = useParamLine(
    shouldLoadLine && selectedTimeRange === "This week" ? asset_id : "",
    shouldLoadLine && selectedTimeRange === "This week" ? weekFDate : "",
    shouldLoadLine && selectedTimeRange === "This week" ? weekTDate : "",
    shouldLoadLine && selectedTimeRange === "This week" ? weekDate : ""
  );
  const {
    data: lineDataMonth,
    loading: lineLoadingMonth,
    error: lineErrorMonth,
  } = useParamLine(
    shouldLoadLine && selectedTimeRange === "This month" ? asset_id : "",
    shouldLoadLine && selectedTimeRange === "This month" ? monthFDate : "",
    shouldLoadLine && selectedTimeRange === "This month" ? monthTDate : "",
    shouldLoadLine && selectedTimeRange === "This month" ? monthDate : ""
  );
  const {
    data: lineDataCustom,
    loading: lineLoadingCustom,
    error: lineErrorCustom,
  } = useParamLine(
    shouldLoadLine && selectedTimeRange === "Custom" ? asset_id : "",
    shouldLoadLine && selectedTimeRange === "Custom" ? customFDate : "",
    shouldLoadLine && selectedTimeRange === "Custom" ? customTDate : "",
    shouldLoadLine && selectedTimeRange === "Custom" ? customDate : ""
  );
  type GroupedDay = { _id: number | string; data: ParamDataItem[] };
  type ParamDataResponseLocal = { data: GroupedDay[] };
  function getMaxColCount(sectionData: GroupedDay[]) {
    if (!Array.isArray(sectionData)) return 0;
    let max = 0;
    for (const group of sectionData) {
      if (Array.isArray(group.data) && group.data.length > 0) {
        const cols = Array.isArray(group.data[0]?.ValueReceivedDate)
          ? group.data[0].ValueReceivedDate.length
          : 0;
        if (cols > max) max = cols;
      }
    }
    return max;
  }
  const maxColCount =
    selectedView === "Table"
      ? selectedTimeRange === "Today"
        ? getMaxColCount(todayParamData?.data || [])
        : selectedTimeRange === "This week"
        ? getMaxColCount(weekParamData?.data || [])
        : selectedTimeRange === "This month"
        ? getMaxColCount(monthParamData?.data || [])
        : selectedTimeRange === "Custom"
        ? getMaxColCount(customParamData?.data || [])
        : 0
      : 0;
  function isGroupedData(data: unknown): data is GroupedDay[] {
    return (
      Array.isArray(data) &&
      data.length > 0 &&
      typeof data[0]._id !== "undefined" &&
      Array.isArray(data[0].data)
    );
  }
  // Disable download buttons until table data for the selected time-range is available
  const currentParamData =
    selectedTimeRange === "Today"
      ? todayParamData
      : selectedTimeRange === "This week"
      ? weekParamData
      : selectedTimeRange === "This month"
      ? monthParamData
      : selectedTimeRange === "Custom"
      ? customParamData
      : null;
  // Generate pivoted Excel data as per screenshot
  const preparePivotedExcelData = (): any[][] => {
    let currentTableData: { data?: GroupedDay[] } | null = null;
    if (selectedTimeRange === "Today") currentTableData = todayParamData;
    else if (selectedTimeRange === "This week")
      currentTableData = weekParamData;
    else if (selectedTimeRange === "This month")
      currentTableData = monthParamData;
    else if (selectedTimeRange === "Custom") currentTableData = customParamData;
    if (!currentTableData?.data || !isGroupedData(currentTableData.data))
      return [];
    const excelData: any[][] = [];
    // Collect unique parameter names across all days, preserving first appearance order
    const seen = new Set<string>();
    const paramNames: string[] = [];
    currentTableData.data.forEach((group) => {
      group.data.forEach((param) => {
        const name = Array.isArray(param.Name)
          ? param.Name[0]
          : param.Name || "";
        if (name && !seen.has(name)) {
          seen.add(name);
          paramNames.push(name);
        }
      });
    });
    const allParams = paramNames.filter(
      (n) => n !== "Battery" && n !== "Timestamp"
    );
    if (allParams.length === 0) return [];
    const headers = ["Date", "Timestamp", "Device", ...allParams];
    excelData.push(headers);
    currentTableData.data.forEach((group) => {
      const dateStr =
        group._id && !isNaN(Number(group._id))
          ? (() => {
              const d = new Date(Number(group._id));
              const day = String(d.getDate()).padStart(2, "0");
              const monthName = d.toLocaleString("en-GB", { month: "short" });
              const year = d.getFullYear();
              return `${day} ${monthName} ${year}`;
            })()
          : "Invalid Date";
      const paramList: ParamDataItem[] = Array.isArray(group.data)
        ? group.data
        : [];
      // Collect all unique timestamps for this day
      const allTimestamps = new Set<string>();
      paramList.forEach((param) => {
        (param.ValueReceivedDate || []).forEach((ts) => {
          allTimestamps.add(ts);
        });
      });
      const sortedTimestamps = Array.from(allTimestamps).sort();
      sortedTimestamps.forEach((ts) => {
        let timeStr = "";
        if (typeof ts === "string" && /^\d{2}:\d{2}:\d{2}$/.test(ts)) {
          timeStr = ts;
        } else if (!isNaN(Number(ts))) {
          const d = new Date(Number(ts));
          timeStr = !isNaN(d.getTime())
            ? d.toLocaleTimeString("en-GB", { hour12: false })
            : String(ts);
        } else {
          timeStr = String(ts);
        }
        const row: any[] = [dateStr, timeStr, deviceName || ""];
        allParams.forEach((p) => {
          const param = paramList.find(
            (par) =>
              (Array.isArray(par.Name) ? par.Name[0] : par.Name || "") === p
          );
          let value = "";
          if (param) {
            const idx = (param.ValueReceivedDate || []).findIndex(
              (t) => t === ts
            );
            if (idx !== -1) {
              value = param.ActValue[idx] || "";
            }
          }
          row.push(value);
        });
        excelData.push(row);
      });
    });
    return excelData;
  };
  const isDisabled = preparePivotedExcelData().length <= 1;
  // type CsvRow = { [key: string]: string | number | null | undefined };
  const getBaseFilename = () => {
    const safeDevice = (deviceName ?? "Device").replace(/[^a-zA-Z0-9]/g, "_");
    const now = new Date();
    const fmt = (d: Date) => formatDate(d);
    let filename = `${safeDevice}_historical-report_${fmt(now)}`;
    if (selectedTimeRange === "Today") {
      filename = `${safeDevice}_daily-report_${fmt(now)}`;
    } else if (selectedTimeRange === "This week" && selectedWeek) {
      filename = `${safeDevice}_weekly-report_${fmt(
        selectedWeek.start
      )}_to_${fmt(selectedWeek.end)}`;
    } else if (selectedTimeRange === "This month" && selectedMonth) {
      filename = `${safeDevice}_monthly-report_${fmt(
        selectedMonth.start
      )}_to_${fmt(selectedMonth.end)}`;
    } else if (
      selectedTimeRange === "Custom" &&
      dateRange.start &&
      dateRange.end
    ) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      filename = `${safeDevice}_custom-report_${fmt(startDate)}_to_${fmt(
        endDate
      )}`;
    }
    return filename;
  };
  const downloadCSV = (data: unknown[][], filename: string) => {
    const serializeCell = (cell: unknown) => {
      if (cell === null || typeof cell === "undefined") return "";
      const s = String(cell);
      // If it's a pure number, don't quote it (so Excel recognizes numeric types)
      if (!isNaN(Number(s)) && s.trim() !== "") return s;
      // Otherwise quote and escape
      if (
        s.includes(",") ||
        s.includes('"') ||
        s.includes("\n") ||
        s.includes("\r")
      ) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };
    const csvContent = data
      .map((row) => row.map((cell: unknown) => serializeCell(cell)).join(","))
      .join("\r\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", filename);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }
  };
  const handleDownloadXLSX = () => {
    const baseFilename = getBaseFilename();
    const filename = `${baseFilename}.xlsx`;
    const excelData = preparePivotedExcelData();
    if (excelData.length <= 1) {
      alert("No data available to download.");
      return;
    }
    const worksheet = utils.aoa_to_sheet(excelData);
    // Style header row (row 0) - bold, no background fill
    const range = utils.decode_range(worksheet["!ref"] as string);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const addr = utils.encode_cell({ r: 0, c: C });
      if (!worksheet[addr]) continue;
      worksheet[addr].s = worksheet[addr].s || {};
      worksheet[addr].s.font = { bold: true } as any;
    }
    // Force Date column (col 0) to plain text so the formula bar shows only the string (e.g., "15 Oct 2025")
    for (let R = range.s.r + 1; R <= range.e.r; ++R) {
      const addr = utils.encode_cell({ r: R, c: 0 });
      const cell = worksheet[addr];
      if (!cell || cell.v == null) continue;
      const c = cell as unknown as { t?: string; v?: unknown; z?: string };
      c.t = "s"; // string type
      c.v = String(cell.v);
      if (c.z) delete c.z; // remove any number format
    }
    // Set reasonable column widths
    worksheet["!cols"] = Array(excelData[0].length).fill({ wch: 20 });
    const workbook = utils.book_new();
    utils.book_append_sheet(workbook, worksheet, "Historical Data");
    // --- Analysis Sheet Generation ---
    // Flatten table data for analysis
    if (currentParamData && isGroupedData(currentParamData.data)) {
      // Collect unique parameter names across all days, preserving first appearance order
      const seen = new Set<string>();
      const paramNames: string[] = [];
      currentParamData.data.forEach((dayGroup) => {
        dayGroup.data.forEach((param) => {
          const paramName = Array.isArray(param.Name)
            ? param.Name[0]
            : param.Name || "";
          if (paramName && !seen.has(paramName)) {
            seen.add(paramName);
            paramNames.push(paramName);
          }
        });
      });
      const allParams = paramNames.filter(
        (n) => n !== "Battery" && n !== "Timestamp"
      );
      // Build value map for analysis
      const valueMap: Record<string, number[]> = {};
      currentParamData.data.forEach((dayGroup: any) => {
        (dayGroup.data || []).forEach((param: any) => {
          const paramName = param.Name?.[0] || param.name || "";
          if (!paramName) return;
          const values = (param.ActValue || [])
            .map(Number)
            .filter((v: any) => !isNaN(v));
          if (!valueMap[paramName]) valueMap[paramName] = [];
          valueMap[paramName].push(...values);
        });
      });
      const analysisRows = allParams.map((p) => {
        const values = valueMap[p] || [];
        return [
          deviceName,
          p,
          values.length ? mean(values) : "",
          values.length ? max(values) : "",
          values.length ? min(values) : "",
        ];
      });
      // Prepare Analysis sheet data (header + rows)
      const analysisSheetData = [
        ["Device", "Parameter", "Avg Value", "Max Value", "Min Value"],
        ...analysisRows,
      ];
      const analysisSheet = utils.aoa_to_sheet(analysisSheetData);
      // Style header row (bold)
      const aRange = utils.decode_range(analysisSheet["!ref"] as string);
      for (let C = aRange.s.c; C <= aRange.e.c; ++C) {
        const addr = utils.encode_cell({ r: 0, c: C });
        if (!analysisSheet[addr]) continue;
        analysisSheet[addr].s = analysisSheet[addr].s || {};
        analysisSheet[addr].s.font = { bold: true } as any;
      }
      analysisSheet["!cols"] = [
        { wch: 18 },
        { wch: 22 },
        { wch: 12 },
        { wch: 12 },
        { wch: 12 },
      ];
      utils.book_append_sheet(workbook, analysisSheet, "Analysis");
    }
    writeFile(workbook, filename);
  };
  const handleDownloadCSV = () => {
    const baseFilename = getBaseFilename();
    const filename = `${baseFilename}.csv`;
    const excelData = preparePivotedExcelData();
    if (excelData.length <= 1) {
      alert("No data available to download.");
      return;
    }
    // --- Analysis Table ---
    let analysisRows: any[][] = [];
    if (currentParamData && isGroupedData(currentParamData.data)) {
      // Collect unique parameter names across all days, preserving first appearance order
      const seen = new Set<string>();
      const paramNames: string[] = [];
      currentParamData.data.forEach((dayGroup) => {
        (dayGroup.data || []).forEach((param: ParamDataItem) => {
          const paramName = Array.isArray(param.Name)
            ? param.Name[0]
            : param.Name || (param as any).name || "";
          if (paramName && !seen.has(paramName)) {
            seen.add(paramName);
            paramNames.push(paramName);
          }
        });
      });
      const allParams = paramNames.filter(
        (n) => n !== "Battery" && n !== "Timestamp"
      );
      // Build value map for analysis
      const valueMap: Record<string, number[]> = {};
      currentParamData.data.forEach((dayGroup) => {
        (dayGroup.data || []).forEach((param: ParamDataItem) => {
          const paramName = Array.isArray(param.Name)
            ? param.Name[0]
            : param.Name || (param as any).name || "";
          if (!paramName) return;
          const values = (param && param.ActValue ? param.ActValue : [])
            .map(Number)
            .filter((v) => !isNaN(v));
          if (!valueMap[paramName]) valueMap[paramName] = [];
          valueMap[paramName].push(...values);
        });
      });
      analysisRows = allParams.map((p) => {
        const values = valueMap[p] || [];
        return [
          deviceName,
          p,
          values.length ? mean(values) : "",
          values.length ? max(values) : "",
          values.length ? min(values) : "",
        ];
      });
    }
    const analysisHeader = [
      "Device",
      "Parameter",
      "Avg Value",
      "Max Value",
      "Min Value",
    ];
    // --- Data Table ---
    const header = excelData[0];
    const dataRows = excelData.slice(1);
    // --- CSV Assembly ---
    const csvAoa: unknown[][] = [];
    csvAoa.push(analysisHeader);
    csvAoa.push(...analysisRows);
    csvAoa.push([""]); // blank row
    csvAoa.push(header);
    csvAoa.push(...dataRows);
    csvAoa.push([""]); // blank row at end
    const csvContent = csvAoa
      .map((row) =>
        row
          .map((cell) => {
            if (cell == null) return "";
            const str = String(cell);
            if (str.includes(",") || str.includes('"') || str.includes("\n")) {
              return '"' + str.replace(/"/g, '""') + '"';
            }
            return str;
          })
          .join(",")
      )
      .join("\r\n");
    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  const renderTable = (
    data: { data?: GroupedDay[] } | null,
    loading: boolean,
    error: string | null
  ) => {
    if (loading) return <CustomSpinner />;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!data?.data || !isGroupedData(data.data) || data.data.length === 0)
      return <div>No data available.</div>;
    return (
      <div>
        {data.data.map((group: GroupedDay) => {
          const idKey = group._id;
          const dayData: ParamDataItem[] = Array.isArray(group.data)
            ? group.data
            : [];
          if (dayData.length === 0) {
            return (
              <div key={idKey} className="mb-8">
                <h4 className="font-semibold mb-2 text-orange-600">
                  Date:{" "}
                  {idKey && !isNaN(Number(idKey))
                    ? (() => {
                        const d = new Date(Number(idKey));
                        const day = String(d.getDate()).padStart(2, "0");
                        const monthName = d.toLocaleString("en-GB", {
                          month: "short",
                        });
                        const year = d.getFullYear();
                        return `${day} ${monthName} ${year}`;
                      })()
                    : "Invalid Date"}
                </h4>
                <div>No data for this date.</div>
              </div>
            );
          }
          const allColumns = Array.isArray(dayData[0]?.ValueReceivedDate)
            ? [...dayData[0].ValueReceivedDate].reverse()
            : [];
          const colCount = allColumns.length;
          const rowCount = dayData.length;
          const rowHeight = new Array(rowCount).fill(35);
          const getRowHeight = (index: number) => rowHeight[index] ?? 35;
          return (
            <div key={idKey} className="mb-8">
              <h4 className="font-semibold mb-2 text-orange-600">
                Date:{" "}
                {idKey && !isNaN(Number(idKey))
                  ? (() => {
                      const d = new Date(Number(idKey));
                      const day = String(d.getDate()).padStart(2, "0");
                      const monthName = d.toLocaleString("en-GB", {
                        month: "short",
                      });
                      const year = d.getFullYear();
                      return `${day} ${monthName} ${year}`;
                    })()
                  : "Invalid Date"}
              </h4>
              <div
                className="grid items-start"
                style={{
                  gridTemplateColumns: `minmax(200px,${getDescriptionColWidth(
                    parentWidth
                  )}px) 1fr`,
                  width: "100%",
                  overflowX: "hidden",
                  minWidth: 0,
                }}
              >
                <div
                  className="grid"
                  style={{
                    gridTemplateColumns: `minmax(200px,${getDescriptionColWidth(
                      parentWidth
                    )}px)`,
                  }}
                >
                  <div
                    className="sticky-description-header"
                    style={{
                      left: 0,
                      fontWeight: "bold",
                      borderBottom: "2px solid #e5e7eb",
                      borderRight: "1px solid #eee",
                      padding: "8px",
                      whiteSpace: "nowrap",
                      boxSizing: "border-box",
                      height: 35,
                      minWidth: 200,
                      width: getDescriptionColWidth(parentWidth),
                      maxWidth: getDescriptionColWidth(parentWidth),
                      borderTopLeftRadius: "8px",
                    }}
                  >
                    DESCRIPTION
                  </div>
                  {dayData.map((row: ParamDataItem, idx: number) => (
                    <div
                      key={idx}
                      style={{
                        fontWeight: "bold",
                        borderBottom: "1px solid #eee",
                        borderRight: "1px solid #eee",
                        whiteSpace: "nowrap",
                        boxSizing: "border-box",
                        height: 35,
                        padding: 5,
                        minWidth: 200,
                        width: getDescriptionColWidth(parentWidth),
                        maxWidth: getDescriptionColWidth(parentWidth),
                        background: idx % 2 === 0 ? "#FFF5F0" : "#fff",
                        borderBottomLeftRadius: `${
                          idx === dayData.length - 1 ? "8px" : "0px"
                        }`,
                      }}
                    >
                      {Array.isArray(row.Name) && row.Name[0]
                        ? row.Name[0]
                        : ""}
                    </div>
                  ))}
                </div>
                <div style={{ overflowX: "auto", width: "100%" }}>
                  <Grid
                    columnCount={colCount}
                    columnWidth={() => getColumnWidth(parentWidth, colCount)}
                    height={(rowCount + 1) * 40}
                    rowCount={rowCount + 1}
                    rowHeight={getRowHeight}
                    width={getDataGridWidth(parentWidth)}
                  >
                    {({ columnIndex, rowIndex, style }) => {
                      if (rowIndex === 0) {
                        return (
                          <div
                            style={{
                              ...style,
                              background: "#FF6600",
                              color: "#fff",
                              fontWeight: "bold",
                              borderBottom: "2px solid #e5e7eb",
                              borderRight: "1px solid #eee",
                              padding: "8px",
                              whiteSpace: "nowrap",
                              boxSizing: "border-box",
                              top: 0,
                              minWidth: 70,
                              maxWidth: 300,
                              textAlign: "right",
                              borderTopRightRadius:
                                columnIndex === colCount - 1
                                  ? "8px"
                                  : undefined,
                            }}
                          >
                            {allColumns[columnIndex] || ""}
                          </div>
                        );
                      }
                      const isOrangeRow = (rowIndex - 1) % 2 === 0;
                      const rowBg = isOrangeRow ? "#FFF5F0" : "#fff";
                      const actValues = Array.isArray(
                        dayData[rowIndex - 1]?.ActValue
                      )
                        ? [...dayData[rowIndex - 1].ActValue].reverse()
                        : [];
                      const value =
                        actValues.length > columnIndex
                          ? actValues[columnIndex]
                          : "";
                      const isBottomRight =
                        rowIndex === rowCount && columnIndex === colCount - 1;
                      return (
                        <div
                          style={{
                            ...style,
                            borderBottom: "1px solid #eee",
                            borderRight: "1px solid #eee",
                            padding: "8px",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            background: rowBg,
                            minWidth: 70,
                            maxWidth: 300,
                            textAlign: "right",
                            borderBottomRightRadius: isBottomRight
                              ? "8px"
                              : undefined,
                          }}
                        >
                          {value}
                        </div>
                      );
                    }}
                  </Grid>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };
  const renderLineChart = (
    data: GraphGroup[] | null | undefined,
    loading: boolean,
    error: string | null
  ) => {
    if (loading) return <CustomSpinner />;
    if (error) return <div className="text-red-500">{error}</div>;
    if (!Array.isArray(data) || data.length === 0)
      return <div>No data available.</div>;
    const adminLineColor = "#F05024";

    return (
      <div className="flex flex-col gap-8 w-full">
        {data.map((group) => {
          const series = (group.series || []) as GraphSeries[];
          const chartSeries = series.map((s) => ({
            name:
              s.registerAddress !== undefined
                ? `${s.name} (${s.registerAddress})`
                : s.name,
            data: s.data,
          }));
          const chartOptions = {
            chart: {
              type: "line" as const,
              height: 350,
              zoom: { enabled: true, type: "x" as const, autoScaleYaxis: true },
              animations: { enabled: false },
              toolbar: {
                show: true,
                tools: {
                  download: true,
                  selection: true,
                  zoom: true,
                  zoomin: true,
                  zoomout: true,
                  pan: true,
                  reset: true,
                },
              },
            },
            dataLabels: { enabled: false },
            stroke: { curve: "smooth" as const, width: 2, show: true },
            xaxis: {
              type: "datetime" as const,
              title: { text: "Time" },
              labels: {
                show: true,
                datetimeUTC: false,
                formatter: (value: string | number) => {
                  try {
                    const asset = assets?.find(
                      (a) => a.AssetName === deviceName
                    );
                    const deviceTimeZone =
                      asset?.timeZone ||
                      Intl.DateTimeFormat().resolvedOptions().timeZone ||
                      "UTC";
                    return formatInTimeZone(
                      new Date(Number(value)),
                      deviceTimeZone,
                      "dd MMM yyyy HH:mm:ss"
                    );
                  } catch {
                    return String(value);
                  }
                },
              },
              tooltip: { enabled: false },
            },
            yaxis: {
              title: { text: "Value" },
              labels: { formatter: (val: number) => val.toFixed(1) },
            },
            tooltip: {
              enabled: true,
              shared: true,
              followCursor: true,
            },
            legend: { show: false },
            grid: {
              show: true,
              borderColor: "#e7e7e7",
              strokeDashArray: 3,
            },
            colors: undefined as any, // let Apex assign colors per series
          };
          return (
            <div
              key={group.id}
              className="bg-white p-4 rounded-lg border border-gray-200 w-full"
            >
              <div className="text-sm font-medium mb-2 text-gray-700">
                {series.map((s) => s.name).join(", ")}
              </div>
              <ReactApexChart
                options={chartOptions}
                series={chartSeries}
                type="line"
                height={350}
              />
            </div>
          );
        })}
      </div>
    );
  };
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const assetIdFromQuery = params.get("assetId") || "";
    if (assets && assets.length > 0) {
      if (assetIdFromQuery) {
        const found = assets.find((a) => a.AssetId === assetIdFromQuery);
        if (found) {
          setAssetId(assetIdFromQuery);
          setDeviceName(found.AssetName);
        } else {
          // Fallback if URL assetId is invalid
          const first = assets[0];
          setDeviceName(first.AssetName);
          setAssetId(first.AssetId || "");
        }
      }
    }
  }, [location.search, assets]);
  return (
    <>
      <style>
        {`
          .react-datepicker__week--selected .react-datepicker__day,
          .react-datepicker__week--selected .react-datepicker__day--selected,
          .react-datepicker__month-text--selected,
          .react-datepicker__month-text--keyboard-selected,
          .rdrInRange, .rdrStartEdge, .rdrEndEdge,
          .react-datepicker__day--in-selecting-range,
          .react-datepicker__day--in-range,
          .react-datepicker__day--selected,
          .react-datepicker__day--range-start,
          .react-datepicker__day--range-end { background: #FF6600 !important; color: #fff !important; border-radius: 0.3rem !important; }
          .react-datepicker__week:hover .react-datepicker__day { background: #ffe3d6 !important; color: #FF6600 !important; border-radius: 0.3rem !important; transition: background 0.15s; }
          .react-datepicker__week:hover .react-datepicker__day--selected,
          .react-datepicker__week:hover .react-datepicker__day--range-start,
          .react-datepicker__week:hover .react-datepicker__day--range-end { background: #FF6600 !important; color: #fff !important; }
          .rdrDayNumber span { color: #222 !important; }
          .rdrDay.rdrDayPassive .rdrInRange,
          .rdrDay.rdrDayPassive .rdrStartEdge,
          .rdrDay.rdrDayPassive .rdrEndEdge { background: #ffd6c2 !important; color: #fff !important; }
          .rdrDayStartPreview,
          .rdrDayInPreview,
          .rdrDayEndPreview { border-top: 1px solid #FF6600 !important; border-bottom: 1px solid #FF6600 !important; border-left: none !important; border-right: none !important; background-color: rgba(240, 80, 36, 0.1) !important; }
          .rdrDayStartPreview { border-left: 1px solid #FF6600 !important; }
          .rdrDayEndPreview { border-right: 1px solid #FF6600 !important; }
          .rdrDayStartPreview .rdrDayNumber span,
          .rdrDayInPreview .rdrDayNumber span,
          .rdrDayEndPreview .rdrDayNumber span { color: #222 !important; }
          .react-datepicker__day--keyboard-selected { background: #ffb899 !important; color: #fff !important; }
          .react-datepicker__day--in-range { border-radius: 0 !important; }
          .react-datepicker__day--range-start,
          .react-datepicker__day--range-end { border-radius: 0.3rem !important; }
          .react-datepicker__day:focus { outline: 2px solid #FF6600 !important; }
          .sticky-description-col { position: sticky !important; left: 0 !important; z-index: 3 !important; background: inherit; }
          .sticky-description-header { position: sticky !important; left: 0 !important; z-index: 4 !important; background: #FF6600 !important; color: #fff !important; }
        `}
      </style>
      <div className="p-4 bg-gray-100">
        <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6 mt-8">
          <div className="p-2 sm:p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
            <div className="flex items-center gap-2 sm:gap-4 flex-1 w-full sm:w-auto">
              <select
                className="px-4 py-2 text-gray-900 text-sm rounded-lg border border-gray-200 focus:outline-none focus:border-[#F05024] bg-white hover:border-[#F05024] transition-colors cursor-pointer"
                value={deviceName}
                onChange={(e) => {
                  const selectedAsset = assets?.find(
                    (asset) => asset.AssetName === e.target.value
                  );
                  setDeviceName(e.target.value);
                  setAssetId(selectedAsset?.AssetId || "");
                }}
              >
                {assets && assets.length > 0 ? (
                  assets.map((asset: Asset) => (
                    <option key={asset._id} value={asset.AssetName}>
                      {asset.AssetName}
                    </option>
                  ))
                ) : (
                  <option value="">No Assets</option>
                )}
              </select>
              <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Device Timezone:{" "}
                <span className="text-orange-600 font-semibold">
                  {assets?.find((a) => a.AssetName === deviceName)?.timeZone ||
                    "UTC"}
                </span>
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <div className="flex flex-wrap rounded-md overflow-hidden border">
                {["Today", "This week", "This month", "Custom"].map((range) => (
                  <button
                    key={range}
                    onClick={() => setSelectedTimeRange(range)}
                    className={`px-4 py-2 ${
                      selectedTimeRange === range
                        ? "bg-[#FF6600] text-white hover:bg-[#FF944D]"
                        : "bg-white hover:bg-gray-50"
                    }`}
                  >
                    {range}
                  </button>
                ))}
              </div>
              <div className="relative" ref={pickerTriggerRef}>
                {selectedTimeRange === "Custom" && (
                  <div
                    className="flex items-center gap-2 cursor-pointer px-3 py-2 border border-gray-300 rounded-lg hover:bg-orange-50 transition-colors"
                    onClick={handlePickerTriggerClick}
                    title="Click to select date range"
                    tabIndex={0}
                    role="button"
                    aria-label="Select date range"
                    onKeyPress={(e) => {
                      if (e.key === "Enter" || e.key === " ")
                        handlePickerTriggerClick();
                    }}
                  >
                    <span className="text-[#F05024] flex items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="22"
                        height="22"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="#F05024"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="feather feather-calendar"
                      >
                        <rect
                          x="3"
                          y="4"
                          width="18"
                          height="18"
                          rx="2"
                          ry="2"
                          fill="#fff"
                        />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                      <span className="sr-only">Calendar icon</span>
                    </span>
                    <span className="font-medium text-gray-700">
                      {selectedDate ? selectedDate : "Select date range"}
                    </span>
                  </div>
                )}
                {selectedTimeRange === "Custom" && showDatePicker && (
                  <div
                    ref={datepickerRef}
                    className="absolute top-full right-0 mt-2 bg-white rounded-lg shadow-lg p-4 z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex flex-col gap-2 min-w-[260px]">
                      <div className="flex gap-2 items-end">
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-600">
                            From Date
                          </label>
                          <input
                            type="date"
                            value={
                              dateRange.start
                                ? dateRange.start.slice(0, 10)
                                : ""
                            }
                            max={
                              dateRange.end
                                ? dateRange.end.slice(0, 10)
                                : undefined
                            }
                            onChange={(e) => {
                              setDateRange((dr) => {
                                const selectedAsset =
                                  assets.find((a) => a.AssetId === asset_id) ||
                                  assets[0];
                                const deviceTimeZone =
                                  selectedAsset?.timeZone || "UTC";
                                const newStart = e.target.value
                                  ? new Date(
                                      `${
                                        e.target.value
                                      }T00:00:00${getTzOffsetString(
                                        deviceTimeZone
                                      )}`
                                    ).toISOString()
                                  : null;
                                const updated = { ...dr, start: newStart };
                                if (
                                  updated.start &&
                                  updated.end &&
                                  assets &&
                                  assets.length > 0
                                ) {
                                  const start = new Date(updated.start);
                                  const end = new Date(updated.end);
                                  const startStr = formatInTimeZone(
                                    start,
                                    deviceTimeZone,
                                    "yyyy-MM-dd"
                                  );
                                  const endStr = formatInTimeZone(
                                    end,
                                    deviceTimeZone,
                                    "yyyy-MM-dd"
                                  );
                                  const startOfCustom = new Date(
                                    `${startStr}T00:00:00.000${getTzOffsetString(
                                      deviceTimeZone
                                    )}`
                                  );
                                  const endOfCustom = new Date(
                                    `${endStr}T23:59:59.999${getTzOffsetString(
                                      deviceTimeZone
                                    )}`
                                  );
                                  setCustomFDate(
                                    startOfCustom.getTime().toString()
                                  );
                                  setCustomTDate(
                                    endOfCustom.getTime().toString()
                                  );
                                  setCustomDate(
                                    startOfCustom.getTime().toString()
                                  );
                                  setSelectedDate(
                                    `${formatDDMMYYYYString(
                                      e.target.value
                                    )} - ${
                                      dateRange.end
                                        ? formatDDMMYYYYString(dateRange.end)
                                        : ""
                                    }`
                                  );
                                  setShowDatePicker(false);
                                }
                                return updated;
                              });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                        <div className="flex flex-col gap-1">
                          <label className="text-xs text-gray-600">
                            To Date
                          </label>
                          <input
                            type="date"
                            value={
                              dateRange.end ? dateRange.end.slice(0, 10) : ""
                            }
                            min={
                              dateRange.start
                                ? dateRange.start.slice(0, 10)
                                : undefined
                            }
                            onChange={(e) => {
                              setDateRange((dr) => {
                                const selectedAsset =
                                  assets.find((a) => a.AssetId === asset_id) ||
                                  assets[0];
                                const deviceTimeZone =
                                  selectedAsset?.timeZone || "UTC";
                                const newEnd = e.target.value
                                  ? new Date(
                                      `${
                                        e.target.value
                                      }T00:00:00${getTzOffsetString(
                                        deviceTimeZone
                                      )}`
                                    ).toISOString()
                                  : null;
                                const updated = { ...dr, end: newEnd };
                                if (
                                  updated.start &&
                                  updated.end &&
                                  assets &&
                                  assets.length > 0
                                ) {
                                  const start = new Date(updated.start);
                                  const end = new Date(updated.end);
                                  const startStr = formatInTimeZone(
                                    start,
                                    deviceTimeZone,
                                    "yyyy-MM-dd"
                                  );
                                  const endStr = formatInTimeZone(
                                    end,
                                    deviceTimeZone,
                                    "yyyy-MM-dd"
                                  );
                                  const startOfCustom = new Date(
                                    `${startStr}T00:00:00.000${getTzOffsetString(
                                      deviceTimeZone
                                    )}`
                                  );
                                  const endOfCustom = new Date(
                                    `${endStr}T23:59:59.999${getTzOffsetString(
                                      deviceTimeZone
                                    )}`
                                  );
                                  setCustomFDate(
                                    startOfCustom.getTime().toString()
                                  );
                                  setCustomTDate(
                                    endOfCustom.getTime().toString()
                                  );
                                  setCustomDate(
                                    startOfCustom.getTime().toString()
                                  );
                                  setSelectedDate(
                                    `${
                                      dateRange.start
                                        ? formatDDMMYYYYString(dateRange.start)
                                        : ""
                                    } - ${formatDDMMYYYYString(e.target.value)}`
                                  );
                                  setShowDatePicker(false);
                                }
                                return updated;
                              });
                            }}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm"
                          />
                        </div>
                      </div>
                      {dateRange.start && dateRange.end && (
                        <div className="text-sm text-green-700">
                          ✓ Applied range:{" "}
                          {formatDDMMYYYYString(dateRange.start)} -{" "}
                          {formatDDMMYYYYString(dateRange.end)}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div
                ref={dropdownRef}
                className="relative inline-flex rounded-lg shadow-sm"
              >
                <button
                  onClick={handleDownloadXLSX}
                  disabled={isDisabled}
                  className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-l-lg hover:bg-orange-600 transition-colors focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="whitespace-nowrap flex gap-2">
                    <ArrowDownTrayIcon className="w-6 h-6 " />
                    XLSX Report
                  </span>
                </button>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  disabled={isDisabled}
                  className="px-3 py-2 text-sm font-medium text-white bg-orange-500 rounded-r-lg hover:bg-orange-600 focus:outline-none focus:ring-1 focus:ring-orange-500 focus:ring-offset-1 transition-colors border-l-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {showDropdown && (
                  <div className="absolute right-0 z-10 mt-11 min-w-[160px] w-auto bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 border border-orange-500 focus:outline-none">
                    <div className="py-1">
                      <button
                        onClick={() => {
                          handleDownloadXLSX();
                          setShowDropdown(false);
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors whitespace-nowrap"
                      >
                        Download XLSX Report
                      </button>
                      <button
                        onClick={() => {
                          handleDownloadCSV();
                          setShowDropdown(false);
                        }}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors whitespace-nowrap"
                      >
                        Download CSV Report
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="flex justify-end items-center mb-4">
          <div className="bg-white p-1 rounded-lg">
            <div className="p-0 rounded-lg flex">
              <button
                className={`flex-1 py-1 max-w-[200px] px-4 rounded-lg transition-colors flex items-center gap-2 ${
                  selectedView === "Table"
                    ? "bg-[#FF6600] text-white"
                    : "hover:bg-gray-200"
                }`}
                onClick={() => setSelectedView("Table")}
              >
                <img src="/table.svg" className="w-1/6" /> Table
              </button>
              <button
                className={`flex-1 py-1 max-w-[200px] px-4 rounded-lg transition-colors flex items-center gap-2 ${
                  selectedView === "Line Chart"
                    ? "bg-[#FF6600] text-white"
                    : "hover:bg-gray-200"
                }`}
                onClick={() => setSelectedView("Line Chart")}
              >
                <img src="/graph_icon.png" className="w-1/6" /> Graph
              </button>
            </div>
          </div>
        </div>
        <div
          ref={containerRef}
          className="bg-white p-4 rounded-lg shadow"
          style={{ width: "100%" }}
        >
          {selectedView === "Table" &&
            (selectedTimeRange === "Today"
              ? renderTable(todayParamData, todayParamLoading, todayParamError)
              : selectedTimeRange === "This week"
              ? renderTable(weekParamData, weekParamLoading, weekParamError)
              : selectedTimeRange === "This month"
              ? renderTable(monthParamData, monthParamLoading, monthParamError)
              : selectedTimeRange === "Custom"
              ? renderTable(
                  customParamData,
                  customParamLoading,
                  customParamError
                )
              : null)}
          {selectedView === "Line Chart" &&
            (selectedTimeRange === "Today"
              ? renderLineChart(
                  lineDataToday ?? undefined,
                  lineLoadingToday,
                  lineErrorToday
                )
              : selectedTimeRange === "This week"
              ? renderLineChart(
                  lineDataWeek ?? undefined,
                  lineLoadingWeek,
                  lineErrorWeek
                )
              : selectedTimeRange === "This month"
              ? renderLineChart(
                  lineDataMonth ?? undefined,
                  lineLoadingMonth,
                  lineErrorMonth
                )
              : selectedTimeRange === "Custom"
              ? renderLineChart(
                  lineDataCustom ?? undefined,
                  lineLoadingCustom,
                  lineErrorCustom
                )
              : null)}
        </div>
      </div>
    </>
  );
}
