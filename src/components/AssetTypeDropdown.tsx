import React, { useState } from "react";
import dropDownArrow from "/drop-down-arrow.png";

interface AssetTypeDropdownProps {
  options: string[];
  value: string;
  onChange: (value: string) => void;
}

export default function AssetTypeDropdown({
  options,
  value,
  onChange,
}: AssetTypeDropdownProps) {
  const [open, setOpen] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <div
      style={{
        position: "relative",
        width: "100%", // Stretch horizontally
        // maxWidth: 400, // Optional: set a max width
      }}
      tabIndex={0}
      onBlur={() => setOpen(false)}
    >
      <div
        style={{
          border: "1px solid #ccc",
          padding: "10px",
          borderRadius: 12, // More rounded
          cursor: "pointer",
          background: "#fff",
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        }}
        onClick={() => setOpen((o) => !o)}
      >
        <span className="select-none">{value || "All Devices"}</span>
        <img
          src={dropDownArrow}
          alt="Dropdown Arrow"
          style={{
            width: 15,
            height: 15,
          }}
        />
      </div>
      {open && (
        <div
          style={{
            position: "absolute",
            top: "100%",
            left: 0,
            right: 0,
            border: "1px solid #ccc",
            background: "#fff",
            zIndex: 10,
            borderRadius: 12, // More rounded
            width: "100%",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          {options.map((type, idx) => (
            <div
              key={type}
              style={{
                padding: "10px",
                background: hoveredIndex === idx ? "#FFE5D0" : "#fff",
                color: hoveredIndex === idx ? "#F05024" : "#000",
                cursor: "pointer",
                borderRadius: 8, // Slightly rounded for each option
              }}
              onMouseEnter={() => setHoveredIndex(idx)}
              onMouseLeave={() => setHoveredIndex(null)}
              // Use onMouseDown so selection fires before container onBlur closes the menu
              onMouseDown={(e) => {
                e.preventDefault();
                onChange(type);
                setOpen(false);
              }}
            >
              {type}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
