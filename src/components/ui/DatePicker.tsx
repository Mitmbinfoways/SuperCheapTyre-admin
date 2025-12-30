"use client";

import React, { useState } from "react";
import ReactDatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";

type Props = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  disabled?: boolean;
  dateFormat?: string;
  className?: string;
  isClearable?: boolean;
  selectsStart?: boolean;
  selectsEnd?: boolean;
  startDate?: Date | null;
  endDate?: Date | null;
  filterDate?: (date: Date) => boolean;
};

const DatePicker: React.FC<Props> = ({
  value,
  onChange,
  placeholder = "Select a date",
  minDate,
  maxDate,
  disabled = false,
  dateFormat = "dd-MM-yyyy",
  className = "",
  isClearable = true,
  selectsStart,
  selectsEnd,
  startDate,
  endDate,
  filterDate
}) => {
  // Handle change to ensure only date (without time) is passed
  const handleChange = (date: Date | null) => {
    if (date) {
      // Reset time part to midnight to ensure only date is considered
      const dateOnly = new Date(date);
      dateOnly.setHours(0, 0, 0, 0);
      onChange(dateOnly);
    } else {
      onChange(null);
    }
  };

  return (
    <ReactDatePicker
      selected={value}
      onChange={handleChange}
      minDate={minDate}
      maxDate={maxDate}
      disabled={disabled}
      placeholderText={placeholder}
      dateFormat={dateFormat}
      isClearable={isClearable}
      className={`w-100 rounded-lg border border-gray-300 bg-white px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-400 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200 ${className}`}
      showTimeInput={false}
      showTimeSelect={false}
      selectsStart={selectsStart}
      selectsEnd={selectsEnd}
      startDate={startDate}
      endDate={endDate}
      filterDate={filterDate}
      // Allow opening the date picker but prevent manual typing
      onKeyDown={(e) => {
        // Prevent typing but allow navigation keys
        if (e.key !== "Tab" && e.key !== "Enter" && e.key !== "Escape") {
          e.preventDefault();
        }
      }}
      // Ensure the calendar appears above modals
      portalId="root-portal"
    />
  );
};

export default DatePicker;
