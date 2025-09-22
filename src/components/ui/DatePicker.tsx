"use client";

import React from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Props = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  disabled?: boolean;
  dateFormat?: string;
  className?: string;
  isClearable?: boolean;
};

const DatePicker: React.FC<Props> = ({
  value,
  onChange,
  placeholder = "Select a date",
  minDate,
  disabled = false,
  dateFormat = "yyyy-MM-dd",
  className = "",
  isClearable = true
}) => {
  return (
    <ReactDatePicker
      selected={value}
      onChange={onChange}
      minDate={minDate}
      disabled={disabled}
      placeholderText={placeholder}
      dateFormat={dateFormat}
      isClearable={isClearable}
      className={`w-100 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 ${className}`}
    />
  );
};

export default DatePicker;
