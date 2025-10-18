import { TrashIcon } from "@heroicons/react/24/outline";
import React, { useState } from "react";
import AddParameter from "../components/lcdView/AddParameter";

const parameter_Data: {
  msg: string;
  data: {
    _id: number;
    DeviceTypeName: string[];
    ids: string[];
    parameterIds: number[];
    parameterNames: string[][];
  }[];
} = {
  msg: "successfully Find",
  data: [
    {
      _id: 1,
      DeviceTypeName: ["EMA"],
      ids: [
        "651bf2be3164291edc478f58",
        "651bf2de3164291edc478f5d",
        "651bf2f83164291edc478f62",
      ],
      parameterIds: [4, 13, 1],
      parameterNames: [["Avg PF"], ["kW (Total)"], ["kWh"]],
    },
  ],
};

const LcdView = () => {
  const [isAddParameter, setIsAddParameter] = useState(false);

  const handleFormClose = () => {
    setIsAddParameter(false);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-end items-center  p-3">
          <div className="p-2 mt-10 ">
            <button
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-500"
              onClick={() => setIsAddParameter(true)}
            >
              ADD Parameter
            </button>
          </div>
        </div>
        <div className="bg-white shadow-md overflow-hidden rounded">
          <table className="w-full table-auto border-collapse">
            <thead>
              <tr className="border-b-2 bg-orange-600 text-white">
                <th className="text-center p-3">No.</th>
                <th className="text-left p-3">Device Type</th>
                <th className=" border-b-2 text-left p-3">Parameter Name</th>
                <th className="border-b-2 text-left p-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {(() => {
                let rowIndex = 1; // Counter for serial number
                return parameter_Data.data.flatMap((device, deviceIndex) =>
                  device.parameterNames.map(
                    (parameterNames, parameterIndex) => (
                      <tr
                        key={`${device._id}-${parameterIndex}`}
                        className={`border-b-2 ${
                          rowIndex % 2 === 0 ? "bg-[#FFF5F0]" : "bg-white"
                        }`}
                      >
                        <td className="text-center font-semibold">
                          {rowIndex++}
                        </td>
                        <td className="text-left pl-3">
                          {device.DeviceTypeName.join(", ")}
                        </td>
                        <td className="text-left pl-3 ">{parameterNames}</td>
                        <td className="text-lef pl-5">
                          <button
                            className="text-orange-600 hover:text-orange-800 p-2 rounded-full transition duration-200"
                            aria-label="Delete"
                          >
                            <TrashIcon className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    )
                  )
                );
              })()}
            </tbody>
          </table>
        </div>
      </div>

      {isAddParameter && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg">
            <AddParameter onClose={handleFormClose} />
          </div>
        </div>
      )}
    </div>
  );
};

export default LcdView;
