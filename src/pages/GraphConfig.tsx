import React, { useEffect, useState } from "react";
import {
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import AddGroup from "../components/graphConfig/AddGroup";
import EditGroup from "../components/graphConfig/EditGroup";
import { graphServices } from "../services/graphService";
import { toast } from "react-toastify";
import { Chip } from "@mui/material";
import CustomSpinner from "../components/CustomSpinner";
import { useAuth } from "../hooks/useAuth";

interface Group {
  groupName: string;
  parameterList: string;
}

interface GraphDataItem {
  _id: string;
  names?: string[];
  assetName?: string[];
  parameterNames?: string[][];
  groupIds?: string[];
  parameterIds?: string[];
}

const GraphConfig = () => {
  const { user } = useAuth();
  const [groupData, setGroupData] = useState<GraphDataItem[]>([]);
  const [expandedGroup, setExpandedGroup] = useState<string | null>(null);
  const [isAddGroup, setIsAddGroup] = useState(false);
  const [isEditGroup, setIsEditGroup] = useState(false);
  const [selectedGroupData, setSelectedGroupData] = useState<any | null>(null);
  const [expandedName, setExpandedName] = useState<string | null>(null);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleExpand = (id: string) => {
    setExpandedGroup((prev) => (prev === id ? null : id));
  };

  const handleFormClose = () => {
    setIsAddGroup(false);
    setIsEditGroup(false);
    setSelectedGroupData(null);
    fetchGroupData();
  };

  const fetchGroupData = () => {
    const id = user?.userId || user?._id;

    if (id) {
      setLoading(true);
      graphServices
        .getGraphConfig(id)
        .then((res: any) => {
          setGroupData(res.data);
        })
        .catch((err) => {
          setGroupData([]);
          toast.error("❌ Failed to fetch alerts:", err);
        })
        .finally(() => setLoading(false));
    }
  };

  useEffect(() => {
    fetchGroupData();
  }, []);

  const handleDeleteGroup = async (groupId: string) => {
    try {
      await graphServices.deleteGroup(groupId);
      fetchGroupData();
      toast.success("Group deleted successfully!");
    } catch (error) {
      toast.error(
        "❌ Error deleting group: " +
          (error instanceof Error ? error.message : String(error))
      );
    }
  };

  // Add this function just before return
  const handleEditGroup = (groupId: string) => {
    const matchingDevice = groupData.find((device) =>
      device.groupIds?.includes(groupId)
    );

    if (matchingDevice) {
      const index = matchingDevice.groupIds?.indexOf(groupId);
      const groupName = matchingDevice.names?.[index ?? 0];
      const parameterId = matchingDevice.parameterIds?.[index ?? 0];

      setSelectedGroupData({
        _id: groupId,
        name: groupName,
        assetId: matchingDevice._id,
        parameterId: parameterId,
      });

      setIsEditGroup(true);
    } else {
      toast.error(`❌ Matching device not found for groupId: ${groupId}`);
    }
  };

  return (
    <div className="p-4">
      <div className="mb-4">
        <div className="flex justify-end items-center  p-3">
          <div className="mt-4">
            <button
              className="bg-[#FF6600] hover:bg-[#FF944D] text-white px-4 py-2 rounded"
              onClick={() => setIsAddGroup(true)}
            >
              Add Group
            </button>
          </div>
        </div>

        <div className="bg-white shadow-md overflow-x-auto rounded-lg grid">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="border-b-2 bg-[#FF6600] text-white">
                <th className="text-left p-3">S.No.</th>
                <th className="text-left p-3">Device Name</th>
                <th className="border-b-2 text-left p-3">Group Name</th>
                <th className="border-b-2 text-left p-3">Parameter List</th>
                <th className="border-b-2 text-left p-3">Action</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-16">
                    <CustomSpinner />
                  </td>
                </tr>
              ) : groupData && groupData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center p-4">
                    No group data found.
                  </td>
                </tr>
              ) : (
                // Unique counter
                (() => {
                  let uniqueIndex = 1;
                  return groupData.flatMap(
                    (device, deviceIndex) =>
                      device.names?.map((groupName, groupIndex) => {
                        const parameters =
                          device.parameterNames?.[groupIndex] || [];
                        const groupId = device.groupIds?.[groupIndex];

                        return (
                          <tr
                            key={`${device._id}-${groupIndex}`}
                            className={`border-b-2 ${
                              uniqueIndex % 2 === 1
                                ? "bg-[#FFF5F0]"
                                : "bg-white"
                            }`}
                          >
                            {/* Unique Index */}
                            <td className="text-center font-semibold">
                              {uniqueIndex++}
                            </td>

                            {/* Machine Name */}
                            <td className="text-center font-semibold">
                              {device.assetName?.[0] || "-"}
                            </td>

                            {/* Group Name */}
                            <td className="text-left p-4">{groupName}</td>

                            {/* Parameter List */}
                            <td className="text-left py-1">
                              {parameters.length > 0 ? (
                                parameters.map((param, i) => (
                                  <Chip
                                    key={i}
                                    label={param}
                                    style={{
                                      backgroundColor: "#FF6600",
                                      color: "white",
                                    }} // Orange-600
                                    className="m-1 font-medium"
                                  />
                                ))
                              ) : (
                                <span className="text-sm text-gray-500 italic">
                                  No parameters
                                </span>
                              )}
                            </td>

                            {/* Actions */}
                            <td className="text-left md:px-3 align-center space-x-2">
                              <button
                                onClick={() => {
                                  setGroupId(groupId ?? null);
                                  if (groupId) {
                                    handleEditGroup(groupId);
                                  } else {
                                    toast.error(
                                      "❌ GroupId not found for group name: " +
                                        groupName
                                    );
                                  }
                                }}
                                className="text-orange-600"
                              >
                                <PencilSquareIcon className="h-8 w-8 p-1 inline text-blue-600 hover:bg-gray-100" />
                              </button>

                              <button
                                onClick={() => {
                                  if (groupId) {
                                    handleDeleteGroup(groupId);
                                  } else {
                                    toast.error(
                                      "❌ GroupId not found for delete action: " +
                                        groupName
                                    );
                                  }
                                }}
                                className="text-orange-500"
                              >
                                <TrashIcon className="h-7 w-7 p-1 inline hover:bg-gray-100" />
                              </button>
                            </td>
                          </tr>
                        );
                      }) || []
                  );
                })()
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isAddGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <AddGroup onClose={handleFormClose} />
        </div>
      )}

      {isEditGroup && selectedGroupData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <EditGroup groupData={selectedGroupData} onClose={handleFormClose} />
        </div>
      )}
    </div>
  );
};

export default GraphConfig;
