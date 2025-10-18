import React from "react";

const CustomSpinner: React.FC = () => (
  <div className="flex items-center justify-center w-full h-full min-h-[120px]">
    <div className="animate-spin rounded-full border-4 border-t-4 border-gray-200 border-t-[#FF6600] h-12 w-12"></div>
  </div>
);

export default CustomSpinner;
