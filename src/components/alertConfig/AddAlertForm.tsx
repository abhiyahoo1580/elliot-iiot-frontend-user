import React, { useEffect, useState } from "react";
import { alertServices } from "../../services/alertService";
// import EditAlertForm from "./EditAlert";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";

interface AddAlertFormProps {
  onClose: () => void;
}

const AddAlertForm: React.FC<AddAlertFormProps> = ({ onClose }) => {
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
  const [assetId, setAssetID] = useState<string>("");
  const [parameterId, setParameterId] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    AssetId: "",
    CompanyId: "",
    Parameter: "",
    RegisterId: "1",
    upperThresholdValue: "",
    lowerThresholdValue: "",
    upperThresholdWarning: "",
    lowerThresholdWarning: "",
    minAlertInterval: "0", // in minutes
  });

  useEffect(() => {
    const id = user?.userId || user?._id;
    if (id) {
      alertServices
        .getMeterName(String(id))
        .then((res: { data: DeviceTypeItem[] }) => {
          const allAssets = res.data.flatMap(
            (item: any) => item.assetDetails ?? [] // TODO: type assetDetails
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
        .then((res: { data: ParameterItem[] }) => {
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

    if (name === "ParameterName") {
      const selected = parameterList.find((p) => p.ParameterName === value);
      if (selected) {
        setParameterId(selected._id);
        setFormData((prev) => ({
          ...prev,
          Parameter: value,
          RegisterId: selected.RegisterId.toString(),
        }));
      } else {
        setFormData((prev) => ({
          ...prev,
          Parameter: value,
          RegisterId: "",
        }));
      }
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]:
          name.includes("Threshold") || name === "minAlertInterval"
            ? Number(value)
            : value,
      }));
    }
  };

  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    setAssetID(selectedId);
    localStorage.setItem("assetId", selectedId);

    const selectedAsset = machineName.find(
      (asset) => asset.AssetId === selectedId
    );

    if (selectedAsset) {
      setFormData((prev) => ({
        ...prev,
        AssetId: selectedAsset.AssetId,
      }));
    }
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
      const storedUserId = localStorage.getItem("userId");

      const payload = {
        userId: storedUserId,
        assetId: formData.AssetId,
        parameter: parameterId,
        registerId: Number(formData.RegisterId),
        upperThresholdValue: formData.upperThresholdValue || null,
        upperThresholdWarning: formData.upperThresholdWarning || null,
        lowerThresholdValue: formData.lowerThresholdValue || null,
        lowerThresholdWarning: formData.lowerThresholdWarning || null,
        frequency: Number(formData.minAlertInterval) || 0, // send as frequency
      };

      await alertServices.insertAlertConfig(payload);
      toast.success("Alert configuration saved successfully!");

      onClose(); // ✅ Close the modal after save
    } catch (error) {
      toast.error("Error saving alert configuration: " + String(error));
    }
  };

  const handleCancel = () => {
    onClose(); // ✅ Close the modal on cancel
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden">
      {/* Title section styled like admin Add Company */}
      <div className="bg-gradient-to-r from-[#ff6600] to-[#e65c00] text-white p-6 rounded-t-xl">
        <div className="flex flex-col items-start">
          <h2 className="text-2xl font-bold">Add Alert Configuration</h2>
          <p className="text-[#ffe0cc] mt-1">
            Create a new alert configuration for your device or parameter
          </p>
        </div>
      </div>
      <div className="p-6">
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Meter Name */}
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="AssetName"
              className="block text-sm font-medium text-gray-700"
            >
              Device Name
            </label>
            <select
              id="AssetName"
              name="AssetName"
              value={assetId}
              onChange={handleAssetChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Device</option>
              {machineName.map((asset) => (
                <option key={asset._id} value={asset.AssetId}>
                  {asset.AssetName}
                </option>
              ))}
            </select>
          </div>

          {/* Parameter Dropdown */}
          <div className="flex-1 min-w-[200px]">
            <label
              htmlFor="ParameterName"
              className="block text-sm font-medium text-gray-700"
            >
              Parameter
            </label>
            <select
              id="ParameterName"
              name="ParameterName"
              value={formData.Parameter}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Parameter</option>
              {parameterList.map((item, index) => (
                <option key={index} value={item.ParameterName}>
                  {item.ParameterName}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Threshold and Warning Inputs */}
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
          {/* Frequency Dropdown */}
          <div key="minAlertInterval">
            <label
              htmlFor="minAlertInterval"
              className="block text-sm font-medium text-gray-700 flex items-center gap-1"
            >
              Skip alerts for (minutes)
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
              id="minAlertInterval"
              name="minAlertInterval"
              value={formData.minAlertInterval}
              onChange={handleInputChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="0">All alerts</option>
              <option value="15">15 minutes</option>
              <option value="30">30 minutes</option>
              <option value="60">60 minutes</option>
              <option value="120">120 minutes</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex justify-end mt-6 gap-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 bg-white border border-gray-300 text-gray-800 rounded hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-[#FF6600] text-white rounded hover:bg-[#FF944D]"
          >
            Save Alert
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddAlertForm;
