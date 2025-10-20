import React, { useEffect, useState } from "react";
import { alertServices } from "../../services/alertService";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";

interface EditAlertFormProps {
  alertData: any;
  alertId: string;
  onClose: () => void;
}

const EditAlertForm: React.FC<EditAlertFormProps> = ({
  alertData,
  alertId,
  onClose,
}) => {
  const { user } = useAuth();

  interface DeviceTypeItem {
    _id: string;
    DeviceTypeName: string;
    AssetId: string;
    AssetName: string;
  }

  interface ParameterItem {
    ParameterName: string;
    _id: number;
    RegisterId: number;
  }

  const [parameterList, setParameterList] = useState<ParameterItem[]>([]);
  const [machineName, setMachineName] = useState<DeviceTypeItem[]>([]);
  const [assetId, setAssetID] = useState<string>(alertData.AssetId || "");
  const [parameterId, setParameterId] = useState<number | null>(
    alertData.ParameterId || null
  );

  const [formData, setFormData] = useState({
    upperThresholdValue: alertData.upperThresholdValue || "",
    lowerThresholdValue: alertData.lowerThresholdValue || "",
    upperThresholdWarning: alertData.upperThresholdWarning || "",
    lowerThresholdWarning: alertData.lowerThresholdWarning || "",
    frequency: alertData.frequency || "",
    RegisterId: alertData.RegisterId || null,
  });

  // Sync form state with alertData when editing
  useEffect(() => {
    // Try to map asset name to ID if only name is present
    let assetIdValue = alertData.AssetId || "";
    if (!assetIdValue && alertData.assetName && machineName.length > 0) {
      const found = machineName.find(
        (a) =>
          a.AssetName === alertData.assetName ||
          a.AssetName === alertData.assetName?.[0]
      );
      if (found) assetIdValue = found.AssetId;
    }

    // Try to map parameter name to ID if only name is present
    let parameterIdValue = alertData.ParameterId || null;
    if (
      (parameterIdValue === null || parameterIdValue === "") &&
      alertData.parameterName &&
      parameterList.length > 0
    ) {
      const found = parameterList.find(
        (p) =>
          p.ParameterName === alertData.parameterName ||
          p.ParameterName === alertData.parameterName?.[0]
      );
      if (found) parameterIdValue = found._id;
    }

    setAssetID(assetIdValue);
    setParameterId(parameterIdValue);
    setFormData({
      upperThresholdValue: alertData.upperThresholdValue || "",
      lowerThresholdValue: alertData.lowerThresholdValue || "",
      upperThresholdWarning: alertData.upperThresholdWarning || "",
      lowerThresholdWarning: alertData.lowerThresholdWarning || "",
      frequency: alertData.frequency || "",
      RegisterId: alertData.RegisterId || null,
    });
  }, [alertData, machineName, parameterList]);

  useEffect(() => {
    const id = user?.userId || user?._id;
    if (id) {
      alertServices
        .getMeterName(String(id))
        .then((res: any) => {
          const allAssets = res.data.flatMap(
            (item: any) => item.assetDetails ?? []
          );
          setMachineName(allAssets);
        })
        .catch((err) => {
          toast.error("Failed to fetch device types: " + String(err));
          setMachineName([]);
        });
    }
  }, [user]);

  useEffect(() => {
    if (assetId) {
      alertServices
        .getParameterName(assetId)
        .then((res: any) => {
          setParameterList(res.data ?? []);
        })
        .catch((err) => {
          toast.error("Failed to fetch parameters: " + String(err));
          setParameterList([]);
        });
    }
  }, [assetId]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "parameterId") {
      setParameterId(Number(value));
      // Set RegisterId from selected parameter
      const selected = parameterList.find((p) => p._id === Number(value));
      if (selected) {
        setFormData((prev) => ({
          ...prev,
          RegisterId: selected.RegisterId,
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          value === ""
            ? ""
            : name.includes("Threshold") || name === "frequency"
            ? Number(value)
            : value,
      }));
    }
  };

  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setAssetID(selectedId);
    localStorage.setItem("assetId", selectedId);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLButtonElement>) => {
    event.preventDefault();

    // Validation: at least one threshold/warning must be filled
    const hasAnyValue = [
      formData.upperThresholdValue,
      formData.lowerThresholdValue,
      formData.upperThresholdWarning,
      formData.lowerThresholdWarning,
    ].some(
      (v) =>
        v !== "" &&
        v !== null &&
        v !== undefined &&
        !isNaN(Number(v)) &&
        Number(v) !== 0
    );
    if (!hasAnyValue) {
      toast.error("Please enter at least one threshold or warning value.");
      return;
    }

    try {
      // Find selected parameter to get RegisterId
      const selected = parameterList.find((p) => p._id === parameterId);
      const payload = {
        ...formData,
        assetId,
        parameterId,
        RegisterId: selected ? selected.RegisterId : formData.RegisterId,
        frequency: Number(formData.frequency) || 0,
      };

      await alertServices.updateAlertConfig(alertId, payload);
      toast.success("Alert configuration updated successfully!");

      onClose();
    } catch (error) {
      toast.error("Error updating alert configuration: " + String(error));
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden">
      {/* Title section styled like AddAlertForm and admin Add Company */}
      <div className="bg-gradient-to-r from-[#ff6600] to-[#e65c00] text-white p-6 rounded-t-xl">
        <div className="flex flex-col items-start">
          <h2 className="text-2xl font-bold">Edit Alert Configuration</h2>
          <p className="text-[#ffe0cc] mt-1">
            Update the alert configuration for your device or parameter
          </p>
        </div>
      </div>
      <div className="p-6">
        <div className="flex flex-wrap gap-4 mb-4">
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="AssetName"
              className="block text-sm font-medium text-gray-700"
            >
              Meter Name
            </label>
            <select
              id="AssetName"
              name="AssetName"
              value={assetId}
              onChange={handleAssetChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              disabled
            >
              <option value="">Select Meter</option>
              {machineName.map((asset) => (
                <option key={asset._id} value={asset.AssetId}>
                  {asset.AssetName}
                </option>
              ))}
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="parameterId"
              className="block text-sm font-medium text-gray-700"
            >
              Parameter
            </label>
            <select
              id="parameterId"
              name="parameterId"
              value={parameterId ?? ""}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md bg-gray-100 cursor-not-allowed"
              disabled
            >
              <option value="">Select Parameter</option>
              {parameterList.map((item) => (
                <option key={item._id} value={item._id}>
                  {item.ParameterName}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {[
            "upperThresholdValue",
            "lowerThresholdValue",
            "upperThresholdWarning",
            "lowerThresholdWarning",
          ].map((field) => (
            <div key={field}>
              <label
                htmlFor={field}
                className="block text-sm font-medium text-gray-700"
              >
                {field
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^\w/, (c) => c.toUpperCase())}
              </label>
              <input
                type="number"
                name={field}
                value={
                  formData[field as keyof typeof formData] as number | string
                }
                onChange={handleInputChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
              />
            </div>
          ))}
          {/* Minimum Alert Interval */}
          {/* Frequency Dropdown */}
          <div key="frequency">
            <label
              htmlFor="frequency"
              className="text-sm font-medium text-gray-700 flex items-center gap-1"
            >
              Alert Frequency
              <span className="relative group cursor-pointer">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4 text-gray-400 ml-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <circle
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="white"
                  />
                  <text
                    x="12"
                    y="16"
                    textAnchor="middle"
                    fontSize="12"
                    fill="currentColor"
                  >
                    i
                  </text>
                </svg>
                <span className="absolute left-1/2 -translate-x-1/2 mt-2 w-64 bg-gray-800 text-white text-xs rounded p-2 opacity-0 group-hover:opacity-100 pointer-events-none z-10 transition-opacity duration-200">
                  The &quot;Interval&quot; (frequency) determines how often an
                  alert can be triggered for the same condition, helping to
                  prevent repeated notifications within a short period.
                </span>
              </span>
            </label>
            <select
              id="frequency"
              name="frequency"
              value={formData.frequency}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="0">All</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
              <option value="120">120 minutes</option>
            </select>
          </div>
        </div>

        <div className="flex justify-end mt-6 gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-white text-black rounded hover:bg-gray-100 border border-gray-300"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#FF6600] text-white rounded hover:bg-[#FF944D]"
          >
            Update Alert
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditAlertForm;
