import React, { useEffect, useState } from "react";
import { alertServices } from "../../services/alertService";
import { graphServices } from "../../services/graphService";
import { toast } from "react-toastify";
import { useAuth } from "../../hooks/useAuth";

interface AddGroupProps {
  onClose: () => void;
}

const AddGroup: React.FC<AddGroupProps> = ({ onClose }) => {
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
  }

  const [deviceName, setDeviceName] = useState<DeviceTypeItem[]>([]);
  const [parameterList, setParameterList] = useState<ParameterItem[]>([]);
  const [assetId, setAssetID] = useState<string>("");
  const [groupName, setGroupName] = useState<string>("");

  const [formData, setFormData] = useState({
    AssetId: "",
    Parameter: [] as number[],
  });

  // Fetch device list
  useEffect(() => {
    const id = user?.userId || user?._id;
    if (id) {
      alertServices
        .getMeterName(String(id))
        .then((res: any) => {
          const allAssets = res.data.flatMap(
            (item: any) => item.assetDetails ?? []
          );
          setDeviceName(allAssets);
        })
        .catch((err) => {
          toast.error("Failed to fetch device types:", err);
          setDeviceName([]);
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
          toast.error("Failed to fetch parameters:", err);
          setParameterList([]);
        });
    }
  }, [assetId]);

  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setAssetID(value);
    setFormData((prev) => ({
      ...prev,
      AssetId: value,
      Parameter: [], // reset on asset change
    }));
  };

  const handleSubmit = async () => {
    if (!groupName || !formData.AssetId || formData.Parameter.length === 0) {
      toast.error("Please fill all fields");
      return;
    }

    const userId = user?.userId || user?._id;

    const payload = {
      userId: userId,
      assetId: formData.AssetId,
      name: groupName,
      parameterId: formData.Parameter,
    };

    try {
      const response = await graphServices.addGroup(payload);
      toast.success("Group added successfully!");
      onClose();
    } catch (error) {
      toast.error("Failed to add group");
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden">
      {/* Title section styled like alert forms */}
      <div className="bg-gradient-to-r from-[#ff6600] to-[#e65c00] text-white p-6 rounded-t-xl">
        <div className="flex flex-col items-start">
          <h2 className="text-2xl font-bold">Add Group</h2>
          <p className="text-[#ffe0cc] mt-1">
            Create a new group for your device and parameters
          </p>
        </div>
      </div>
      <div className="p-6">
        {/* Group Name */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Group Name
          </label>
          <input
            type="text"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            placeholder="Enter group name"
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          />
        </div>
        {/* Device and Parameter Dropdowns */}
        <div className="flex flex-wrap gap-4 mb-4">
          {/* Device Dropdown */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700">
              Device Name
            </label>
            <select
              name="AssetId"
              value={formData.AssetId}
              onChange={handleAssetChange}
              className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
            >
              <option value="">Select Device</option>
              {deviceName.map((asset) => (
                <option key={asset._id} value={asset.AssetId}>
                  {asset.AssetName}
                </option>
              ))}
            </select>
          </div>
          {/* Parameter Multi-Select Custom */}
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700">
              Parameters
            </label>
            <div className="mt-1 border border-gray-300 rounded-md p-2 max-h-48 overflow-y-auto">
              {parameterList.length === 0 ? (
                <p className="text-sm text-gray-500">Select a device first</p>
              ) : (
                parameterList.map((param) => (
                  <label
                    key={param._id}
                    className="flex items-center gap-2 text-sm text-gray-700 mb-1"
                  >
                    <input
                      type="checkbox"
                      value={param._id}
                      checked={formData.Parameter.includes(param._id)}
                      onChange={() => {
                        setFormData((prev) => {
                          const alreadySelected = prev.Parameter.includes(
                            param._id
                          );
                          return {
                            ...prev,
                            Parameter: alreadySelected
                              ? prev.Parameter.filter((id) => id !== param._id)
                              : [...prev.Parameter, param._id],
                          };
                        });
                      }}
                    />
                    {param.ParameterName}
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
        {/* Action Buttons */}
        <div className="flex justify-end mt-6 gap-3">
          <button
            className="px-4 py-2 bg-white border border-gray-300 text-black rounded hover:bg-gray-100"
            onClick={handleCancel}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-[#FF6600] text-white rounded hover:bg-[#FF944D]"
            onClick={handleSubmit}
          >
            Save Group
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddGroup;
