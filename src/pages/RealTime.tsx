import { writeFile, utils } from "xlsx-js-style";
import { formatInTimeZone } from "date-fns-tz";
import {
  useCallback,
  useState,
  useEffect,
  useRef,
  useLayoutEffect,
} from "react";
import ReactApexChart from "react-apexcharts";
import EChartsGauge from "../components/EChartsGauge";
import { VariableSizeGrid as Grid } from "react-window";
import { useParamData } from "../hooks/useParamData";
import { Asset } from "../types/user.types";
import { useFullUser } from "../hooks/useFullUser";
import { useUserAsset } from "../hooks/useUserAsset";
import { useLiveMetrics } from "../hooks/useLiveMetrics";
import { useParamLine } from "../hooks/useParamLine";
import type { GraphGroup } from "../hooks/useParamLine";
import { io, Socket } from "socket.io-client";
import { ENDPOINTS } from "../api/endpoints";
import CustomSpinner from "../components/CustomSpinner";
import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useLocation } from "react-router-dom";
import { formatDate } from "../utils/dateUtils";
// Type definitions for real-time charts
interface DeviceSeries {
  timestamps: number[];
  values: number[];
}
interface DeviceSeriesStore {
  [deviceId: string]: {
    [paramId: string]: DeviceSeries;
  };
}
function useScrollbarSize() {
  const [scrollbarHeight, setScrollbarHeight] = useState(0);
  useEffect(() => {
    const div = document.createElement("div");
    div.style.width = "100px";
    div.style.height = "100px";
    div.style.overflow = "scroll";
    div.style.position = "absolute";
    div.style.top = "-9999px";
    document.body.appendChild(div);
    const height = div.offsetHeight - div.clientHeight;
    document.body.removeChild(div);
    setScrollbarHeight(height);
  }, []);
  return scrollbarHeight;
}
function useSocketRealtime(topicName: string) {
  const [socketData, setSocketData] = useState<any>(null);
  const socketRef = useRef<Socket | null>(null);
  useEffect(() => {
    if (!topicName) {
      return;
    }
    // Reset socket data when topic changes (new device selected)
    setSocketData(null);

    // Connect to socket
    const socket = io(ENDPOINTS.REALTIME_WS, {
      transports: ["websocket"], // Standard Socket.IO connection flow
    });
    socketRef.current = socket;
    // Subscribe to topic
    socket.on(topicName, (msg: any) => {
      // Handle different data formats from WebSocket server
      let transformedData = null;
      if (Array.isArray(msg) && msg.length === 2) {
        // Format: [topic, {registerAddresses, ts, GatewayId}]
        const [topic, data] = msg;
        transformedData = {
          ...data,
          time: data.ts ? new Date(data.ts).getTime() : Date.now(),
          topic: topic,
        };
      } else if (msg && typeof msg === "object" && msg.ts) {
        // Format: {registerAddresses, ts, GatewayId}
        transformedData = {
          ...msg,
          time: new Date(msg.ts).getTime(),
        };
      } else if (msg && typeof msg === "object" && msg.time) {
        // Already in expected format
        transformedData = msg;
      } else {
        // Fallback - use as is but add timestamp
        transformedData = {
          ...msg,
          time: Date.now(),
        };
      }
      setSocketData(transformedData);
    });
    // Handle connection events
    socket.on("connect", () => {
      // console.log(`[WebSocket] Connected for topic '${topicName}'.`);
    });
    socket.on("disconnect", () => {
      // console.log(`[WebSocket] Disconnected for topic '${topicName}'.`);
    });
    socket.on("error", (_error: unknown) => {
      // console.error(`[WebSocket] Error for topic '${topicName}':`, _error);
    });
    // Clean up on unmount or param change
    return () => {
      // console.log(`[WebSocket] Disconnecting for topic '${topicName}'.`);
      socket.disconnect();
    };
  }, [topicName]);
  return socketData;
}
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
// Helper functions for analysis, CSV export, and timezone offset (root scope)
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
function getTzOffsetString(tz: string) {
  try {
    const now = new Date();
    const fmt = formatInTimeZone(now, tz, "xxx"); // e.g. +05:30
    return fmt;
  } catch {
    return "Z";
  }
}
export default function RealTime() {
  const [deviceName, setDeviceName] = useState<string>("");
  const [selectedView, setSelectedView] = useState<string>("Table");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  useFullUser(localStorage.getItem("userId") ?? undefined);
  const { assets } = useUserAsset(localStorage.getItem("userId") ?? undefined);
  const [asset_id, setAssetId] = useState<string>("");
  const [fDate, setFdate] = useState<string>();
  const [tDate, setTdate] = useState<string>();
  const [date, setDate] = useState<string>();
  const { ref: containerRef, width: parentWidth } = useParentWidth();
  const [gridReady, setGridReady] = useState(false);
  const [asset_topic, setAssetTopic] = useState<string>("");
  const wsData = useSocketRealtime(asset_topic);
  const scrollbarHeight = useScrollbarSize();
  // Ref for the download split-button dropdown to detect outside clicks
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const location = useLocation();

  // Close dropdown when clicking/tapping outside or when pressing Escape
  useEffect(() => {
    function handleOutside(e: MouseEvent | TouchEvent) {
      const target = e.target as Node | null;
      if (
        dropdownRef.current &&
        target &&
        !dropdownRef.current.contains(target)
      ) {
        setIsDropdownOpen(false);
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setIsDropdownOpen(false);
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
  // Preselect from URL assetId only (no localStorage fallback)
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const assetIdFromQuery = params.get("assetId") || "";
    if (assets && assets.length > 0) {
      if (assetIdFromQuery) {
        const found = assets.find((a) => a.AssetId === assetIdFromQuery);
        if (found) {
          setAssetId(assetIdFromQuery);
          setDeviceName(found.AssetName);
          let topic = "";
          if (found.Gateway) {
            const slaveId = found.SlaveId || 1;
            topic = `${found.Gateway}/${slaveId}`;
          }
          setAssetTopic(topic);
        } else {
          // Fallback if URL assetId is invalid
          const first = assets[0];
          setAssetId(first.AssetId ?? "");
          setDeviceName(first.AssetName);
          let topic = "";
          if (first.Gateway) {
            const slaveId = first.SlaveId || 1;
            topic = `${first.Gateway}/${slaveId}`;
          }
          setAssetTopic(topic);
        }
      }
    }
  }, [location.search, assets]);
  // Real-time chart data storage
  const [liveSeries, setLiveSeries] = useState<DeviceSeriesStore>({});
  // Local state for live metrics (like admin side)
  interface LiveMetric {
    ActValue: string | number | (string | number)[];
    Maxlimit: string | number;
    RegisterAddress?: string | number;
    parameterId?: string | number;
    Name?: string | string[];
    PostFix?: string;
    [key: string]: string | number | (string | number)[] | undefined;
  }
  const [liveMetrics, setLiveMetrics] = useState<LiveMetric[] | null>(null);
  const lastWsTimeRef = useRef<number | undefined>(undefined);
  // Resolve a websocket value for an item supporting numeric and named registers
  const getWsValueForItem = useCallback(
    (ws: Record<string, unknown>, item: Record<string, unknown>): unknown => {
      if (!ws || typeof ws !== "object" || !item) return undefined;
      const wsEntries = Object.entries(ws);
      const wsKeyMap = new Map<string, unknown>();
      for (const [k, v] of wsEntries) wsKeyMap.set(String(k).toLowerCase(), v);
      const regAddrArray = Array.isArray(item.RegisterAddress)
        ? item.RegisterAddress
        : Array.isArray(item.registerAddress)
        ? item.registerAddress
        : undefined;
      const regAddr =
        regAddrArray && regAddrArray.length > 0
          ? regAddrArray[0]
          : item.RegisterAddress ?? item.registerAddress;
      const candidates: string[] = [];
      if (regAddr !== undefined && regAddr !== null) {
        candidates.push(String(regAddr));
        const n = Number(regAddr);
        if (!isNaN(n)) candidates.push(String(n));
      }
      const name = Array.isArray(item.Name) ? item.Name[0] : item.Name;
      if (typeof name === "string" && name.trim().length > 0) {
        const norm = name.toLowerCase().replace(/[^a-z0-9]/g, "");
        candidates.push(norm);
        if (norm.includes("temp")) candidates.push("temperature");
        if (norm.includes("press")) candidates.push("pressure");
        if (norm.includes("alert")) candidates.push("alert");
      }
      if (item.parameterId !== undefined && item.parameterId !== null) {
        candidates.push(String(item.parameterId));
      }
      for (const key of candidates) {
        const val = wsKeyMap.get(String(key).toLowerCase());
        if (val !== undefined) return val;
      }
      return undefined;
    },
    []
  );
  // // Debug logging
  // useEffect(() => {
  // console.log("RealTime Debug Info:", {
  // userId: localStorage.getItem("userId"),
  // token: localStorage.getItem("token"),
  // companyId: localStorage.getItem("companyId"),
  // user,
  // assets,
  // asset_id,
  // fDate,
  // tDate,
  // date,
  // asset_topic,
  // wsData,
  // });
  // }, [user, assets, asset_id, fDate, tDate, date, asset_topic, wsData]);
  useEffect(() => {
    const urlAssetId = new URLSearchParams(location.search).get("assetId");
    if (assets && assets.length > 0 && !asset_id && !urlAssetId) {
      const firstAsset = assets[0];
      setAssetId(firstAsset.AssetId ?? "");
      setDeviceName(firstAsset.AssetName);
      // Always calculate topic as Gateway/SlaveId (default 1)
      // console.log("First asset:", firstAsset);
      let topic = "";
      if (firstAsset.Gateway) {
        const slaveId = firstAsset.SlaveId || 1;
        topic = `${firstAsset.Gateway}/${slaveId}`;
      }
      // console.log("[RealTime] Topic set for first asset:", topic);
      setAssetTopic(topic);
    }
  }, [assets, asset_id, location.search]);
  // // Debug asset loading
  // useEffect(() => {
  // console.log("Assets state changed:", {
  // assets: assets?.map((a) => ({
  // id: a.AssetId,
  // name: a.AssetName,
  // topic: a.Topic,
  // })),
  // currentAssetId: asset_id,
  // currentDeviceName: deviceName,
  // });
  // }, [assets, asset_id, deviceName]);
  useEffect(() => {
    document.title = "RealTime";
  }, []);
  useEffect(() => {
    if (parentWidth > 0) setGridReady(true);
  }, [parentWidth]);
  // Set dates for API calls (today only, using device timezone)
  useEffect(() => {
    if (!asset_id || !assets || assets.length === 0) return;
    const selectedAsset =
      assets.find((a) => a.AssetId === asset_id) || assets[0];
    const deviceTimeZone = selectedAsset?.timeZone || "UTC";
    // Get today in device timezone
    const now = new Date();
    const startOfDayStr = formatInTimeZone(now, deviceTimeZone, "yyyy-MM-dd");
    // Parse as device local midnight
    const startOfDay = new Date(
      `${startOfDayStr}T00:00:00.000${getTzOffsetString(deviceTimeZone)}`
    );
    const endOfDay = new Date(
      `${startOfDayStr}T23:59:59.999${getTzOffsetString(deviceTimeZone)}`
    );
    setFdate(startOfDay.getTime().toString());
    setTdate(endOfDay.getTime().toString());
    setDate(startOfDay.getTime().toString());
  }, [asset_id, assets]);
  // Fetch parameter data (today)
  const {
    data: paramData,
    loading: paramLoading,
    error: paramError,
    setData: setParamData,
  } = useParamData(
    asset_id && fDate && tDate && date ? asset_id : "",
    fDate || "",
    tDate || "",
    date || ""
  );
  // Fetch line chart data (today)
  // Fetch line chart data (today) — only when user selects 'Line Chart'
  const shouldLoadLine =
    selectedView === "Line Chart" && asset_id && fDate && tDate && date;
  const {
    data: lineDataToday,
    loading: lineLoadingToday,
    error: lineErrorToday,
  } = useParamLine(
    shouldLoadLine ? asset_id : "",
    shouldLoadLine ? fDate : "",
    shouldLoadLine ? tDate : "",
    shouldLoadLine ? date : ""
  );
  // State to hold grouped line chart data with websocket updates
  const [groupDataWithWS, setGroupDataWithWS] = useState<GraphGroup[] | null>(
    null
  );
  const seededSignatureRef = useRef<string | null>(null);
  // Cap number of points per chart to keep UI smooth
  const MAX_POINTS = 10000;
  // Update lineDataWithWS when lineDataToday or wsData changes
  useEffect(() => {
    // If we have fresh API data for today, seed the state only once per asset/date window
    const sig =
      asset_id && fDate && tDate ? `${asset_id}|${fDate}|${tDate}` : null;
    if (!wsData && Array.isArray(lineDataToday)) {
      if (sig && seededSignatureRef.current !== sig) {
        setGroupDataWithWS(lineDataToday);
        seededSignatureRef.current = sig;
      }
      return;
    }
    if (!wsData) return;
    if (
      typeof wsData.time === "number" &&
      lastWsTimeRef.current === wsData.time
    ) {
      return; // avoid processing the same WS tick twice
    }
    if (typeof wsData.time === "number") {
      lastWsTimeRef.current = wsData.time;
    }
    // Append new WS point(s) to existing state (or fallback to API seed once)
    setGroupDataWithWS((prev) => {
      const base =
        Array.isArray(prev) && prev.length > 0
          ? prev
          : Array.isArray(lineDataToday)
          ? lineDataToday
          : null;
      if (!base || base.length === 0) return base;
      const wsTime = typeof wsData.time === "number" ? wsData.time : Date.now();
      const updated = base.map((group) => {
        const updatedSeries = group.series.map((s) => {
          const wsVal = getWsValueForItem(
            wsData as any,
            { RegisterAddress: s.registerAddress } as any
          );
          const y = Number(wsVal);
          if (!Number.isFinite(y)) return s;
          const nextPoints = [...s.data, { x: wsTime, y }];
          const trimmed =
            nextPoints.length > MAX_POINTS
              ? nextPoints.slice(-MAX_POINTS)
              : nextPoints;
          return { ...s, data: trimmed };
        });
        return { ...group, series: updatedSeries };
      });
      return updated;
    });
  }, [wsData, lineDataToday, asset_id, fDate, tDate, getWsValueForItem]);
  useEffect(() => {
    if (
      wsData &&
      paramData &&
      paramData.data &&
      Array.isArray(paramData.data[0]?.data)
    ) {
      // Clone paramData to avoid direct mutation
      const updatedParamData = { ...paramData };
      updatedParamData.data = [
        {
          ...paramData.data[0],
          data: paramData.data[0].data.map((item: any) => {
            const wsValue = getWsValueForItem(wsData, item);
            const wsTime = wsData.time; // unix ms
            if (wsValue !== undefined) {
              // Add wsValue at the end of ActValue array (convert to string)
              const newActValue = [
                ...(Array.isArray(item.ActValue) ? item.ActValue : []),
                wsValue != null ? wsValue.toString() : "",
              ];
              // Convert wsTime to "HH:mm" in asset/device timezone
              let newValueReceivedDate = Array.isArray(item.ValueReceivedDate)
                ? [...item.ValueReceivedDate]
                : [];
              if (wsTime !== undefined) {
                const asset =
                  assets?.find((a) => a.AssetId === asset_id) || assets?.[0];
                const deviceTimeZone = asset?.timeZone || "UTC";
                const formattedTime = formatInTimeZone(
                  Number(wsTime),
                  deviceTimeZone,
                  "HH:mm:ss"
                );
                newValueReceivedDate = [...newValueReceivedDate, formattedTime];
              }
              return {
                ...item,
                ActValue: newActValue,
                ValueReceivedDate: newValueReceivedDate,
              };
            }
            return item;
          }),
        },
      ];
      setParamData(updatedParamData);
    }
  }, [wsData]);
  // Live metrics
  const [curr_date] = useState(Date.now());
  const { data: data_l } = useLiveMetrics(asset_id || "", curr_date);
  // Update liveMetrics state when data_l changes (like admin side)
  useEffect(() => {
    if (Array.isArray(data_l)) {
      setLiveMetrics(
        data_l.map((metric) => {
          const actValueNum = Number(metric.ActValue);
          const maxLimitNum = Number(metric.Maxlimit);
          let newMax = metric.Maxlimit;
          if (!maxLimitNum || actValueNum > maxLimitNum) {
            newMax = String(actValueNum);
          }
          return {
            ...metric,
            Maxlimit: newMax,
          };
        })
      );
    } else {
      setLiveMetrics(data_l);
    }
  }, [data_l]);
  // Real-time update for live metrics when WebSocket data arrives
  useEffect(() => {
    if (!wsData) return;
    if (
      typeof wsData.time === "number" &&
      lastWsTimeRef.current === wsData.time
    ) {
      return;
    }
    setLiveMetrics((prev: any) => {
      if (!prev || !Array.isArray(prev)) return prev;
      return prev.map((metric) => {
        const newActValue = getWsValueForItem(wsData, metric);
        if (newActValue !== undefined) {
          const actValueNum = Number(newActValue);
          const maxLimitNum = Number(metric.Maxlimit);
          let newMax = metric.Maxlimit;
          if (!maxLimitNum || actValueNum > maxLimitNum) {
            newMax = String(actValueNum);
          }
          return {
            ...metric,
            ActValue: newActValue,
            Maxlimit: newMax,
          };
        }
        return metric;
      });
    });
  }, [wsData]);
  // Update local liveMetrics state when API data changes
  useEffect(() => {
    if (Array.isArray(data_l)) {
      setLiveMetrics(
        data_l.map((metric) => {
          const actValueNum = Number(metric.ActValue);
          const maxLimitNum = Number(metric.Maxlimit);
          let newMax = metric.Maxlimit;
          if (!maxLimitNum || actValueNum > maxLimitNum) {
            newMax = String(actValueNum);
          }
          return {
            ...metric,
            Maxlimit: newMax,
          };
        })
      );
    } else {
      setLiveMetrics(data_l);
    }
  }, [data_l]);
  // Real-time update for live metrics
  useEffect(() => {
    if (!wsData) return;
    if (
      typeof wsData.time === "number" &&
      lastWsTimeRef.current === wsData.time
    ) {
      return;
    }
    setLiveMetrics((prev: any) => {
      if (!prev || !Array.isArray(prev)) return prev;
      return prev.map((metric) => {
        const newActValue = getWsValueForItem(wsData, metric);
        if (newActValue !== undefined) {
          const actValueNum = Number(newActValue);
          const maxLimitNum = Number(metric.Maxlimit);
          let newMax = metric.Maxlimit;
          if (!maxLimitNum || actValueNum > maxLimitNum) {
            newMax = String(actValueNum);
          }
          return {
            ...metric,
            ActValue: newActValue,
            Maxlimit: newMax,
          };
        }
        return metric;
      });
    });
  }, [wsData]);
  // Update liveSeries for real-time charts
  useEffect(() => {
    if (!wsData || !data_l) return;
    setLiveSeries((prev) => {
      const updated = { ...prev };
      data_l.forEach((metric) => {
        // Try different property access patterns for register address
        const regAddrKey = metric.RegisterAddress?.toString();
        let wsValue = undefined;
        if (
          regAddrKey &&
          Object.prototype.hasOwnProperty.call(wsData, regAddrKey)
        ) {
          wsValue = wsData[regAddrKey];
        } else if (
          metric.RegisterAddress &&
          Object.prototype.hasOwnProperty.call(wsData, metric.RegisterAddress)
        ) {
          wsValue = wsData[metric.RegisterAddress];
        } else if (
          metric.RegisterAddress &&
          Object.prototype.hasOwnProperty.call(
            wsData,
            `${metric.RegisterAddress}`
          )
        ) {
          wsValue = wsData[`${metric.RegisterAddress}`];
        }
        if (wsValue !== undefined && metric.parameterId) {
          const deviceId = asset_id || "default";
          const paramId = metric.parameterId;
          const value = Number(wsValue);
          const timestamp = wsData.time || Date.now();
          if (!updated[deviceId]) updated[deviceId] = {};
          if (!updated[deviceId][paramId]) {
            updated[deviceId][paramId] = { timestamps: [], values: [] };
          }
          // Add new data point
          updated[deviceId][paramId].timestamps.push(timestamp);
          updated[deviceId][paramId].values.push(value);
          // Keep only last 50 points for performance
          if (updated[deviceId][paramId].timestamps.length > 50) {
            updated[deviceId][paramId].timestamps =
              updated[deviceId][paramId].timestamps.slice(-50);
            updated[deviceId][paramId].values =
              updated[deviceId][paramId].values.slice(-50);
          }
        }
      });
      return updated;
    });
  }, [wsData, data_l, asset_id]);
  // Utility function to get chart data from liveSeries
  // State for allCols and allRows used in the table/grid
  const [allCols, setAllCols] = useState<any[]>([]);
  // Helper: get all unique ValueReceivedDate columns
  useEffect(() => {
    if (
      paramData &&
      paramData.data &&
      paramData.data[0] &&
      Array.isArray(paramData.data[0].data)
    ) {
      setAllCols(
        Array.isArray(paramData.data[0].data[0]?.ValueReceivedDate)
          ? paramData.data[0].data[0].ValueReceivedDate
          : []
      );
    } else {
      setAllCols([]);
    }
  }, [paramData]);
  // Table/grid cell renderer for flat data (Today)

  const getColumnWidth = (_index: number) => {
    // Make first column wider, others flexible based on available width and column count
    // if (_index === 0) return Math.max(parentWidth * 0.18, 120); // 18% or min 120px
    if (allCols.length > 0 && parentWidth > 0) {
      // Distribute remaining width among columns, min 70px per col
      const remaining = parentWidth - Math.max(parentWidth, 120);
      return Math.max(remaining / allCols.length, 100);
    }
    return 90;
  };
  // Memoize chart options and series for ApexChart
  // Prepare data for XLSX export (array of arrays)
  const prepareRealtimeExcelData = useCallback((): string[][] => {
    if (
      !paramData ||
      !Array.isArray(paramData.data) ||
      !Array.isArray(paramData.data[0]?.data) ||
      paramData.data[0].data.length === 0
    ) {
      return [];
    }
    const rows = paramData.data[0].data;
    // --- Build header rows as in screenshot ---
    const today = new Date();
    const monthName = today.toLocaleString("en-GB", { month: "short" });
    const dateStr = `${today
      .getDate()
      .toString()
      .padStart(2, "0")} ${monthName} ${today.getFullYear()}`;
    const device =
      deviceName ||
      assets?.find((a) => a.AssetId === asset_id)?.AssetName ||
      "Device";
    // Find all unique parameter names for columns (skip Battery, which is always second col)
    let paramNames: string[] = [];
    if (rows.length > 0) {
      // Find all unique param names in order of appearance
      const seen = new Set();
      for (const row of rows) {
        const name = Array.isArray(row.Name) ? row.Name[0] : row.Name;
        if (name && !seen.has(name)) {
          seen.add(name);
          paramNames.push(name);
        }
      }
    }
    // Battery always second col, Timestamp always first
    // Remove Battery and Timestamp from paramNames if present
    paramNames = paramNames.filter((n) => n !== "Battery" && n !== "Timestamp");
    // Compose columns: Date | Timestamp | Device | ...other params (Battery removed)
    const columns = ["Date", "Timestamp", "Device", ...paramNames];
    // Compose all rows: first two header rows, then column headers, then data
    const excelRows: string[][] = [];
    // Third row: column headers
    excelRows.push(columns);
    // Data rows: for each value, by index

    // Collect all unique timestamps from all parameters
    const allTimestampsSet = new Set<string>();
    rows.forEach((row) => {
      (row.ValueReceivedDate || []).forEach((ts: string) => {
        allTimestampsSet.add(ts);
      });
    });
    const allTimestamps = Array.from(allTimestampsSet).sort();
    // For each timestamp, build a row with values for each param at that timestamp
    allTimestamps.forEach((ts) => {
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
      const rowArr: string[] = [dateStr, timeStr, device];
      for (const p of paramNames) {
        const paramRow = rows.find((row) => {
          const name = Array.isArray(row.Name) ? row.Name[0] : row.Name;
          return name === p;
        });
        let val = "";
        if (paramRow) {
          const values = Array.isArray(paramRow.ActValue)
            ? paramRow.ActValue
            : [];
          const tsArr = Array.isArray(paramRow.ValueReceivedDate)
            ? paramRow.ValueReceivedDate
            : [];
          const idx = tsArr.findIndex((t) => t === ts);
          if (idx !== -1) val = values[idx];
        }
        rowArr.push(val);
      }
      excelRows.push(rowArr);
    });
    return excelRows;
  }, [paramData, deviceName, assets, asset_id]);
  const downloadCSV = (data: unknown[][], filename: string) => {
    const csvContent = data
      .map((row) =>
        row
          .map((cell: unknown) => `"${String(cell).replace(/"/g, '""')}"`)
          .join(",")
      )
      .join("\n");
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
    }
  };
  const handleDownloadXLSX = useCallback(() => {
    const excelData = prepareRealtimeExcelData();

    const d = new Date();
    const date = formatDate(d);
    let filename = `${deviceName.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    )}_realtime-report_${date}`;
    filename += ".xlsx";
    const worksheet = utils.aoa_to_sheet(excelData);
    // Style header row (row 0) - bold, no background fill
    const range = utils.decode_range(worksheet["!ref"] as string);
    for (let C = range.s.c; C <= range.e.c; ++C) {
      const addr = utils.encode_cell({ r: 0, c: C });
      if (!worksheet[addr]) continue;
      worksheet[addr].s = worksheet[addr].s || {};
      const style = worksheet[addr].s as unknown as {
        font?: { bold?: boolean };
      };
      style.font = { bold: true };
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
    utils.book_append_sheet(workbook, worksheet, "Realtime Data");
    // --- Analysis Sheet Generation ---
    // Collect all values for each parameter
    if (
      !paramData ||
      !paramData.data ||
      !paramData.data[0] ||
      !paramData.data[0].data
    )
      return;
    const rows = paramData.data[0].data;
    let paramNames: string[] = [];
    const analysisRowsData =
      paramData &&
      paramData.data &&
      paramData.data[0] &&
      Array.isArray(paramData.data[0].data)
        ? paramData.data[0].data
        : [];
    if (analysisRowsData.length > 0) {
      const seen = new Set();
      for (const row of analysisRowsData) {
        const name = Array.isArray(row.Name) ? row.Name[0] : row.Name;
        if (name && !seen.has(name)) {
          seen.add(name);
          paramNames.push(name);
        }
      }
    }
    // Remove Battery and Timestamp from paramNames if present
    paramNames = paramNames.filter((n) => n !== "Battery" && n !== "Timestamp");
    // Compose columns: ...other params (Battery removed)
    const allParams = [...paramNames];
    // Build value map for analysis (populate with actual values)
    const valueMap: Record<string, number[]> = {};
    for (const p of allParams) {
      const paramRow = rows.find((row) => {
        const name = Array.isArray(row.Name) ? row.Name[0] : row.Name;
        return name === p;
      });
      if (paramRow) {
        const values = Array.isArray(paramRow.ActValue)
          ? paramRow.ActValue.map(Number).filter((v) => !isNaN(v))
          : [];
        valueMap[p] = values;
      }
    }
    // Build analysis rows
    const analysisRows = allParams.map((p) => {
      const values = valueMap[p] || [];
      return [deviceName, p, mean(values), max(values), min(values)];
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
      const style = analysisSheet[addr].s as unknown as {
        font?: { bold?: boolean };
      };
      style.font = { bold: true };
    }
    analysisSheet["!cols"] = [
      { wch: 18 },
      { wch: 22 },
      { wch: 12 },
      { wch: 12 },
      { wch: 12 },
    ];
    utils.book_append_sheet(workbook, analysisSheet, "Analysis");
    writeFile(workbook, filename);
  }, [deviceName, paramData, prepareRealtimeExcelData]);
  const handleDownloadCSV = useCallback(() => {
    // Filename using utils formatDate
    const d = new Date();
    let filename = `${deviceName.replace(
      /[^a-zA-Z0-9]/g,
      "_"
    )}_realtime-report_${formatDate(d)}`;
    filename += ".csv";

    // Extract rows from paramData
    const rows =
      paramData &&
      paramData.data &&
      paramData.data[0] &&
      Array.isArray(paramData.data[0].data)
        ? paramData.data[0].data
        : [];

    // Build unique parameter names in order of appearance
    let paramNamesCSV: string[] = [];
    if (rows.length > 0) {
      const seen = new Set<string>();
      for (const row of rows) {
        const name = Array.isArray(row.Name) ? row.Name[0] : row.Name;
        if (name && !seen.has(name)) {
          seen.add(name);
          paramNamesCSV.push(name);
        }
      }
    }
    // Exclude the pseudo parameter 'Timestamp' but keep Battery
    paramNamesCSV = paramNamesCSV.filter((n) => n !== "Timestamp");
    // Move Battery (or name containing 'battery') to first if present
    const battIdx = paramNamesCSV.findIndex((n) =>
      n.toLowerCase().includes("battery")
    );
    if (battIdx > 0) {
      const [batt] = paramNamesCSV.splice(battIdx, 1);
      paramNamesCSV = [batt, ...paramNamesCSV];
    }

    // ---- Analysis (Summary) Section ----
    const summaryHeader = [
      "Device",
      "Parameter",
      "Avg Value",
      "Max Value",
      "Min Value",
    ];
    const allParams = [...paramNamesCSV];
    const valueMap: Record<string, number[]> = {};
    for (const p of allParams) {
      const paramRow = rows.find((row) => {
        const name = Array.isArray(row.Name) ? row.Name[0] : row.Name;
        return name === p;
      });
      if (paramRow) {
        const values = Array.isArray(paramRow.ActValue)
          ? paramRow.ActValue.map((v: string | number) => Number(v)).filter(
              (v: number) => !isNaN(v)
            )
          : [];
        valueMap[p] = values;
      }
    }
    const summaryRows = allParams.map((p) => {
      const values = valueMap[p] || [];
      return [deviceName, p, mean(values), max(values), min(values)];
    });

    // ---- Data Section ----
    // Determine the export date from payload if present; fallback to today
    const exportDate = (() => {
      type DataLike = { data?: Array<{ _id?: number | string }> };
      const idVal = (paramData as DataLike)?.data?.[0]?._id;
      if (idVal && !isNaN(Number(idVal))) return new Date(Number(idVal));
      return new Date();
    })();
    const dd = exportDate.getDate().toString().padStart(2, "0");
    const mon = exportDate.toLocaleString("en-GB", { month: "short" });
    const yy = String(exportDate.getFullYear()).slice(-2);
    const dateCsvStr = `${dd}-${mon}-${yy}`; // e.g., 12-Oct-25

    // Collect all unique timestamps across parameters
    const allTimestampsSet = new Set<string>();
    rows.forEach((row) => {
      (Array.isArray(row.ValueReceivedDate)
        ? row.ValueReceivedDate
        : []
      ).forEach((ts: string | number) => {
        allTimestampsSet.add(String(ts));
      });
    });
    const allTimestamps = Array.from(allTimestampsSet).sort();

    // Header for data table (no hardcoded labels): reuse the header row built for XLSX
    const headerFromXlsx = (prepareRealtimeExcelData()[0] || []) as string[]; // [Date, Timestamp, Device, ...]
    const prefix = headerFromXlsx.slice(0, 3); // keep the first three labels as-is
    const batteryLabel = paramNamesCSV.find((n) =>
      n.toLowerCase().includes("battery")
    );
    const otherParamsOrdered = paramNamesCSV.filter((n) => n !== batteryLabel);
    const dataHeaders = batteryLabel
      ? [...prefix, batteryLabel, ...otherParamsOrdered]
      : [...prefix, ...otherParamsOrdered];

    // Build data rows by timestamp
    const dataRows: Array<(string | number)[]> = allTimestamps.map((ts) => {
      let timeStr = "";
      if (typeof ts === "string" && /^\d{2}:\d{2}:\d{2}$/.test(ts)) {
        timeStr = ts;
      } else if (!isNaN(Number(ts))) {
        const dts = new Date(Number(ts));
        timeStr = !isNaN(dts.getTime())
          ? dts.toLocaleTimeString("en-GB", { hour12: false })
          : String(ts);
      } else {
        timeStr = String(ts);
      }
      const rowArr: (string | number)[] = [dateCsvStr, timeStr, deviceName];
      for (const p of paramNamesCSV) {
        const paramRow = rows.find((r) => {
          const name = Array.isArray(r.Name) ? r.Name[0] : r.Name;
          return name === p;
        });
        let val: string | number = "";
        if (paramRow) {
          const values = Array.isArray(paramRow.ActValue)
            ? paramRow.ActValue
            : [];
          const tsArr = Array.isArray(paramRow.ValueReceivedDate)
            ? paramRow.ValueReceivedDate
            : [];
          const idx = tsArr.findIndex(
            (t: string | number) => String(t) === String(ts)
          );
          if (idx !== -1) val = values[idx];
        }
        rowArr.push(val);
      }
      return rowArr;
    });

    // Compose final CSV data: Summary, blank row, then Data table
    const csvData = [
      summaryHeader,
      ...summaryRows,
      [""],
      dataHeaders,
      ...dataRows,
    ];
    downloadCSV(csvData, filename);
  }, [deviceName, paramData, prepareRealtimeExcelData]);
  // compute disabled state for download buttons (disable until there is exportable data)
  const isDisabled = prepareRealtimeExcelData().length === 0;
  return (
    <div className="p-4 bg-gray-100 mt-8">
      <div className="bg-white rounded-lg shadow-sm mb-4 sm:mb-6">
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
                // Always calculate topic as Gateway/SlaveId (default 1)
                let topic = "";
                if (selectedAsset?.Gateway) {
                  const slaveId = selectedAsset?.SlaveId || 1;
                  topic = `${selectedAsset.Gateway}/${slaveId}`;
                }
                // console.log("[RealTime] Topic set for selected asset:", topic);
                setAssetTopic(topic);
              }}
            >
              {assets && assets.length > 0 ? (
                assets.map((asset: Asset) => (
                  <option key={asset._id} value={asset.AssetName}>
                    {asset.AssetName}
                  </option>
                ))
              ) : (
                <option value="">Loading assets...</option>
              )}
            </select>
            {/* Device Timezone beside dropdown */}
            <span className="ml-2 text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Device Timezone:{" "}
              <span className="text-orange-600 font-semibold">
                {assets?.find((a) => a.AssetName === deviceName)?.timeZone ||
                  "UTC"}
              </span>
            </span>
          </div>
          {/* Tailwind Split Button Implementation */}
          <div
            ref={dropdownRef}
            className="relative m-2 inline-flex rounded-lg shadow-sm"
          >
            <button
              onClick={handleDownloadXLSX}
              disabled={isDisabled}
              className="px-4 py-2 text-sm font-medium text-white bg-orange-500 rounded-l-lg hover:bg-orange-600 focus:outline-none transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <span className="whitespace-nowrap flex gap-2">
                <ArrowDownTrayIcon className="w-6 h-6 " />
                XLSX Report
              </span>
            </button>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
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
            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 z-10 mt-11 min-w-[160px] w-auto bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 border border-orange-500 focus:outline-none">
                <div className="py-1">
                  <button
                    onClick={() => {
                      handleDownloadXLSX();
                      setIsDropdownOpen(false);
                    }}
                    className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 w-full text-left transition-colors whitespace-nowrap"
                  >
                    Download XLSX Report
                  </button>
                  <button
                    onClick={() => {
                      handleDownloadCSV();
                      setIsDropdownOpen(false);
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
      {/* Live Metrics */}
      <div className="mt-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-bold text-gray-800">
              Live Metrics
            </span>
          </div>
          {(() => {
            // Use WebSocket time if available, else fallback to latest timestamp from API data
            let lastUpdateTime = wsData?.time || null;

            if (!lastUpdateTime && liveMetrics && liveMetrics.length > 0) {
              const timestamps = liveMetrics
                .map((m) => {
                  const val = m.ValueReceivedDate;
                  return typeof val === "number" ? val : 0;
                })
                .filter((t) => t > 0);

              if (timestamps.length > 0) {
                lastUpdateTime = Math.max(...timestamps);
              }
            }

            // Always show, with "No data" if no valid timestamp
            return (
              <span className="bg-gray-200 text-gray-700 text-xs px-3 py-1 rounded-full font-mono">
                ⏱️ Last updated on:{" "}
                {lastUpdateTime && lastUpdateTime > 0 && assets
                  ? formatInTimeZone(
                      lastUpdateTime,
                      assets.find((a) => a.AssetName === deviceName)
                        ?.timeZone || "UTC",
                      "dd MMM yyyy HH:mm:ss zzz"
                    )
                  : "--:--:--:--"}
              </span>
            );
          })()}
        </div>
        <div className="h-1 w-16 bg-blue-500 rounded mb-4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-2 sm:gap-4 mb-4 sm:mb-6">
          {liveMetrics?.map((data, idx) => {
            // Skip metric with parameterId 383 like admin side
            if (data.parameterId === 383) {
              return null;
            }
            // Use live websocket value if available, else fallback to ActValue
            let liveValue = data.ActValue;
            if (wsData) {
              // Use the same logic as admin: try to get the value from wsData
              const regAddrKey = data.RegisterAddress?.toString();
              if (
                regAddrKey &&
                Object.prototype.hasOwnProperty.call(wsData, regAddrKey)
              ) {
                liveValue = wsData[regAddrKey];
              } else if (
                data.RegisterAddress &&
                Object.prototype.hasOwnProperty.call(
                  wsData,
                  data.RegisterAddress
                )
              ) {
                liveValue = wsData[data.RegisterAddress];
              } else if (
                data.RegisterAddress &&
                Object.prototype.hasOwnProperty.call(
                  wsData,
                  `${data.RegisterAddress}`
                )
              ) {
                liveValue = wsData[`${data.RegisterAddress}`];
              }
            }
            return (
              <div
                key={idx}
                className="gauge-card shadow-md bg-white rounded-lg relative flex flex-col items-center justify-between p-4 sm:p-6 min-h-[340px]"
                style={{ minHeight: "40px" }}
              >
                <div className="w-full flex-1 flex items-center justify-center">
                  <div className="flex items-center w-full justify-center">
                    <EChartsGauge
                      value={Number(liveValue) || 0}
                      min={0}
                      max={
                        data.Maxlimit && !isNaN(Number(data.Maxlimit))
                          ? Number(data.Maxlimit)
                          : (() => {
                              let maxVal = 100;
                              if (Array.isArray(liveValue)) {
                                const arrMax = Math.max(
                                  ...liveValue
                                    .map((v: string | number) => Number(v))
                                    .filter((v: number) => isFinite(v))
                                );
                                if (isFinite(arrMax)) maxVal = arrMax;
                              } else if (isFinite(Number(liveValue))) {
                                maxVal = Number(liveValue);
                              }
                              return maxVal || 100;
                            })()
                      }
                      unit={data.PostFix || ""}
                      deviceName={
                        Array.isArray(data.Name)
                          ? data.Name[0] || ""
                          : data.Name || ""
                      }
                      hasData={isFinite(Number(liveValue))}
                      isHighBreach={false}
                      isLowBreach={false}
                      highThreshold={
                        data.MaxAlert !== undefined
                          ? Number(data.MaxAlert)
                          : undefined
                      }
                      lowThreshold={
                        data.MinAlert !== undefined
                          ? Number(data.MinAlert)
                          : undefined
                      }
                    />
                  </div>
                </div>
                <div className="flex flex-col items-center mt-4 w-full">
                  <div className="text-base sm:text-lg font-semibold text-gray-700 mb-1 text-center">
                    {data.Name}{" "}
                    {data.PostFix ? (
                      <span className="text-gray-400 text-sm">
                        ({data.PostFix})
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      {/* Historical Table/Graph Section */}
      <div>
        <div className="flex justify-end items-center mb-4">
          <div className="flex gap-2">
            <div className="bg-white p-1 rounded-lg">
              <div className="rounded-lg flex">
                <button
                  className={`flex-1 py-1 max-w-[200px] px-4 rounded-lg transition-colors flex items-center gap-2 ${
                    selectedView === "Table"
                      ? "bg-[#FF6600] text-white"
                      : "hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedView("Table")}
                >
                  <img src="/table.svg" className="w-1/6" />
                  Table
                </button>
                <button
                  className={`flex-1 py-1 max-w-[200px] px-4 rounded-lg transition-colors flex items-center gap-2 ${
                    selectedView === "Line Chart"
                      ? "bg-[#FF6600] text-white"
                      : "hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedView("Line Chart")}
                >
                  <img src="/graph_icon.png" className="w-1/6" />
                  Graph
                </button>
              </div>
            </div>
          </div>
        </div>
        <div
          ref={containerRef}
          className="bg-white p-4 rounded-lg shadow overflow-x-auto"
          style={{ width: "100%", maxWidth: "100vw", boxSizing: "border-box" }}
        >
          <div className="min-w-0 w-full">
            {/* Real-time Charts for Live Metrics */}
            {/* Real-time chart loading and empty state handling */}
            {selectedView === "Line Chart" && lineLoadingToday ? (
              <CustomSpinner />
            ) : selectedView === "Line Chart" && lineErrorToday ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-red-500 text-center">
                  <div className="text-lg font-semibold">
                    Error loading chart data
                  </div>
                  <div className="text-sm">{lineErrorToday}</div>
                </div>
              </div>
            ) : selectedView === "Line Chart" &&
              groupDataWithWS &&
              Array.isArray(groupDataWithWS) &&
              groupDataWithWS.length > 0 ? (
              <div className="grid grid-cols-1 gap-6">
                {groupDataWithWS.map((group) => {
                  const allSeries = group.series || [];
                  const chartSeries = allSeries.map((s) => ({
                    name: s.name,
                    data: s.data.map((p) => ({ x: p.x, y: p.y })),
                  }));
                  const chartOptions = {
                    series: chartSeries,
                    chart: {
                      type: "line" as const,
                      height: 300,
                      animations: { enabled: false },
                      toolbar: {
                        show: true,
                        tools: { download: true },
                        autoSelected: "zoom" as const,
                      },
                      zoom: { enabled: true },
                      foreColor: "#4B5563",
                    },
                    xaxis: {
                      type: "datetime" as const,
                      title: { text: "Time" },
                      labels: {
                        show: true,
                        datetimeUTC: false,
                        formatter: (value: string, timestamp?: number) => {
                          try {
                            const asset = assets?.find(
                              (a) => a.AssetName === deviceName
                            );
                            const deviceTimeZone =
                              asset?.timeZone ||
                              Intl.DateTimeFormat().resolvedOptions()
                                .timeZone ||
                              "UTC";
                            const timeVal = timestamp || Number(value);
                            if (!isNaN(timeVal)) {
                              return formatInTimeZone(
                                new Date(timeVal),
                                deviceTimeZone,
                                "HH:mm:ss"
                              );
                            }
                            return String(value);
                          } catch {
                            return String(value);
                          }
                        },
                      },
                    },
                    yaxis: {
                      decimalsInFloat: 2,
                      labels: {
                        formatter: (value: number) =>
                          isNaN(value) ? "0" : value.toFixed(2),
                      },
                    },
                    dataLabels: { enabled: false },
                    stroke: { curve: "smooth" as const, width: 2 },
                    grid: {
                      borderColor: "#e5e7eb",
                      strokeDashArray: 4,
                      padding: { top: 8, right: 8, bottom: 8, left: 8 },
                    },
                    tooltip: {
                      enabled: true,
                      shared: true,
                      followCursor: true,
                      x: {
                        formatter: (val: number) => {
                          try {
                            const asset = assets?.find(
                              (a) => a.AssetName === deviceName
                            );
                            const deviceTimeZone =
                              asset?.timeZone ||
                              Intl.DateTimeFormat().resolvedOptions()
                                .timeZone ||
                              "UTC";
                            return formatInTimeZone(
                              new Date(val),
                              deviceTimeZone,
                              "dd MMM yyyy HH:mm:ss"
                            );
                          } catch {
                            return String(val);
                          }
                        },
                      },
                      y: {
                        formatter: (v: number) =>
                          isFinite(v) ? `${v.toFixed(2)}` : "-",
                      },
                    },
                    markers: { size: 0, hover: { size: 3 } },
                    responsive: [
                      {
                        breakpoint: 768,
                        options: {
                          chart: { height: 250 },
                          legend: { position: "bottom" },
                        },
                      },
                    ],
                  };
                  return (
                    <div
                      key={group.id}
                      className="bg-white mb-0 p-4 pb-0 rounded-lg border border-gray-200"
                    >
                      <div className="text-sm font-medium mb-2 text-gray-700">
                        {chartSeries.map((s) => s.name).join(", ")}
                      </div>
                      <ReactApexChart
                        options={chartOptions}
                        series={chartOptions.series}
                        type="line"
                        height={300}
                      />
                    </div>
                  );
                })}
              </div>
            ) : selectedView === "Line Chart" &&
              (!groupDataWithWS ||
                !Array.isArray(groupDataWithWS) ||
                groupDataWithWS.length === 0) ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center text-gray-600">
                  <div className="text-lg font-semibold">
                    No chart data available
                  </div>
                  <div className="text-sm">
                    Please check if the asset has configured parameters or try
                    again later.
                  </div>
                </div>
              </div>
            ) : null}
            {/* Table for Today */}
            {selectedView === "Table" && (
              <div
                style={{
                  minHeight: 300,
                  paddingBottom: 8,
                  width: "100%",
                  maxWidth: "100vw",
                }}
              >
                <div className="mb-2 font-semibold text-orange-600">
                  Date:{" "}
                  {paramData &&
                  paramData.data &&
                  paramData.data[0] &&
                  paramData.data[0]._id &&
                  !isNaN(Number(paramData.data[0]._id))
                    ? (() => {
                        const d = new Date(Number(paramData.data[0]._id));
                        const day = d.getDate().toString().padStart(2, "0");
                        const monthName = d.toLocaleString("en-GB", {
                          month: "short",
                        });
                        const year = d.getFullYear();
                        return `${day} ${monthName} ${year}`;
                      })()
                    : (() => {
                        const d = new Date();
                        const day = d.getDate().toString().padStart(2, "0");
                        const monthName = d.toLocaleString("en-GB", {
                          month: "short",
                        });
                        const year = d.getFullYear();
                        return `${day} ${monthName} ${year}`;
                      })()}
                </div>
                {paramLoading ? (
                  <CustomSpinner />
                ) : paramError ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-red-500 text-center">
                      <div className="text-lg font-semibold">
                        Error loading table data
                      </div>
                      <div className="text-sm">{paramError}</div>
                    </div>
                  </div>
                ) : paramData &&
                  paramData.data &&
                  paramData.data[0] &&
                  Array.isArray(paramData.data[0].data) &&
                  paramData.data[0].data.length > 0 ? (
                  <div
                    style={{
                      transition: "width 0.2s",
                      width: "100%",
                      maxWidth: "100vw",
                    }}
                  >
                    {gridReady ? (
                      <div
                        className="grid grid-cols-[minmax(200px,18%),1fr] items-start"
                        style={{
                          width: "100%",
                          maxWidth: "100vw",
                          overflowX: "auto",
                          minWidth: 0,
                        }}
                      >
                        <div
                          className="grid grid-cols-[minmax(180px,100%)] items-start"
                          style={{ width: "100%" }}
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
                              top: 0,
                              height: 35,
                              minWidth: 180,
                              width: "100%",
                              borderTopLeftRadius: "8px",
                            }}
                          >
                            DESCRIPTION
                          </div>
                          {Array.isArray(paramData.data[0].data) &&
                            paramData.data[0].data.map((row, idx: number) => (
                              <div
                                key={idx}
                                style={{
                                  fontWeight: "bold",
                                  borderBottom: "1px solid #eee",
                                  borderRight: "1px solid #eee",
                                  whiteSpace: "nowrap",
                                  boxSizing: "border-box",
                                  height: 35,
                                  minWidth: 180,
                                  width: "100%",
                                  maxWidth: parentWidth * 0.2,
                                  padding: 5,
                                  background:
                                    idx % 2 === 0 ? "#FFF5F0" : "#fff",
                                  borderBottomLeftRadius:
                                    idx === paramData.data[0].data.length - 1
                                      ? "8px"
                                      : "0px",
                                }}
                              >
                                {Array.isArray(row.Name) && row.Name[0]
                                  ? row.Name[0]
                                  : ""}
                              </div>
                            ))}
                        </div>
                        <div
                          className="w-full overflow-x-auto"
                          style={{ width: "100%" }}
                        >
                          <div
                            style={{ minWidth: "100%", position: "relative" }}
                          >
                            <Grid
                              columnCount={
                                paramData.data[0].data[0]?.ValueReceivedDate
                                  ? paramData.data[0].data[0].ValueReceivedDate
                                      .length
                                  : 1
                              }
                              columnWidth={getColumnWidth}
                              height={
                                (paramData.data[0].data.length + 1) * 35 +
                                scrollbarHeight +
                                2
                              }
                              rowCount={paramData.data[0].data.length + 1}
                              rowHeight={() => 35}
                              width={
                                typeof parentWidth === "number" &&
                                isFinite(parentWidth) &&
                                parentWidth > 0
                                  ? parentWidth -
                                    Math.max(parentWidth * 0.18, 120)
                                  : window.innerWidth - 120
                              }
                            >
                              {({ columnIndex, rowIndex, style }) => {
                                const valueReceivedDates =
                                  paramData.data[0].data[0]
                                    ?.ValueReceivedDate || [];
                                const reversedDates = [
                                  ...valueReceivedDates,
                                ].reverse();
                                // Header row
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
                                          columnIndex ===
                                          paramData.data[0].data[0]
                                            .ValueReceivedDate.length -
                                            1
                                            ? "8px"
                                            : "0px",
                                      }}
                                    >
                                      {reversedDates[columnIndex] || ""}
                                    </div>
                                  );
                                }
                                // Data rows: alternate row coloring
                                const isOrangeRow = (rowIndex - 1) % 2 === 0;
                                const rowBg = isOrangeRow ? "#FFF5F0" : "#fff";
                                // Inverted ActValue for each row (except DESCRIPTION)
                                const actValues =
                                  paramData.data[0].data[rowIndex - 1]
                                    ?.ActValue || [];
                                const reversedActValues = [
                                  ...actValues,
                                ].reverse();
                                const value =
                                  reversedActValues.length > columnIndex
                                    ? reversedActValues[columnIndex]
                                    : "";
                                // Compute border radius for the bottom-right cell
                                const isLastColumn =
                                  columnIndex ===
                                  paramData.data[0].data[0].ValueReceivedDate
                                    .length -
                                    1;
                                const isLastRow =
                                  rowIndex === paramData.data[0].data.length;
                                const borderBottomRightRadius =
                                  isLastColumn && isLastRow ? "8px" : "0px";
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
                                      borderBottomRightRadius:
                                        borderBottomRightRadius,
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
                    ) : (
                      <div>Loading table...(width: {parentWidth})</div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center text-gray-600">
                      <div className="text-lg font-semibold">
                        No table data available
                      </div>
                      <div className="text-sm">
                        Please check if the asset has Realtime data
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      <style>
        {`
            .sticky-description-col {
              position: sticky !important;
              left: 0 !important;
              z-index: 3 !important;
              background: inherit;
            }
            .sticky-description-header {
              position: sticky !important;
              left: 0 !important;
              z-index: 4 !important;
              background: #FF6600 !important;
              color: #fff !important;
            }
          `}
      </style>
    </div>
  );
}
export interface ParamGraphItem {
  Name: string | string[];
  ActValue: (string | number)[];
  ValueReceivedDate: (string | number)[];
  RegisterAddress?: string | number | (string | number)[];
  parameterId?: string | number;
  ColorCode?: string | string[];
  PostFix?: string;
}
