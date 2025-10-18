import React, { useEffect, useState } from "react";
import { alertServices } from "../services/alertService";
import { PencilSquareIcon, TrashIcon } from "@heroicons/react/24/outline";
import AddAlertForm from "../components/alertConfig/AddAlertForm";
import { toast } from "react-toastify";
import EditAlertForm from "../components/alertConfig/EditAlert";
import CustomSpinner from "../components/CustomSpinner";

interface AlertItem {
  _id: string;
  assetName?: string | string[];
  parameterName?: string | string[];
  upperThresholdValue: number;
  lowerThresholdValue: number;
  upperThresholdWarning: number;
  lowerThresholdWarning: number;
  frequency: number; // Added to store minAlertInterval (in minutes)
}

const AlertConfig = () => {
  const [userData, setUserData] = useState<AlertItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<AlertItem | null>(null);
  const [alertId, setAlertId] = useState<string | undefined>();

  const fetchAlerts = () => {
    setLoading(true);
    const id = localStorage.getItem("userId");
    if (id) {
      alertServices
        .getAlert(id)
        .then((res: any) => {
          setUserData(res.data);
          setLoading(false);
        })
        .catch((err) => {
          setUserData([]);
          setLoading(false);
          toast.error("❌ Failed to fetch alerts: " + String(err));
        });
    } else {
      setUserData([]);
      setLoading(false);
      toast.error("❌ User ID not found in local storage");
    }
  };

  useEffect(() => {
    fetchAlerts(); // Load data on mount
  }, []);

  const handleFormClose = () => {
    setShowForm(false);
    setIsEdit(false);
    setSelectedAlert(null);
    setAlertId(undefined);
    fetchAlerts(); // Re-fetch data after closing form
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await alertServices.deleteAlertConfig(alertId);
      toast.success("Alert deleted successfully!");
      fetchAlerts(); // Refresh the table after deletion
    } catch (error) {
      toast.error(
        "❌ Error deleting alert: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  // Format frequency for display (e.g., "15 minutes")
  const formatFrequency = (frequency: number | undefined | null) => {
    if (!frequency || frequency === 0) return "All";
    return `${frequency} minutes`;
  };

  return (
    <div className="p-4">
      <div className="mb-6">
        <div className="flex justify-end items-center p-3">
          <div className="mt-4">
            <button
              onClick={() => {
                setShowForm(true);
                setIsEdit(false);
              }}
              className="bg-[#FF6600] hover:bg-[#FF944D] text-white px-4 py-2 rounded"
            >
              Add Alert
            </button>
          </div>
        </div>

        <div className="overflow-x-auto grid rounded-lg border">
          <table className="min-w-full border-collapse">
            <thead className="bg-[#FF6600] text-white">
              <tr>
                <th className="text-right p-3">S.No.</th>
                <th className="text-center p-3">Device Name</th>
                <th className="text-center p-3">Parameter</th>
                <th className="text-right p-3">Upper Threshold Value</th>
                <th className="text-right p-3">Lower Threshold Value</th>
                <th className="text-right p-3">Upper Threshold Warning</th>
                <th className="text-right p-3">Lower Threshold Warning</th>
                <th className="text-center p-3">Interval</th>
                <th className="text-center p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-16">
                    <CustomSpinner />
                  </td>
                </tr>
              ) : userData.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center p-4">
                    No alert data found.
                  </td>
                </tr>
              ) : (
                userData.map((item, index) => (
                  <tr
                    key={item._id}
                    className="border-b"
                    style={{
                      backgroundColor: index % 2 === 0 ? "#FFF5F0" : "#fff",
                    }}
                  >
                    <td className="text-right pr-2">{index + 1}</td>
                    <td className="text-center p-3">
                      {Array.isArray(item.assetName)
                        ? item.assetName[0] || "N/A"
                        : item.assetName || "N/A"}
                    </td>
                    <td className="text-center p-3">
                      {Array.isArray(item.parameterName)
                        ? item.parameterName[0] || "N/A"
                        : item.parameterName || "N/A"}
                    </td>
                    <td className="text-right px-8">
                      {item.upperThresholdValue !== undefined &&
                      item.upperThresholdValue !== null
                        ? item.upperThresholdValue
                        : "N/A"}
                    </td>
                    <td className="text-right px-8">
                      {item.lowerThresholdValue !== undefined &&
                      item.lowerThresholdValue !== null
                        ? item.lowerThresholdValue
                        : "N/A"}
                    </td>
                    <td className="text-right px-8">
                      {item.upperThresholdWarning !== undefined &&
                      item.upperThresholdWarning !== null
                        ? item.upperThresholdWarning
                        : "N/A"}
                    </td>
                    <td className="text-right px-8">
                      {item.lowerThresholdWarning !== undefined &&
                      item.lowerThresholdWarning !== null
                        ? item.lowerThresholdWarning
                        : "N/A"}
                    </td>
                    <td className="text-center px-8">
                      {formatFrequency(item.frequency)}
                    </td>
                    <td className="text-center flex gap-1 mt-2">
                      <button
                        className="hover:bg-gray-100 p-1 rounded"
                        onClick={() => {
                          setIsEdit(true);
                          setSelectedAlert(item);
                          setShowForm(true);
                          setAlertId(item._id);
                        }}
                      >
                        <PencilSquareIcon className="h-5 w-5 text-blue-600" />
                      </button>
                      <button
                        className="hover:bg-gray-100 p-1 rounded"
                        onClick={() => handleDeleteAlert(item._id)}
                      >
                        <TrashIcon className="h-5 w-5 text-orange-500" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Alert Modal */}
      {showForm && !isEdit && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <AddAlertForm onClose={handleFormClose} />
        </div>
      )}

      {/* Edit Alert Modal */}
      {showForm && isEdit && selectedAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <EditAlertForm
            alertData={selectedAlert}
            onClose={handleFormClose}
            alertId={alertId ?? ""}
          />
        </div>
      )}
    </div>
  );
};

export default AlertConfig;
