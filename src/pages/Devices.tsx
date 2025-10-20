import { useState, useEffect } from "react";
import CustomSpinner from "../components/CustomSpinner";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Device, DeviceFormData } from "../types/pages.types";
import { useUserAsset } from "../hooks/useUserAsset";
import { useFullUser } from "../hooks/useFullUser";
import { userService } from "../services/userService";
import { toast } from "react-toastify";
import { useAuth } from "../hooks/useAuth";

// Fix for default marker icon
delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

type LocationPickerProps = {
  position: [number, number] | null;
  onPositionChange: (pos: [number, number]) => void;
};

function LocationPicker({ position, onPositionChange }: LocationPickerProps) {
  useMapEvents({
    click: (e: L.LeafletMouseEvent) => {
      onPositionChange([e.latlng.lat, e.latlng.lng]);
    },
  });
  // Only render Marker if position is valid
  return Array.isArray(position) && position.length === 2 ? (
    <Marker position={position} />
  ) : null;
}

function formatDateWithMonthName(dateStr: string | Date) {
  const date = new Date(dateStr);
  const day = String(date.getDate()).padStart(2, "0");
  const month = date.toLocaleString("en-GB", { month: "short" });
  const year = date.getFullYear();
  const time = date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
  });
  return `${day} ${month} ${year} ${time}`;
}

export default function Devices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [position, setPosition] = useState<[number, number]>([
    18.5204, 73.8567,
  ]); // Pune coordinates
  const [formData, setFormData] = useState<DeviceFormData>({
    deviceName: "",
    deviceType: "Device1",
    machineSerialNo: "",
    companyName: "",
    gatewayId: "",
    installationDate: "",
    location: null,
  });
  const { user: authUser } = useAuth();
  const userId = authUser?.userId || authUser?._id;

  useEffect(() => {
    document.title = "Devices";
  }, []);

  const { assets, loading } = useUserAsset(userId);
  const { user } = useFullUser(userId);

  // Map assets to Device[] and set as devices
  useEffect(() => {
    if (assets && assets.length > 0) {
      const mappedDevices: Device[] = assets.map((asset) => ({
        id: asset._id,
        name: asset.AssetName,
        deviceName: asset.AssetName,
        deviceType: asset.assetTypeDetails?.[0]?.Name || "",
        machineSerialNo: asset.ManufacturingId || "",
        companyName: user?.company_name ?? "",
        gatewayId: asset.Gateway || "",
        installationDate: asset.InstallationDate
          ? (() => {
              const d = new Date(asset.InstallationDate);
              const year = d.getFullYear();
              const month = String(d.getMonth() + 1).padStart(2, "0");
              const day = String(d.getDate()).padStart(2, "0");
              // Use ISO date (YYYY-MM-DD) so it displays in <input type="date" />
              return `${year}-${month}-${day}`;
            })()
          : "",
        location:
          typeof asset.location === "string"
            ? (asset.location.split(",").map(Number) as [number, number])
            : asset.location ?? null,
        status: asset.status ? "Active" : "Inactive",
        showDetails: false,
      }));
      setDevices(mappedDevices);
    }
  }, [assets, user?.company_name]);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.deviceName) errors.deviceName = "Device name is required";
    if (!formData.machineSerialNo)
      errors.machineSerialNo = "Serial number is required";
    if (!formData.gatewayId) errors.gatewayId = "Gateway ID is required";
    if (!formData.installationDate)
      errors.installationDate = "Installation date is required";
    if (!formData.location) errors.location = "Location is required";
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      alert("Please fill all required fields");
      return;
    }

    if (editingDevice) {
      // Prepare data for updateDevice

      const updateData = {
        AssetId: editingDevice.machineSerialNo,
        AssetName: formData.deviceName, // Name from formData
        Gateway: editingDevice.gatewayId,
        AssetType: editingDevice.deviceType,
        ManufacturingId: editingDevice.machineSerialNo,
        CompanyId: user?.company_id ? user?.company_id : "74", // Set this appropriately if you have companyId
      };
      try {
        await userService.updateDevice(editingDevice.id, updateData);
        toast.success("Device updated!");
      } catch (err) {
        toast.error("Failed to update device");
      }

      setDevices(
        devices.map((device) =>
          device.id === editingDevice.id
            ? ({
                ...formData,
                id: device.id,
                status: "Active",
                showDetails: device.showDetails ?? false,
                name: device.name,
              } as Device)
            : device
        )
      );
    } else {
      setDevices([
        ...devices,
        {
          ...formData,
          id: Date.now().toString(),
          status: "Active",
          showDetails: false,
          name: formData.deviceName,
        } as Device,
      ]);
      toast.success("Device added!");
    }

    setShowForm(false);
    setEditingDevice(null);
    setFormData({
      deviceName: "",
      deviceType: "Device1",
      machineSerialNo: "",
      companyName: "",
      gatewayId: "",
      installationDate: "",
      location: null,
    });
  };

  const handleEdit = (device: Device) => {
    setEditingDevice(device);
    setFormData({
      deviceName: device.deviceName,
      deviceType: device.deviceType,
      machineSerialNo: device.machineSerialNo,
      companyName: device.companyName,
      gatewayId: device.gatewayId,
      installationDate: device.installationDate,
      location: device.location,
    });
    setPosition(device.location ?? [18.5204, 73.8567]);
    setShowForm(true);
  };

  const handleDelete = async (deviceId: string) => {
    if (window.confirm("Are you sure you want to delete this device?")) {
      try {
        await userService.deleteDevice(deviceId);
        setDevices(devices.filter((device) => device.id !== deviceId));
        toast.success("Device deleted!");
      } catch (err) {
        toast.error("Failed to delete device");
      }
    }
  };

  const filteredDevices = devices.filter(
    (device) =>
      (device.deviceName?.toLowerCase() ?? "").includes(
        searchTerm.toLowerCase()
      ) ||
      (device.machineSerialNo?.toLowerCase() ?? "").includes(
        searchTerm.toLowerCase()
      )
  );

  return (
    <div className="p-4 mt-8">
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search devices..."
          className="w-full p-2 border rounded-md"
          value={searchTerm}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setSearchTerm(e.target.value)
          }
        />
      </div>

      <div className="overflow-x-auto grid rounded-lg">
        <table className="min-w-full bg-white">
          <thead>
            <tr className="bg-[#FF6600] text-white">
              <th className="px-4 py-2 text-right">S.No</th>
              <th className="px-4 py-2 text-left">Name</th>
              <th className="px-4 py-2 text-left">Type</th>
              <th className="px-4 py-2 text-left">ID</th>
              <th className="px-4 py-2 text-left">Status</th>
              <th className="px-4 py-2 text-left">Gateway ID</th>
              <th className="px-4 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="py-16">
                  <CustomSpinner />
                </td>
              </tr>
            ) : filteredDevices.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  No devices found.
                </td>
              </tr>
            ) : (
              filteredDevices.map((device: Device, idx) => [
                // Alternate row background: even rows #FFF5F0, odd rows #fff
                <tr
                  key={`${device.id}-main`}
                  className="border-b transition-colors"
                  style={{ background: idx % 2 === 0 ? "#FFF5F0" : "#fff" }}
                >
                  <td className="px-4 py-2 text-right">{idx + 1}</td>
                  <td className="px-4 py-2 text-left">{device.deviceName}</td>
                  <td className="px-4 py-2 text-left">{device.deviceType}</td>
                  <td className="px-4 py-2 text-left">
                    {device.machineSerialNo}
                  </td>
                  <td className="px-4 py-2 text-left">
                    <span
                      className={
                        device.status === "Active"
                          ? "px-2 py-1 bg-green-100 text-green-800 rounded-full"
                          : "px-2 py-1 bg-red-100 text-red-800 rounded-full"
                      }
                    >
                      {device.status}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-left">{device.gatewayId}</td>
                  <td className="px-4 py-2 text-left">
                    <button
                      onClick={() => handleEdit(device)}
                      className="text-[#ff6600] hover:text-[#e65c00] p-1 rounded transition-colors"
                      title="Edit device"
                      aria-label={`Edit device ${device.deviceName}`}
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        setDevices(
                          devices.map((d) => ({
                            ...d,
                            showDetails:
                              d.id === device.id ? !d.showDetails : false,
                          }))
                        );
                      }}
                      className="text-blue-600 hover:text-blue-800 p-1 rounded transition-colors"
                      title="View details"
                      aria-label={`View details for ${device.deviceName}`}
                    >
                      👁️
                    </button>
                    {/* <button
                      onClick={() => handleDelete(device.id)}
                      className="text-red-600 hover:text-red-800 p-1 rounded transition-colors"
                      title="Delete device"
                      aria-label={`Delete device ${device.deviceName}`}
                    >
                      🗑️
                    </button> */}
                  </td>
                </tr>,
                device.showDetails && (
                  <tr key={`${device.id}-details`}>
                    <td colSpan={7} className="px-4 py-2">
                      <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm text-gray-600">
                              Installation Date
                            </p>
                            <p className="font-medium">
                              {formatDateWithMonthName(device.installationDate)}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600">Location</p>
                            <p className="font-medium">
                              {/* Lat: {device.location?.[0]}, Long: {device.location?.[1]} */}
                              Lat: 0, Long: 0{" "}
                              {/* Location data not comming from backend so hard coded for now*/}
                            </p>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                ),
              ])
            )}
          </tbody>
        </table>
      </div>

      {showForm && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-1 m-auto">
          <div className="bg-white p-6 rounded-lg w-full max-w-2xl z-10">
            <h2 className="text-xl font-bold mb-4">
              {editingDevice ? "Edit Device" : "Add New Device"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.deviceName}
                    onChange={(e) =>
                      setFormData({ ...formData, deviceName: e.target.value })
                    }
                    className="w-full p-2 border rounded"
                    required
                  />
                </div>
                <div>
                  <label className="block mb-1">Device Type</label>
                  <input
                    type="text"
                    value={formData.deviceType}
                    className="w-full p-2 border rounded bg-gray-100"
                    disabled
                  />
                </div>
                <div>
                  <label className="block mb-1">ID</label>
                  <input
                    type="text"
                    value={formData.machineSerialNo}
                    className="w-full p-2 border rounded bg-gray-100"
                    disabled
                  />
                </div>
                {/* <div>
                  <label className="block mb-1">Company Name</label>
                  <input
                    type="text"
                    value={formData.companyName}
                    className="w-full p-2 border rounded bg-gray-100"
                    disabled
                  />
                </div> */}
                <div>
                  <label className="block mb-1">Gateway ID</label>
                  <input
                    type="text"
                    value={formData.gatewayId}
                    className="w-full p-2 border rounded bg-gray-100"
                    disabled
                  />
                </div>
                <div>
                  <label className="block mb-1">Installation Date</label>
                  <input
                    type="date"
                    value={formData.installationDate}
                    className="w-full p-2 border rounded bg-gray-100"
                    disabled
                  />
                </div>
              </div>
              {/* 
              <div>
                <label className="block mb-1">Location</label>
                <div className="h-64 rounded-lg overflow-hidden border">
                  <MapContainer
                    center={
                      Array.isArray(position) && position.length === 2
                        ? position
                        : [18.5204, 73.8567]
                    }
                    zoom={13}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                    <LocationPicker
                      position={
                        Array.isArray(position) && position.length === 2
                          ? position
                          : [18.5204, 73.8567]
                      }
                      onPositionChange={(pos) => {
                        setPosition(pos);
                        setFormData({ ...formData, location: pos });
                      }}
                    />
                  </MapContainer>
                </div>
              </div> */}

              <div className="flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setEditingDevice(null);
                  }}
                  className="px-4 py-2 border rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600"
                >
                  {editingDevice ? "Update" : "Save"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
