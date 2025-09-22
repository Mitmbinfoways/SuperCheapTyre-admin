"use client";

import React, { ChangeEvent } from "react";

interface TextFieldProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  type?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  name?: string;
  min?: number;
  max?: number;
}

const TextField: React.FC<TextFieldProps> = ({
  value,
  onChange,
  placeholder = "",
  type = "text",
  disabled = false,
  required = false,
  className = "",
  name = "",
  min,
  max,
}) => {
  return (
    <input
      type={type}
      name={name}
      value={value}
      placeholder={placeholder}
      onChange={onChange}
      disabled={disabled}
      required={required}
      min={min}
      max={max}
      onWheel={(e) => type === "number" && e.currentTarget.blur()}
      className={`w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 ${type === "number" ? "no-spinner" : ""} ${className}`}
    />
  );
};

export default TextField;
