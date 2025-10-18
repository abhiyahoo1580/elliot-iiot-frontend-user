import { memo, useCallback, useEffect, useMemo, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import { formatDistanceToNow } from "date-fns";
import { Sparklines, SparklinesLine } from "react-sparklines";
import { useMultiDeviceRealtime } from "../hooks/useMultiDeviceRealtime";
import {
  ClockIcon,
  CalendarDaysIcon,
  ExclamationCircleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";

interface LcdParameterItem {
  _id: number | string;
  Name: string;
  lastActValue?: {
    ActValue: number | string | null;
    ValueReceivedDate?: number | null;
  } | null;
  LowerThresholdValue?: number;
  UpperThresholdValue?: number;
  RegisterAddress?: string | number;
}

interface LcdAssetItem {
  _id: string;
  AssetId: string;
  AssetName: string;
  Gateway: string;
  status: boolean;
  SlaveId: number;
  AssetTypeId: number;
  ParameterData: LcdParameterItem[];
  TimeZone?: string;
  latestAlert?: {
    _id?: string;
    assetId?: string;
    description?: string;
    parameterId?: number;
    value?: number;
    threshold?: number;
    time?: number;
    category?: number;
    read?: boolean;
    timeZone?: string;
    createdAt?: string;
    updatedAt?: string;
  } | null;
}

interface LcdCardProps {
  deviceData: LcdAssetItem; // Required: Data from LCD API
  className?: string;
  size?: "sm" | "md" | "lg";
}

const ParameterCard = memo(
  ({
    param,
    assetStatus: _assetStatus,
  }: {
    param: LcdParameterItem;
    assetStatus: boolean;
  }) => {
    const accentColors = useMemo(
      () => [
        "text-orange-600 bg-orange-50",
        "text-blue-600 bg-blue-50",
        "text-emerald-600 bg-emerald-50",
        "text-violet-600 bg-violet-50",
        "text-pink-600 bg-pink-50",
        "text-cyan-600 bg-cyan-50",
        "text-yellow-600 bg-yellow-50",
        "text-lime-600 bg-lime-50",
        "text-rose-600 bg-rose-50",
        "text-slate-700 bg-slate-50",
      ],
      []
    );

    const [recentValues, setRecentValues] = useState<number[]>(() => {
      const value = param?.lastActValue?.ActValue;
      const numericValue =
        typeof value === "string" ? parseFloat(value) : value;
      return typeof numericValue === "number" && !isNaN(numericValue)
        ? [numericValue]
        : [];
    });

    useEffect(() => {
      const value = param?.lastActValue?.ActValue;
      const numericValue =
        typeof value === "string" ? parseFloat(value) : value;
      if (typeof numericValue === "number" && !isNaN(numericValue)) {
        setRecentValues((prev) => [...prev.slice(-9), numericValue]);
      }
    }, [param?.lastActValue?.ActValue]);

    const label = param.Name;
    const accent = useMemo(() => {
      // Use parameter name hash for consistent color assignment
      const hash = label.split("").reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      return accentColors[Math.abs(hash) % accentColors.length];
    }, [accentColors, label]);
    const latestValue =
      typeof param?.lastActValue?.ActValue === "string"
        ? parseFloat(param.lastActValue.ActValue)
        : param?.lastActValue?.ActValue;
    const isBreach =
      typeof latestValue === "number" &&
      !isNaN(latestValue) &&
      ((typeof param.LowerThresholdValue === "number" &&
        latestValue < param.LowerThresholdValue) ||
        (typeof param.UpperThresholdValue === "number" &&
          latestValue > param.UpperThresholdValue));

    return (
      <div className="py-2 flex items-center justify-between gap-4">
        <div className="min-w-0 flex items-center gap-2">
          <span
            className={`h-6 w-6 rounded-lg ${accent} flex items-center justify-center text-[15px] font-semibold ring-1 ring-white/60 shadow-sm`}
            title={label}
          >
            <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
              <path
                d="M4 17l6-6 4 4 6-6"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <h4
            className="text-[13px] text-slate-700 truncate max-w-[220px]"
            title={label}
          >
            {label}
          </h4>
        </div>
        <div className="flex items-center gap-2 min-w-[90px] justify-end">
          <div
            className={`text-xl font-semibold whitespace-nowrap ${
              isBreach ? "text-red-600" : "text-slate-900"
            }`}
          >
            {typeof latestValue === "number" && !isNaN(latestValue)
              ? latestValue.toFixed(2)
              : param?.lastActValue?.ActValue ?? "--"}
          </div>
          <div
            className={`w-16 h-5 ${
              isBreach ? "bg-red-50" : "bg-blue-50"
            } rounded`}
          >
            <Sparklines data={recentValues} width={60} height={20} margin={2}>
              <SparklinesLine color={isBreach ? "#DC2626" : "#2563EB"} />
            </Sparklines>
          </div>
        </div>
      </div>
    );
  }
);
ParameterCard.displayName = "ParameterCard";

function LcdCard({ deviceData, className = "", size = "md" }: LcdCardProps) {
  const navigate = useNavigate();
  const [lcdAssets, setLcdAssets] = useState<LcdAssetItem[]>([deviceData]);

  // Create WebSocket topic from deviceData
  const topics = useMemo(() => {
    return [`${deviceData.Gateway}/${deviceData.SlaveId || 1}`];
  }, [deviceData.Gateway, deviceData.SlaveId]);

  const { data: wsData } = useMultiDeviceRealtime(topics);

  // Update lcdAssets when deviceData changes
  useEffect(() => {
    setLcdAssets([deviceData]);
  }, [deviceData]);

  const updateAssetParams = useCallback(
    (wsAssetData: Record<string | number, unknown>, asset: LcdAssetItem) => {
      const topic = `${asset.Gateway}/${asset.SlaveId || 1}`;
      const topicData = wsAssetData[topic];
      if (!topicData || typeof topicData !== "object") return asset;

      const topicObj = topicData as Record<string, unknown>;
      const wsTime = (topicObj.time as number) ?? Date.now();

      return {
        ...asset,
        ParameterData: asset.ParameterData.map((param) => {
          const regAddr = param.RegisterAddress;
          let wsParam = undefined;
          if (regAddr !== undefined && regAddr !== null) {
            wsParam = topicObj[regAddr as string] ?? topicObj[String(regAddr)];
          }
          if (wsParam === undefined) {
            const normName = param.Name.toLowerCase().replace(/[^a-z0-9]/g, "");
            wsParam = topicObj[normName];
          }
          if (wsParam === undefined) return param;

          const actValue =
            typeof wsParam === "object" &&
            wsParam !== null &&
            "ActValue" in wsParam
              ? (wsParam as { ActValue: unknown }).ActValue
              : wsParam;

          return {
            ...param,
            lastActValue: {
              ActValue: actValue as number | string | null,
              ValueReceivedDate: wsTime,
            },
          };
        }),
      };
    },
    []
  );

  useEffect(() => {
    if (!wsData || !Object.keys(wsData).length) return;
    setLcdAssets((prev) =>
      prev.map((asset) => updateAssetParams(wsData, asset))
    );
  }, [wsData, updateAssetParams]);

  const sizeClass =
    size === "sm"
      ? "max-w-[280px]"
      : size === "lg"
      ? "max-w-[480px]"
      : "max-w-[380px]";

  // Add navigation handlers
  const handleRealtimeClick = () => {
    navigate(`/realtime?assetId=${deviceData.AssetId}`);
  };
  const handleHistoricalClick = () => {
    navigate(`/historical?assetId=${deviceData.AssetId}`);
  };

  return (
    <div className={`w-full ${sizeClass} ${className}`}>
      {lcdAssets.length > 0 ? (
        lcdAssets.map((asset) => (
          <div
            key={asset._id}
            className="relative rounded-2xl border border-slate-200 bg-gradient-to-br from-white/90 to-slate-50/90 shadow-[0_10px_30px_rgba(2,6,23,0.06)] w-full h-full flex flex-col"
          >
            <div className="p-4 pb-3 h-14">
              <div className="flex items-center justify-between h-full">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-9 w-9 rounded-xl bg-slate-100 flex items-center justify-center shadow-inner ring-1 ring-slate-200">
                    <span className="text-slate-600">🏭</span>
                  </div>
                  <h2 className="text-sm font-semibold text-slate-900 tracking-tight truncate">
                    {asset.AssetName}
                  </h2>
                </div>
                <span
                  className={`flex items-center gap-2 px-2.5 py-1 rounded-full text-[10px] font-medium shadow-sm ${
                    asset.status
                      ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100"
                      : "bg-rose-50 text-rose-700 ring-1 ring-rose-100"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      asset.status ? "bg-emerald-500" : "bg-rose-500"
                    }`}
                  ></span>
                  {asset.status ? "Online" : "Offline"}
                </span>
              </div>
            </div>

            <div className="px-4 pb-3">
              <div className="h-px w-full bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
            </div>

            {/* main content grows to fill available space */}
            <div className="px-4 pb-4 flex-1 flex flex-col">
              <div
                className={`space-y-2.5 flex-1 ${
                  asset.ParameterData.length > 5 ? "overflow-y-auto" : ""
                }`}
                style={{
                  minHeight: `${5 * 44}px`,
                  maxHeight:
                    asset.ParameterData.length > 5 ? `${5 * 44}px` : undefined,
                }}
              >
                {asset.ParameterData.map((param) => (
                  <ParameterCard
                    key={`${asset._id}-${param._id}`}
                    param={param}
                    assetStatus={asset.status}
                  />
                ))}
              </div>
            </div>

            <div className="px-4 py-2 bg-gradient-to-r from-slate-50 to-white rounded-b-2xl border-t border-slate-100 flex flex-wrap items-center justify-between text-[11px] h-auto min-h-[52px]">
              <div className="flex flex-col xs:flex-row xs:items-center gap-2 min-w-0 flex-1 w-full xs:w-auto">
                <div className="flex items-center gap-1 min-w-0 flex-wrap">
                  <span
                    className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-red-100 text-red-600 mr-1 relative group cursor-pointer"
                    aria-label="Last Alert"
                  >
                    <ExclamationCircleIcon className="w-3.5 h-3.5" />
                    {/* Tooltip */}
                    {asset.latestAlert?.time && (
                      <div className="invisible group-hover:visible absolute bottom-full left-0 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50 pointer-events-none">
                        <div className="space-y-1">
                          <div className="font-semibold text-red-400">
                            Alert Details
                          </div>
                          {asset.latestAlert.description && (
                            <div>
                              <span className="font-medium">Description:</span>{" "}
                              {asset.latestAlert.description}
                            </div>
                          )}
                          {asset.latestAlert.parameterId && (
                            <div>
                              <span className="font-medium">Parameter:</span>{" "}
                              {asset.ParameterData.find(
                                (p) =>
                                  String(p._id) ===
                                  String(asset.latestAlert?.parameterId)
                              )?.Name || `ID: ${asset.latestAlert.parameterId}`}
                            </div>
                          )}
                          {asset.latestAlert.value !== undefined && (
                            <div>
                              <span className="font-medium">Value:</span>{" "}
                              {asset.latestAlert.value}
                            </div>
                          )}
                          {asset.latestAlert.threshold !== undefined && (
                            <div>
                              <span className="font-medium">Threshold:</span>{" "}
                              {asset.latestAlert.threshold}
                            </div>
                          )}
                          {asset.latestAlert.category !== undefined && (
                            <div>
                              <span className="font-medium">Category:</span>{" "}
                              {asset.latestAlert.category === 1
                                ? "Info"
                                : asset.latestAlert.category === 2
                                ? "Warning"
                                : asset.latestAlert.category === 3
                                ? "Alert"
                                : "Unknown"}
                            </div>
                          )}
                          <div>
                            <span className="font-medium">Time:</span>{" "}
                            {formatInTimeZone(
                              asset.latestAlert.time,
                              asset.TimeZone || "UTC",
                              "dd MMM yyyy HH:mm:ss zzz"
                            )}
                          </div>
                        </div>
                        {/* Arrow pointing down */}
                        <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                      </div>
                    )}
                  </span>
                  <span className="font-medium text-red-700">Last Alert:</span>
                  <span className="truncate text-[10px] text-red-500 min-w-0 max-w-[120px] xs:max-w-[160px]">
                    {asset.latestAlert?.time
                      ? formatInTimeZone(
                          asset.latestAlert.time,
                          asset.TimeZone || "UTC",
                          "dd MMM yyyy HH:mm:ss zzz"
                        )
                      : "--"}
                  </span>
                  {/* Tooltip */}
                  {asset.latestAlert?.time && (
                    <div className="invisible group-hover:visible absolute bottom-full left-0 mb-2 w-64 bg-gray-900 text-white text-xs rounded-lg p-3 shadow-lg z-50 pointer-events-none">
                      <div className="space-y-1">
                        <div className="font-semibold text-red-400">
                          Alert Details
                        </div>
                        {asset.latestAlert.description && (
                          <div>
                            <span className="font-medium">Description:</span>{" "}
                            {asset.latestAlert.description}
                          </div>
                        )}
                        {asset.latestAlert.parameterId && (
                          <div>
                            <span className="font-medium">Parameter:</span>{" "}
                            {asset.ParameterData.find(
                              (p) =>
                                String(p._id) ===
                                String(asset.latestAlert?.parameterId)
                            )?.Name || `ID: ${asset.latestAlert.parameterId}`}
                          </div>
                        )}
                        {asset.latestAlert.value !== undefined && (
                          <div>
                            <span className="font-medium">Value:</span>{" "}
                            {asset.latestAlert.value}
                          </div>
                        )}
                        {asset.latestAlert.threshold !== undefined && (
                          <div>
                            <span className="font-medium">Threshold:</span>{" "}
                            {asset.latestAlert.threshold}
                          </div>
                        )}
                        {asset.latestAlert.category !== undefined && (
                          <div>
                            <span className="font-medium">Category:</span>{" "}
                            {asset.latestAlert.category === 1
                              ? "Info"
                              : asset.latestAlert.category === 2
                              ? "Warning"
                              : asset.latestAlert.category === 3
                              ? "Alert"
                              : "Unknown"}
                          </div>
                        )}
                        <div>
                          <span className="font-medium">Time:</span>{" "}
                          {formatInTimeZone(
                            asset.latestAlert.time,
                            asset.TimeZone || "UTC",
                            "dd MMM yyyy HH:mm:ss zzz"
                          )}
                        </div>
                      </div>
                      {/* Arrow pointing down */}
                      <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1 min-w-0 flex-wrap">
                  <span
                    className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-slate-100 text-slate-600 mr-1 relative group cursor-pointer"
                    aria-label="Last Updated"
                  >
                    <ClockIcon className="w-3.5 h-3.5" />
                    {(() => {
                      const lastUpdateTime = asset.ParameterData.reduce(
                        (latest, param) => {
                          const t = param.lastActValue?.ValueReceivedDate || 0;
                          return t > latest ? t : latest;
                        },
                        0
                      );
                      return lastUpdateTime ? (
                        <div className="invisible group-hover:visible absolute bottom-full left-0 mb-2 w-max max-w-xs bg-gray-900 text-white text-xs rounded-lg px-2 py-1.5 shadow-lg z-50 pointer-events-none whitespace-nowrap">
                          <div className="font-medium text-white">
                            Updated{" "}
                            {formatDistanceToNow(lastUpdateTime, {
                              addSuffix: true,
                            })}
                          </div>
                          <div className="text-[11px] text-slate-300">
                            {formatInTimeZone(
                              lastUpdateTime,
                              asset.TimeZone || "UTC",
                              "dd MMM yyyy HH:mm:ss zzz"
                            )}
                          </div>
                          <div className="absolute top-full left-3 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
                        </div>
                      ) : null;
                    })()}
                  </span>
                  <span className="font-medium text-slate-700">
                    Last Updated:
                  </span>
                  <span className="truncate text-[10px] text-slate-500 min-w-0 max-w-[120px] xs:max-w-[160px]">
                    {(() => {
                      const lastUpdateTime = asset.ParameterData.reduce(
                        (latest, param) => {
                          const t = param.lastActValue?.ValueReceivedDate || 0;
                          return t > latest ? t : latest;
                        },
                        0
                      );
                      return lastUpdateTime
                        ? formatInTimeZone(
                            lastUpdateTime,
                            asset.TimeZone || "UTC",
                            "dd MMM yyyy HH:mm:ss zzz"
                          )
                        : "--";
                    })()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 pl-3 pr-1 flex-shrink-0 mt-2 xs:mt-0">
                <button
                  title="Go to Realtime"
                  className="text-green-500 hover:text-green-700 mx-1"
                  onClick={handleRealtimeClick}
                >
                  <ClockIcon className="w-5 h-5" />
                </button>
                <button
                  title="Go to Historical"
                  className="text-blue-500 hover:text-blue-700 mx-1"
                  onClick={handleHistoricalClick}
                >
                  <CalendarDaysIcon className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="bg-white rounded-xl shadow-lg p-12">
          <div className="text-center">
            <div className="text-gray-400 text-6xl mb-4">📊</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No Parameters Available
            </h3>
            <p className="text-gray-600">
              No real-time data found for this device
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default LcdCard;
