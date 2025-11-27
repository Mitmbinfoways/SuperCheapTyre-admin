"use client";

import React, { useState } from "react";

type ToggleSwitchProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
};

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  disabled = false,
}) => {
  const [isToggling, setIsToggling] = useState(false);
  
  const handleChange = (newChecked: boolean) => {
    if (disabled) return;
    
    setIsToggling(true);
    onChange(newChecked);
    
    // Reset the toggling state after a short delay to ensure smooth animation
    setTimeout(() => setIsToggling(false), 300);
  };

  return (
    <label
      className={`relative inline-flex items-center ${
        disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer"
      }`}
    >
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => handleChange(e.target.checked)}
      />
      <div
        className={`relative h-7 w-12 rounded-full transition-colors duration-300 ease-in-out
          ${checked ? "bg-primary" : "bg-gray-400"}
          ${isToggling ? "scale-105" : ""}
        `}
      >
        <span
          className={`absolute top-1 left-1 h-5 w-5 rounded-full bg-white transform transition-transform duration-300 ease-in-out
            ${checked ? "translate-x-5" : "translate-x-0"}
          `}
        />
      </div>
    </label>
  );
};

export default ToggleSwitch;