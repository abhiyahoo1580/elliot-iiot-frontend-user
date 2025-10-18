import React, { useState } from 'react';

interface DeviceSelectorProps {
  selectedDevice: string;
  selectedTimeRange?: string;
  onDeviceChange: (device: string) => void;
  onTimeRangeChange?: (range: string) => void;
}

const DeviceSelector: React.FC<DeviceSelectorProps> = ({
  selectedDevice,
  selectedTimeRange: _selectedTimeRange,
  onDeviceChange,
  onTimeRangeChange: _onTimeRangeChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  // const [selectedDate, setSelectedDate] = useState('8 April 2025, Tuesday');  
  const devices = [
    "MSEDCL Incomer 2(7F1)",
    "MSEDCL Incomer 1(7F1)"
  ];
  // const timeRanges = ['Today', 'This week', 'This month', 'Custom'];

  return (
    <div className="max-w-md w-full">
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="w-full px-4 py-2 text-left bg-gray-50 rounded-lg flex justify-between items-center hover:bg-gray-100 transition-colors"
        >
          <span>{selectedDevice || "Select Device"}</span>
          <svg
            className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        
        {isOpen && (
          <div className="absolute top-full left-0 right-0 mt-1 bg-white border rounded-lg shadow-lg z-10 p-4">
            <div className="mb-4">
              {devices.map((device) => (
                <button
                  key={device}
                  onClick={() => {
                    onDeviceChange(device);
                    setIsOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-gray-50 first:rounded-t-lg"
                >
                  {device}
                </button>
              ))}
            </div>
            
            {/* 
            // Uncomment and use when time range selection is needed
            <div className="mb-4">
              <label className="block mb-1 font-medium">Time Range</label>
              <select
                value={selectedTimeRange}
                onChange={e => onTimeRangeChange && onTimeRangeChange(e.target.value)}
                className="w-full px-4 py-2 border rounded-lg"
              >
                {timeRanges.map(range => (
                  <option key={range} value={range}>{range}</option>
                ))}
              </select>
            </div>
            */}

            <button 
              className="w-full bg-[#F05024] text-white px-4 py-2 rounded hover:bg-[#e04719] transition-colors mt-4"
              onClick={() => {
                // console.log('Downloading report...');
                // Handle download report here
              }}
            >
              Download Report
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeviceSelector;
