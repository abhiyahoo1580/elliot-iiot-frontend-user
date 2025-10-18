import { useEffect, useState } from "react";
import LcdCard from "../components/LcdCard";
import CustomSpinner from "../components/CustomSpinner";
import { useAuth } from "../hooks/useAuth";
import { userService } from "../services/userService";

// ========== COMMENTED OUT: Unused imports - Not needed with LCD API ==========
// import AssetTypeDropdown from "../components/AssetTypeDropdown";
// import { useActivity } from "../hooks/useActivity";
// import { useDashboardDrop } from "../hooks/useDashboardDrop";
// import { useFullUser } from "../hooks/useFullUser";
// import { useMultiDeviceRealtime } from "../hooks/useMultiDeviceRealtime";
// import {
//   ParameterItem,
//   useParametersByAssetType,
// } from "../hooks/useParametersByAssetType";
// import { useUserAsset } from "../hooks/useUserAsset";
// import { DeviceList, FullUser } from "../types/user.types";

// interface Activity {
//   name: string;
//   startTime: string;
//   stopTime: string;
//   alert: string;
//   type?: string;
// }

interface LcdDeviceData {
  _id: string;
  AssetId: string;
  AssetName: string;
  Gateway: string;
  status: boolean;
  SlaveId: number;
  AssetTypeId: number;
  TimeZone?: string;
  ParameterData: Array<{
    _id: number;
    Name: string;
    sequence: number;
    RegisterAddress?: string | number;
    LowerThresholdValue?: number;
    UpperThresholdValue?: number;
    LowerThresholdWarning?: number;
    UpperThresholdWarning?: number;
    lastActValue?: {
      ActValue: number | string | null;
      ValueReceivedDate?: number | null;
    };
  }>;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const userId = user?._id ?? "";

  // ========== COMMENTED OUT: No longer needed, using LCD API instead ==========
  // const {
  //   activities,
  //   loading: activityLoading,
  //   error: activityError,
  // } = useActivity(userId);
  // const { user: fullUser } = useFullUser(userId);
  // const [userWithParams, setUserWithParams] = useState<FullUser | null>(null);
  // const [devicesData, setDeviceData] = useState<DeviceList[]>([]);
  // const { assets } = useUserAsset(userId);
  // const { data: data_drop } = useDashboardDrop(userId);
  // const [active, setActive] = useState<string | number>("...");
  // const [inactive, setInactive] = useState<string | number>("...");
  // const [all, setAll] = useState<string | number>("...");
  // const [selectedAssetType, setSelectedAssetType] = useState<string>("");
  // const [selectedAssetTypeId, setSelectedAssetTypeId] = useState<number>();
  // const [combinedParameters, setCombinedParameters] = useState<ParameterItem[]>(
  //   []
  // );
  // const topics = useMemo(
  //   () => assets.map((asset) => `${asset.Gateway}/${asset.SlaveId}`),
  //   [assets]
  // );
  // const { data: wsData, isConnected } = useMultiDeviceRealtime(topics);
  // const isAllTypes = selectedAssetType === "";
  // const assetTypeIds = useMemo(
  //   () =>
  //     Array.from(
  //       new Set(
  //         assets
  //           ?.filter((asset) => asset.AssetTypeId)
  //           .map((asset) => asset.AssetTypeId) ?? []
  //       )
  //     ),
  //   [assets]
  // );
  // const { parameters } = useParametersByAssetType(
  //   isAllTypes ? null : selectedAssetTypeId ?? null,
  //   userId
  // );
  // ========== END COMMENTED OUT ==========

  // LCD data state - fetch once for all devices (ONLY API CALL NEEDED)
  const [lcdDevices, setLcdDevices] = useState<LcdDeviceData[]>([]);
  const [lcdLoading, setLcdLoading] = useState<boolean>(true);
  const [lcdError, setLcdError] = useState<string | null>(null);

  // ========== COMMENTED OUT: fetchAllParameters - Not needed with LCD API ==========
  // useEffect(() => {
  //   async function fetchAllParameters() {
  //     if (!isAllTypes || !userId || assetTypeIds.length === 0) {
  //       setCombinedParameters([]);
  //       return;
  //     }
  //     try {
  //       const allParams = await Promise.all(
  //         assetTypeIds.map((id) =>
  //           userService.getParametersByAssetType(id, userId)
  //         )
  //       );
  //       const flattened = allParams.flatMap((res) => res?.data ?? []);
  //       const unique = Array.from(
  //         new Map(flattened.map((p) => [p.parameterDetails._id, p])).values()
  //       );
  //       setCombinedParameters(unique);
  //     } catch (err) {
  //       console.error("Failed to fetch all parameters:", err);
  //       setCombinedParameters([]);
  //     }
  //   }
  //   fetchAllParameters();
  // }, [isAllTypes, assetTypeIds, userId]);

  useEffect(() => {
    document.title = "Dashboard";
  }, []);

  // Fetch LCD data once for all devices
  useEffect(() => {
    async function fetchLcdData() {
      if (!userId) return;

      try {
        setLcdLoading(true);
        setLcdError(null);
        const companyId = Number(localStorage.getItem("companyId")) || 78;
        const response = await userService.getLcdData(
          userId,
          companyId,
          Date.now()
        );

        if (response && response.data) {
          setLcdDevices(response.data);
        } else {
          setLcdDevices([]);
        }
      } catch (err: unknown) {
        console.error("Failed to fetch LCD data:", err);
        const errorMessage =
          err instanceof Error ? err.message : "Failed to load LCD data";
        setLcdError(errorMessage);
        setLcdDevices([]);
      } finally {
        setLcdLoading(false);
      }
    }

    fetchLcdData();
  }, [userId]);

  // ========== COMMENTED OUT: Dashboard drop data - Not needed with LCD API ==========
  // useEffect(() => {
  //   if (data_drop && Array.isArray(data_drop) && data_drop[0]) {
  //     setActive(data_drop[0].active ?? 0);
  //     setInactive(data_drop[0].inActive ?? 0);
  //     setAll((data_drop[0].active ?? 0) + (data_drop[0].inActive ?? 0));
  //   } else {
  //     setActive("...");
  //     setInactive("...");
  //     setAll("...");
  //   }
  // }, [data_drop]);

  // ========== COMMENTED OUT: Filter devices by type - Not needed with LCD API ==========
  // useEffect(() => {
  //   if (!devicesData || devicesData.length === 0) return;
  //   let filtered = devicesData;
  //   if (selectedAssetType) {
  //     filtered = filtered.filter(
  //       (device) => device.deviceType === selectedAssetType
  //     );
  //   }
  //   const activeCount = filtered.filter(
  //     (device) => device.status === "Active"
  //   ).length;
  //   const inactiveCount = filtered.filter(
  //     (device) => device.status === "Inactive"
  //   ).length;
  //   const allCount = filtered.length;

  //   if (!selectedAssetType) {
  //     if (data_drop && Array.isArray(data_drop) && data_drop[0]) {
  //       setActive(data_drop[0].active ?? 0);
  //       setInactive(data_drop[0].inActive ?? 0);
  //       setAll((data_drop[0].active ?? 0) + (data_drop[0].inActive ?? 0));
  //     } else {
  //       setActive(activeCount);
  //       setInactive(inactiveCount);
  //       setAll(allCount);
  //     }
  //   } else {
  //     setActive(activeCount);
  //     setInactive(inactiveCount);
  //     setAll(allCount);
  //   }
  // }, [selectedAssetType, devicesData, data_drop]);

  // ========== COMMENTED OUT: Map assets to devices - Not needed with LCD API ==========
  // useEffect(() => {
  //   if (assets && assets.length > 0) {
  //     const mappedDevices: DeviceList[] = assets.map((asset) => ({
  //       name: asset.AssetName,
  //       status: asset.status ? "Active" : "Inactive",
  //       onboardingDate: new Date(asset.InstallationDate),
  //       deviceType: asset.AssetType,
  //     }));
  //     setDeviceData(mappedDevices);
  //   } else {
  //     setDeviceData([]);
  //   }
  // }, [assets]);

  // ========== COMMENTED OUT: User parameters sync - Not needed with LCD API ==========
  // useEffect(() => {
  //   if (fullUser) {
  //     setUserWithParams({ ...fullUser, Parameter: parameters });
  //   }
  // }, [fullUser, parameters]);

  // ========== COMMENTED OUT: Card info fetch - Not needed with LCD API ==========
  // const [cardInfo, setCardInfo] = useState<{
  //   toatlAlert: number;
  //   totalDevice: number;
  //   threeDaysOfflineDevice: number;
  // } | null>(null);

  // useEffect(() => {
  //   if (userId) {
  //     userService
  //       .getCards(userId)
  //       .then((res) => setCardInfo(res.data))
  //       .catch((err) => {
  //         setCardInfo(null);
  //         console.error("Failed to fetch card info:", err);
  //       });
  //   }
  // }, [userId]);

  // ========== COMMENTED OUT: WebSocket device count - Not needed with LCD API ==========
  // useEffect(() => {
  //   if (!wsData || Object.keys(wsData).length === 0) return;
  //   const totalDevices = assets.length;
  //   const activeDevices = assets.filter((asset) => asset.status).length;
  //   const offlineDevices = totalDevices - activeDevices;
  //   setCardInfo((prev) => ({
  //     ...prev,
  //     totalDevice: totalDevices,
  //     threeDaysOfflineDevice: offlineDevices,
  //     toatlAlert: prev?.toatlAlert || 0,
  //   }));
  // }, [wsData, assets]);

  // ========== COMMENTED OUT: All remaining unused code - Not needed with LCD API ==========
  // const formatDate = (dateStr: string | Date) => {
  //   const date = new Date(dateStr);
  //   const day = String(date.getDate()).padStart(2, "0");
  //   const month = date.toLocaleString("en-GB", { month: "short" });
  //   const year = date.getFullYear();
  //   return `${day} ${month} ${year}`;
  // };

  // const formatDateWithMonthName = (dateStr: string | Date) => {
  //   const date = new Date(dateStr);
  //   const day = String(date.getDate()).padStart(2, "0");
  //   const month = date.toLocaleString("en-GB", { month: "short" });
  //   const year = date.getFullYear();
  //   const time = date.toLocaleTimeString("en-GB", {
  //     hour: "2-digit",
  //     minute: "2-digit",
  //   });
  //   return `${day} ${month} ${year} ${time}`;
  // };

  // const formatActivityDate = (ts: string) => {
  //   if (!ts) return "";
  //   const date = new Date(Number(ts));
  //   return date.toLocaleString("en-US", {
  //     month: "short",
  //     day: "numeric",
  //     hour: "2-digit",
  //     minute: "2-digit",
  //     hour12: false,
  //   });
  // };

  // const [selectedDate, setSelectedDate] = useState<string>("");
  // const [searchTerm, setSearchTerm] = useState<string>("");
  // const [selectedParameter, setSelectedParameter] =
  //   useState<string>("PF (Total)");
  // const [selectedFilter, setSelectedFilter] = useState<string>("all");
  // const [openDeviceId, setOpenDeviceId] = useState<number | null>(null);

  // useEffect(() => {
  //   if (fullUser?.registeredOn) {
  //     const start = formatDate(fullUser.registeredOn);
  //     const end = formatDate(new Date());
  //     setSelectedDate(`${start} - ${end}`);
  //   }
  // }, [fullUser]);

  // const filteredDevicesData = useMemo(() => {
  //   let filtered = devicesData ?? [];
  //   if (selectedAssetType) {
  //     filtered = filtered.filter(
  //       (device) => device.deviceType === selectedAssetType
  //     );
  //   }
  //   if (selectedFilter === "active") {
  //     filtered = filtered.filter((device) => device.status === "Active");
  //   } else if (selectedFilter === "inactive") {
  //     filtered = filtered.filter((device) => device.status === "Inactive");
  //   }
  //   if (searchTerm.trim() !== "") {
  //     const lower = searchTerm.toLowerCase();
  //     filtered = filtered.filter((device) =>
  //       device.name.toLowerCase().includes(lower)
  //     );
  //   }
  //   return filtered;
  // }, [devicesData, selectedAssetType, selectedFilter, searchTerm]);

  // const assetTypeOptions = useMemo(
  //   () => [
  //     "All Types",
  //     ...Array.from(
  //       new Set(assets?.map((asset) => asset.AssetType).filter(Boolean) ?? [])
  //     ),
  //   ],
  //   [assets]
  // );

  return (
    <div className="p-2 sm:p-4 bg-gray-100 mt-6">
      <div className="w-full mb-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 justify-items-center items-stretch">
        {lcdLoading ? (
          <div className="col-span-4 flex justify-center items-center w-full min-h-[300px]">
            <CustomSpinner />
          </div>
        ) : lcdError ? (
          <div className="bg-white rounded-xl shadow-lg p-12 mb-10 flex flex-col items-center justify-center w-full min-h-[300px] col-span-4">
            <div className="text-center">
              <div className="text-red-400 text-6xl mb-4">⚠️</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Failed to Load Devices
              </h3>
              <p className="text-gray-600">{lcdError}</p>
            </div>
          </div>
        ) : lcdDevices.length === 0 ? (
          <div className="bg-white rounded-xl shadow-lg p-12 mb-10 flex flex-col items-center justify-center w-full min-h-[300px] col-span-4">
            <div className="text-center">
              <div className="text-gray-400 text-6xl mb-4">📊</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Devices Available
              </h3>
              <p className="text-gray-600">No devices found for this user</p>
            </div>
          </div>
        ) : (
          lcdDevices.map((deviceData) => (
            <LcdCard
              key={deviceData._id}
              deviceData={deviceData}
              size="md"
              className="w-full"
            />
          ))
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 items-start">
        {/* <div className="grid grid-cols-1 gap-4">
          <div className="grid grid-cols-2 gap-4 overflow-hidden">
            <div className="bg-white p-4 rounded-lg h-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-[#F05024] text-xl">📱</span>
                  <span className="text-sm text-gray-600">All Devices</span>
                </div>
                <span className="text-2xl font-semibold">
                  {cardInfo ? cardInfo.totalDevice : "--"}
                </span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg h-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 text-xl">⚡</span>
                  <span className="text-sm text-gray-600">
                    Monthly Consumption
                  </span>
                </div>
                <span className="text-2xl font-semibold">{"--"}</span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg flex flex-col justify-start h-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-red-500 text-xl">⚠️</span>
                  <span className="text-sm text-gray-600">Monthly Alerts</span>
                </div>
                <span className="text-2xl font-semibold text-red-500">
                  {cardInfo ? cardInfo.toatlAlert : "--"}
                </span>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg flex flex-col justify-start h-auto">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-gray-700 text-xl">💻</span>
                  <span className="text-sm text-gray-600">
                    Offline ≥ 3 days
                  </span>
                </div>
                <span className="text-2xl font-semibold">
                  {cardInfo ? cardInfo.threeDaysOfflineDevice : "--"}
                </span>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            <h3 className="font-medium mb-4">Last Activity</h3>
            <div className="overflow-x-auto">
              {activityLoading ? (
                <div className="p-4 text-gray-500">Loading...</div>
              ) : activityError ? (
                <div className="p-4 text-red-500">{activityError}</div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 text-gray-600">NAME</th>
                      <th className="text-left p-3 text-gray-600">DATE</th>
                      <th className="text-left p-3 text-gray-600">TYPE</th>
                      <th className="text-left p-3 text-gray-600">ALERT</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activities.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="p-4 text-gray-500 text-center"
                        >
                          No activity found.
                        </td>
                      </tr>
                    ) : (
                      activities.map((activity, idx) => (
                        <tr key={idx} className="border-b">
                          <td className="p-3">{activity.name}</td>
                          <td className="p-3">
                            {formatActivityDate(activity.startTime)}
                          </td>
                          <td className="p-3">{activity.type || "--"}</td>
                          <td className="p-3">{activity.alert}</td>
                        </tr>
                      ))
                    );
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div> */}
        {/* <div className="grid grid-cols-1 gap-4 items-start">
          <div className="flex flex-col">
            <div className="bg-white rounded-lg p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-center gap-2 pl-2 pr-2">
                <h3 className="font-medium">Devices List</h3>
                <input
                  type="text"
                  placeholder="Search"
                  className="flex-1 px-4 py-2 border rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
                <div className="flex-1">
                  <AssetTypeDropdown
                    options={assetTypeOptions}
                    value={selectedAssetType}
                    onChange={(type) => {
                      setSelectedAssetType(type === "All Types" ? "" : type);
                      assets.forEach((asset) => {
                        if (asset.AssetType === type) {
                          setSelectedAssetTypeId(asset.AssetTypeId);
                        }
                      });
                    }}
                  />
                </div>
              </div>
              <div>
                <div className="bg-white rounded-lg p-4 pl-2 pr-2">
                  <div className="flex flex-col space-y-4">
                    <div className="bg-gray-100 p-1 rounded-lg flex">
                      <button
                        className={`flex-1 py-2 rounded-lg transition-colors ${
                          selectedFilter === "active"
                            ? "bg-[#FF6600] text-white"
                            : "hover:bg-[#FF944D]"
                        }`}
                        onClick={() => setSelectedFilter("active")}
                      >
                        Active {active}
                      </button>
                      <button
                        className={`flex-1 py-2 rounded-lg transition-colors ${
                          selectedFilter === "inactive"
                            ? "bg-[#FF6600] text-white"
                            : "hover:bg-[#FF944D]"
                        }`}
                        onClick={() => setSelectedFilter("inactive")}
                      >
                        Inactive {inactive}
                      </button>
                      <button
                        className={`flex-1 py-2 rounded-lg transition-colors ${
                          selectedFilter === "all"
                            ? "bg-[#FF6600] text-white"
                            : "hover:bg-[#FF944D]"
                        }`}
                        onClick={() => setSelectedFilter("all")}
                      >
                        All {all}
                      </button>
                    </div>
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <tbody>
                      {filteredDevicesData.map((device, index) => [
                        <tr
                          key={`${device.name}-${index}-main`}
                          className="border-b hover:bg-gray-50"
                        >
                          <td className="p-4">
                            <div>
                              <h4 className="font-medium">{device.name}</h4>
                              <div className="mt-2 space-y-1"></div>
                            </div>
                          </td>
                          <td className="p-3">
                            <span
                              className={`px-2 py-1 rounded ${
                                device.status === "Active"
                                  ? "bg-green-100 text-green-600"
                                  : "bg-red-100 text-red-600"
                              }`}
                            >
                              {device.status}
                            </span>
                          </td>
                          <td className="p-3 text-gray-500">
                            {formatDateWithMonthName(device.onboardingDate)}
                          </td>
                          <td className="p-3">
                            <button
                              onClick={() =>
                                setOpenDeviceId(
                                  openDeviceId === index ? null : index
                                )
                              }
                              className="text-gray-600"
                            >
                              👁️
                            </button>
                          </td>
                        </tr>,
                        openDeviceId === index && (
                          <tr key={`${device.name}-${index}-details`}>
                            <td colSpan={5} className="p-4">
                              <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <p className="text-sm font-medium">
                                      Device Details
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Status: {device.status}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Onboarding:{" "}
                                      {`${formatDate(
                                        device.onboardingDate
                                      ).replace(/\//g, "-")} ${new Date(
                                        device.onboardingDate
                                      ).toLocaleTimeString("en-GB", {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}`}
                                    </p>
                                  </div>
                                  <div>
                                    <p className="text-sm font-medium">
                                      Usage Statistics
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Daily Consumption: 39450
                                    </p>
                                    <p className="text-sm text-gray-600">
                                      Monthly Average: 95452
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </td>
                          </tr>
                        ),
                      ])}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-white rounded-lg p-4">
            {(isAllTypes ? combinedParameters : parameters).length > 0 && (
              <div>
                <h3 className="font-medium mb-3">Parameter</h3>
                <div className="flex flex-wrap gap-3">
                  {(isAllTypes ? combinedParameters : parameters)
                    .slice(0, 10)
                    .map((param, idx) => (
                      <div
                        key={idx}
                        className={`px-4 py-2 rounded-lg border text-center bg-${
                          param.config ? "[#FF6600]" : "100"
                        } text-${
                          param.config ? "white" : "[#F05024]"
                        } border-orange-200 whitespace-nowrap`}
                      >
                        {param.parameterDetails.Name}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div> */}
      </div>
    </div>
  );
}
