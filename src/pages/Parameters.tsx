import { useState, useEffect } from "react";
import AssetTypeDropdown from "../components/AssetTypeDropdown";
import { useUserAsset } from "../hooks/useUserAsset";
import { useParametersByAssetType } from "../hooks/useParametersByAssetType";
import axiosInstance from "../api/axiosInstance";
import { ENDPOINTS } from "../api/endpoints";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CustomSpinner from "../components/CustomSpinner";

export default function Parameters() {
  const userId = localStorage.getItem("userId");
  const { assets } = useUserAsset(userId ?? undefined);
  // Use assets returned by useUserAsset. We'll show AssetName (device name) in the dropdown
  // and set `selectedAssetType` to the asset's AssetTypeId so parameters are fetched by asset type.
  const assetsList = assets || [];
  // Track selected asset type id for parameter queries
  const [selectedAssetType, setSelectedAssetType] = useState<number | null>(
    null
  );
  // Track the selected device name for the dropdown display (decoupled from type)
  const [selectedDeviceName, setSelectedDeviceName] = useState<string>("");
  // Set first asset type as default when assetTypes load
  useEffect(() => {
    if (assetsList.length > 0 && selectedAssetType == null) {
      setSelectedAssetType(assetsList[0].AssetTypeId);
      setSelectedDeviceName(assetsList[0].AssetName);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assets]);

  // Pass userId to the hook
  const { parameters, loading: paramsLoading } = useParametersByAssetType(
    selectedAssetType,
    userId
  );

  // Track toggles for each parameter (_id)
  const [toggles, setToggles] = useState<{ [id: string]: boolean }>({});

  // Ordered parameters for drag-and-drop
  const [orderedParams, setOrderedParams] =
    useState<typeof parameters>(parameters);

  // Track currently dragging item id
  const [draggingId, setDraggingId] = useState<string | null>(null);
  // Track whether any card is being dragged so we can dim others
  const isAnyDragging = !!draggingId;
  // Track current drag-over target for visual highlight
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  // Loading state for server-provided sequence
  const [sequenceLoading, setSequenceLoading] = useState<boolean>(false);

  // Remove edit mode state and original toggles

  useEffect(() => {
    document.title = "Parameters";
  }, []);

  // If there are many parameters, switch to a two-column responsive grid
  const useTwoColumns =
    Array.isArray(orderedParams) && orderedParams.length > 4;

  // Initialize toggles from parameters/config when parameters change
  // Re-initialize toggles when asset type or parameters list changes
  useEffect(() => {
    if (Array.isArray(parameters) && parameters.length > 0) {
      const initialToggles: { [id: string]: boolean } = {};
      parameters.forEach((param) => {
        initialToggles[param.parameterDetails._id] = !!param.config;
      });
      // Apply device-specific overrides (per-asset) so machines with the same type can differ
      try {
        const assetObj =
          assetsList.find((a) => a.AssetName === selectedDeviceName) ||
          assetsList.find((a) => a.AssetTypeId === selectedAssetType);
        const assetId =
          assetObj?.AssetId || assetObj?.AssetName || String(selectedAssetType);
        if (assetId) {
          const ovKey = `lcd_overrides:${userId}:${assetId}`;
          const ovRaw = localStorage.getItem(ovKey);
          if (ovRaw) {
            const overrides = JSON.parse(ovRaw) as Record<string, boolean>;
            Object.keys(overrides).forEach((pid) => {
              initialToggles[pid] = overrides[pid];
            });
          }
        }
      } catch (e) {
        // ignore parsing errors and continue with server-provided toggles
      }
      setToggles(initialToggles);
      // initialize orderedParams when parameters change
      // Try to fetch saved order from server via AssetId; fall back to localStorage and then to default order
      const restoreOrdering = async () => {
        try {
          setSequenceLoading(true);
          const assetObj =
            assetsList.find((a) => a.AssetName === selectedDeviceName) ||
            assetsList.find((a) => a.AssetTypeId === selectedAssetType);
          const assetId =
            assetObj?.AssetId ||
            assetObj?.AssetName ||
            String(selectedAssetType);

          let ids: string[] = [];

          // try server first
          if (assetId) {
            try {
              const resp = await axiosInstance.get(
                `${ENDPOINTS.PARAM_SEQUENCE_GET}${encodeURIComponent(assetId)}`
              );
              // expected shape: { msg: 'success', data: [ { parameterId: 437, sequence: 1 }, ... ] }
              const data: unknown = resp && resp.data;
              if (
                data &&
                typeof data === "object" &&
                Array.isArray((data as { data?: unknown }).data)
              ) {
                const arr = (data as { data: unknown }).data as unknown[];
                if (arr.length > 0) {
                  ids = arr
                    .map((x) => {
                      if (x && typeof x === "object") {
                        const rec = x as Record<string, unknown>;
                        // shape 1: { parameterId: 437 }
                        if ("parameterId" in rec && rec.parameterId != null) {
                          return String(rec.parameterId);
                        }
                        // shape 2: { parameterDetails: { _id: 437, Name: '...' } }
                        if (
                          "parameterDetails" in rec &&
                          rec.parameterDetails &&
                          typeof rec.parameterDetails === "object"
                        ) {
                          const pd = rec.parameterDetails as Record<
                            string,
                            unknown
                          >;
                          if ("_id" in pd && pd._id != null)
                            return String(pd._id);
                        }
                        // shape 3: direct _id on the item
                        if ("_id" in rec && rec._id != null)
                          return String(rec._id);
                      }
                      return null;
                    })
                    .filter((v): v is string => v !== null);
                }
              }
            } catch (err) {
              // server retrieval failed — will try localStorage next
              // use console.warn so it doesn't interrupt UX
              // eslint-disable-next-line no-console
              console.warn(
                "Failed to fetch parameter sequence from server, falling back to localStorage",
                err
              );
            }
          }

          // if no server-provided order, try localStorage (prefer per-asset key, fallback to old per-assetType key)
          if (ids.length === 0) {
            const perAssetKey = `parameters_order:${userId}:${assetId}`;
            const perTypeKey = `parameters_order:${userId}:${selectedAssetType}`;
            const saved =
              (assetId && localStorage.getItem(perAssetKey)) ||
              localStorage.getItem(perTypeKey);
            if (saved) {
              let parsed: unknown;
              try {
                parsed = JSON.parse(saved);
              } catch (e) {
                parsed = null;
              }
              if (Array.isArray(parsed)) {
                ids = parsed as string[];
              } else if (parsed && typeof parsed === "object") {
                const p = parsed as { parameters?: unknown };
                if (Array.isArray(p.parameters)) {
                  ids = (
                    p.parameters as Array<{ parameterId: string | number }>
                  ).map((x) => String(x.parameterId));
                }
              } else {
                try {
                  ids = JSON.parse(saved);
                } catch (e) {
                  ids = [];
                }
              }
            }
          }

          // Map current parameters by id for quick lookup
          const map = new Map(
            parameters.map((p) => [String(p.parameterDetails._id), p])
          );
          const ordered: typeof parameters = [] as unknown as typeof parameters;
          // push saved ids that still exist
          ids.forEach((id) => {
            const item = map.get(String(id));
            if (item) ordered.push(item);
            map.delete(String(id));
          });
          // append any new params that weren't in saved order
          for (const [, v] of map)
            ordered.push(v as (typeof parameters)[number]);
          setOrderedParams(ordered);
          // if (ids.length > 0) toast.info("Restored saved parameter order");
        } catch (err) {
          setOrderedParams(parameters);
        } finally {
          setSequenceLoading(false);
        }
      };

      // kick off async restore
      void restoreOrdering();
    } else {
      setOrderedParams([] as typeof parameters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedAssetType, selectedDeviceName, parameters]);

  // Save toggle change immediately
  const handleToggle = async (parameterId: string, newValue: boolean) => {
    if (!userId || !selectedAssetType) return;

    // Get the assetId for the currently selected device
    const assetObj =
      assetsList.find((a) => a.AssetName === selectedDeviceName) ||
      assetsList.find((a) => a.AssetTypeId === selectedAssetType);
    const assetId = assetObj?.AssetId;

    if (!assetId) {
      toast.error("No asset selected");
      return;
    }

    const entry = {
      userId,
      assetId, // Now using assetId as the primary identifier
      parameterId,
    };
    const body = newValue
      ? { insertData: [entry], removeData: [] }
      : { insertData: [], removeData: [entry] };
    // Optimistically update only the toggled parameter
    setToggles((t) => ({ ...t, [parameterId]: newValue }));
    // Persist a per-device override locally so machines with identical types can have different configs
    try {
      const assetObj =
        assetsList.find((a) => a.AssetName === selectedDeviceName) ||
        assetsList.find((a) => a.AssetTypeId === selectedAssetType);
      const assetId =
        assetObj?.AssetId || assetObj?.AssetName || String(selectedAssetType);
      if (assetId) {
        const ovKey = `lcd_overrides:${userId}:${assetId}`;
        const ovRaw = localStorage.getItem(ovKey);
        const overrides = ovRaw
          ? (JSON.parse(ovRaw) as Record<string, boolean>)
          : {};
        overrides[parameterId] = newValue;
        localStorage.setItem(ovKey, JSON.stringify(overrides));
      }
    } catch (e) {
      // ignore local override failures
    }
    try {
      await axiosInstance.post(ENDPOINTS.LCD_INSERT, body);
      toast.success("Parameter updated");
      // No refetch or reset needed; toggles already updated
    } catch (err) {
      // Revert toggle on error
      setToggles((t) => ({ ...t, [parameterId]: !newValue }));
      // revert local override as well
      try {
        const assetObj =
          assetsList.find((a) => a.AssetName === selectedDeviceName) ||
          assetsList.find((a) => a.AssetTypeId === selectedAssetType);
        const assetId =
          assetObj?.AssetId || assetObj?.AssetName || String(selectedAssetType);
        if (assetId) {
          const ovKey = `lcd_overrides:${userId}:${assetId}`;
          const ovRaw = localStorage.getItem(ovKey);
          const overrides = ovRaw
            ? (JSON.parse(ovRaw) as Record<string, boolean>)
            : {};
          overrides[parameterId] = !newValue;
          localStorage.setItem(ovKey, JSON.stringify(overrides));
        }
      } catch (_) {
        // ignore
      }
      toast.error("Failed to update parameter.");
      console.error(err);
    }
  };

  // Drag and drop handlers (HTML5 DnD)
  const handleDragStart = (
    e: React.DragEvent<HTMLDivElement>,
    paramId: string
  ) => {
    setDraggingId(paramId);
    e.dataTransfer.effectAllowed = "move";
    // store id in dataTransfer for legacy
    e.dataTransfer.setData("text/plain", paramId);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    setDragOverId(id);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>, id: string) => {
    e.preventDefault();
    // only clear if leaving the current target
    if (dragOverId === id) setDragOverId(null);
  };

  const handleDrop = async (
    e: React.DragEvent<HTMLDivElement>,
    targetParamId: string
  ) => {
    e.preventDefault();
    const sourceId = e.dataTransfer.getData("text/plain") || draggingId;
    if (!sourceId || sourceId === targetParamId) return;
    const srcIndex = orderedParams.findIndex(
      (p) => String(p.parameterDetails._id) === String(sourceId)
    );
    const destIndex = orderedParams.findIndex(
      (p) => String(p.parameterDetails._id) === String(targetParamId)
    );
    if (srcIndex === -1 || destIndex === -1) return;
    const newArr = [...(orderedParams || [])];
    const [moved] = newArr.splice(srcIndex, 1);
    newArr.splice(destIndex, 0, moved);
    setOrderedParams(newArr as typeof parameters);
    // persist new order to backend for this user+asset/device; also save locally as a backup
    try {
      if (userId && selectedAssetType) {
        const ids = newArr.map((p) => String(p.parameterDetails._id));
        const parameters = ids.map((id, idx) => {
          const maybeNum = Number(id);
          return {
            parameterId: Number.isNaN(maybeNum) ? id : maybeNum,
            sequence: idx + 1,
          };
        });

        // Prefer the backend-expected AssetId (device identifier). Fall back to AssetName or the selected id string.
        const assetObj =
          assetsList.find((a) => a.AssetName === selectedDeviceName) ||
          assetsList.find((a) => a.AssetTypeId === selectedAssetType);
        const assetId =
          assetObj?.AssetId || assetObj?.AssetName || String(selectedAssetType);

        // Save locally using per-asset key so order is remembered even if server is unavailable
        try {
          const localKey = `parameters_order:${userId}:${assetId}`;
          localStorage.setItem(localKey, JSON.stringify(ids));
        } catch (_) {
          // ignore localStorage failures
        }

        try {
          await axiosInstance.post(ENDPOINTS.PARAM_SEQUENCE_INSERT, {
            userId,
            assetId,
            parameters,
          });
          toast.success("Saved parameter order");
        } catch (err) {
          toast.error("Failed to save parameter order to server");
          console.error("Failed to persist parameter sequence:", err);
        }
      }
    } catch (err) {
      console.error("Failed to save parameter order:", err);
    }
    setDraggingId(null);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* dropdown moved into the parameter card below */}
        </div>
      </div>

      {/* parent card wrapper for the parameter list */}
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
                  Parameter Order Configuration
                </h2>
                {/* concise help: icon with tooltip to avoid extra on-screen text */}
                <button
                  type="button"
                  title="Drag the handle to rearrange the order of parameters. Toggle to enable or disable a parameter."
                  aria-label="Parameters help"
                  className="text-gray-400 hover:text-gray-600 focus:outline-none p-1 rounded"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M18 10A8 8 0 11 2 10a8 8 0 0116 0zm-9-3a1 1 0 10-2 0 1 1 0 002 0zM9 9a1 1 0 00-1 1v4a1 1 0 102 0v-4a1 1 0 00-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="w-full sm:w-auto sm:ml-4">
              <AssetTypeDropdown
                options={assetsList.map((a) => a.AssetName)}
                value={selectedDeviceName || ""}
                onChange={(name) => {
                  const found = assetsList.find((a) => a.AssetName === name);
                  if (found) {
                    setSelectedDeviceName(found.AssetName);
                    setSelectedAssetType(found.AssetTypeId);
                  } else {
                    setSelectedDeviceName(name);
                  }
                }}
              />
              {assetsList.length === 0 && (
                <div className="text-red-500 mt-2">No devices found.</div>
              )}
            </div>
          </div>
          {/* parameter list: single column by default; switches to two columns when many items */}
          <div
            className={`w-full ${
              useTwoColumns
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4"
                : "flex flex-col space-y-4"
            }`}
          >
            {paramsLoading || sequenceLoading ? (
              <CustomSpinner />
            ) : (
              Array.isArray(orderedParams) &&
              orderedParams.map((param, index) => {
                const id = String(param.parameterDetails._id);
                const isActive = !!toggles[id];
                const isDragging = draggingId === id;
                return (
                  <div
                    key={id}
                    draggable
                    onDragStart={(e) => handleDragStart(e, id)}
                    onDragOver={handleDragOver}
                    onDragEnter={(e) => handleDragEnter(e, id)}
                    onDragLeave={(e) => handleDragLeave(e, id)}
                    onDrop={(e) => {
                      handleDrop(e, id);
                      setDragOverId(null);
                    }}
                    onDragEnd={handleDragEnd}
                    aria-grabbed={isDragging}
                    className={`relative ${isDragging ? "z-50" : ""} ${
                      isAnyDragging && !isDragging
                        ? "opacity-60"
                        : "opacity-100"
                    } bg-gray-50 rounded-2xl p-4 shadow-sm border transition-transform duration-150 transform hover:shadow-lg hover:-translate-y-1 cursor-grab select-none ${
                      isActive ? "border-orange-200" : "border-gray-100"
                    } ${
                      isDragging
                        ? "scale-95 shadow-lg ring-2 ring-orange-300"
                        : ""
                    } ${
                      dragOverId === id
                        ? "ring-2 ring-orange-200 bg-orange-50"
                        : ""
                    }`}
                  >
                    <div className="flex items-start gap-4 sm:gap-6">
                      <div className="flex-shrink-0 flex items-center gap-3 text-gray-400">
                        <div className="bg-gray-100 text-gray-700 text-xs sm:text-sm font-semibold px-2 py-1 rounded-full min-w-[36px] text-center">
                          {index + 1}
                        </div>
                        <div className="h-10 w-10 sm:h-11 sm:w-11 flex items-center justify-center bg-gray-50 rounded-md border border-gray-100 hover:bg-gray-100 cursor-grab touch-manipulation">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5 text-gray-500"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path d="M7 6a1 1 0 11-2 0 1 1 0 012 0zm0 4a1 1 0 11-2 0 1 1 0 012 0zm0 4a1 1 0 11-2 0 1 1 0 012 0zM13 6a1 1 0 11-2 0 1 1 0 012 0zm0 4a1 1 0 11-2 0 1 1 0 012 0zm0 4a1 1 0 11-2 0 1 1 0 012 0z" />
                          </svg>
                        </div>
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0">
                            <div
                              className={`text-base sm:text-lg font-semibold truncate ${
                                isActive ? "text-orange-600" : "text-gray-800"
                              }`}
                            >
                              {param.parameterDetails.Name}
                            </div>
                            {/* optional secondary info removed to avoid mismatched property names */}
                          </div>

                          {/* Toggle */}
                          <div className="flex-shrink-0 ml-4">
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={isActive}
                                onChange={() => handleToggle(id, !isActive)}
                              />
                              <div className="w-12 h-7 sm:w-14 sm:h-8 bg-gray-300 rounded-full peer-focus:outline-none peer-checked:bg-orange-500 relative after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5 sm:peer-checked:after:translate-x-6"></div>
                            </label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Removed Edit/Save/Cancel buttons: toggles are now always enabled and auto-save */}

      <ToastContainer />
    </div>
  );
}
