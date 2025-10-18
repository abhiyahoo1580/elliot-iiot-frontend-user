import React, { useEffect, useState } from "react";
import { alertServices } from "../../services/alertService";
import { graphServices } from "../../services/graphService";
import { toast } from "react-toastify";

interface EditGroupProps {
  groupData: {
    _id: string;
    name: string;
    assetId: string;
    parameterId: number[];
  };
  onClose: () => void;
}

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

const EditGroup = ({ groupData, onClose }: EditGroupProps) => {
  const [deviceList, setDeviceList] = useState<DeviceTypeItem[]>([]);
  const [parameterList, setParameterList] = useState<ParameterItem[]>([]);
  const [assetId, setAssetId] = useState<string>(groupData.assetId);
  const [groupName, setGroupName] = useState<string>(groupData.name);
  const [selectedParams, setSelectedParams] = useState<number[]>(
    groupData.parameterId
  );
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    const userId = localStorage.getItem("userId");
    if (userId) {
      alertServices
        .getMeterName(userId)
        .then((res: any) => {
          const devices = res.data.flatMap((d: any) => d.assetDetails ?? []);
          setDeviceList(devices);
        })
        .catch((err) => {
          toast.error("Device fetch failed", err);
        });
    }
  }, []);

  useEffect(() => {
    if (assetId) {
      alertServices
        .getParameterName(assetId)
        .then((res: any) => {
          setParameterList(res.data ?? []);
        })
        .catch((err) => {
          toast.error("Parameter fetch failed", err);
        });
    }
  }, [assetId]);

  const handleAssetChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setAssetId(e.target.value);
    setSelectedParams([]);
  };

  const handleCheckboxChange = (paramId: number) => {
    setSelectedParams((prev) =>
      prev.includes(paramId)
        ? prev.filter((id) => id !== paramId)
        : [...prev, paramId]
    );
  };

  const handleCancel = () => {
    onClose();
  };

  const handleSubmit = async () => {
    const userId = localStorage.getItem("userId");

    if (
      !userId ||
      !groupName.trim() ||
      !assetId ||
      selectedParams.length === 0
    ) {
      toast.error("All fields are required.");
      return;
    }

    const payload = {
      userId,
      assetId,
      name: groupName.trim(),
      parameterId: selectedParams,
    };

    // console.log("Submitting payload:", {
    //   groupId: groupData._id,
    //   ...payload,
    // });

    try {
      setIsSubmitting(true);
      const response = await graphServices.updateGroup(groupData._id, payload);
      // console.log("Update response:", response.data);
      toast.success("Group updated successfully!");
      onClose();
    } catch (error: any) {
      console.error(
        "Update failed:",
        error?.response?.data || error.message || error
      );
      toast.error(
        "Failed to update group: " +
          (error?.response?.data?.message ||
            error.message ||
            "Internal server error")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-2xl w-full max-w-xl overflow-hidden">
      {/* Title section styled like alert forms */}
      <div className="bg-gradient-to-r from-[#ff6600] to-[#e65c00] text-white p-6 rounded-t-xl">
        <div className="flex flex-col items-start">
          <h2 className="text-2xl font-bold">Edit Group</h2>
          <p className="text-[#ffe0cc] mt-1">
            Update the group for your device and parameters
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
        {/* Device Dropdown */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700">
            Device Name
          </label>
          <select
            value={assetId}
            onChange={handleAssetChange}
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select Device</option>
            {deviceList.map((device) => (
              <option key={device._id} value={device.AssetId}>
                {device.AssetName}
              </option>
            ))}
          </select>
        </div>
        {/* Parameter Multi-Select Custom */}
        <div className="mb-4">
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
                    checked={selectedParams.includes(param._id)}
                    onChange={() => handleCheckboxChange(param._id)}
                  />
                  {param.ParameterName}
                </label>
              ))
            )}
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
            disabled={isSubmitting}
            className={`px-4 py-2 text-white rounded ${
              isSubmitting ? "bg-blue-300" : "bg-[#FF6600] hover:bg-[#FF944D]"
            }`}
            onClick={handleSubmit}
          >
            {isSubmitting ? "Saving..." : "Save Group"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditGroup;
