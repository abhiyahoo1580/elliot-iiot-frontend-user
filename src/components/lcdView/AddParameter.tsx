import React, { useEffect, useState } from "react";
import { alertServices } from "../../services/alertService";
import { toast } from "react-toastify";
import { graphServices } from "../../services/graphService";
import { useAuth } from "../../hooks/useAuth";

interface AddParameterProps {
  onClose: () => void;
}

const AddParameter: React.FC<AddParameterProps> = ({ onClose }) => {
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
    Parameter: "" as number | "",
  });

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
      Parameter: "", //
    }));
  };

  const handleSubmit = async () => {
    if (!groupName || !formData.AssetId || formData.Parameter === "") {
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
      await graphServices.addGroup(payload);
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
    <div className="p-6 w-full max-w-xl">
      <h2 className="text-2xl font-semibold mb-6 text-center text-gray-800">
        Add Group
      </h2>

      <div className="flex flex-wrap gap-4 mb-4">
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

        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium text-gray-700">
            Parameter
          </label>
          <select
            name="Parameter"
            value={formData.Parameter}
            onChange={(e) =>
              setFormData((prev) => ({
                ...prev,
                Parameter: e.target.value ? Number(e.target.value) : "",
              }))
            }
            className="mt-1 block w-full p-2 border border-gray-300 rounded-md"
          >
            <option value="">Select Parameter</option>
            {parameterList.map((param) => (
              <option key={param._id} value={param._id}>
                {param.ParameterName}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex justify-center mt-6 gap-3">
        <button
          className="px-4 py-2 bg-[#FF0000] text-white rounded hover:bg-[#fd2525]"
          onClick={handleCancel}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-500"
          onClick={handleSubmit}
        >
          Save Group
        </button>
      </div>
    </div>
  );
};

export default AddParameter;
