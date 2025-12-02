"use client";

import React from "react";
import PhoneInput, { Country } from "react-phone-number-input";
import "react-phone-number-input/style.css";

type Props = {
  label: string;
  name: string;
  value: string;
  required?: boolean;
  error?: string;
  touched?: boolean;
  placeholder?: string;
  defaultCountry?: Country;
  onChange: (value: string) => void;
  onClearError: () => void;
  onTouch: () => void;
  readOnly?: boolean;
};

const CommonPhoneInput: React.FC<Props> = ({
  label,
  name,
  value,
  required,
  error,
  readOnly = false,
  touched,
  placeholder = "Enter your Mobile Number",
  defaultCountry = "AU",
  onChange,
  onClearError,
  onTouch,
}) => {
  const showError = error && touched;

  return (
    <div className="flex flex-col gap-1">
      <label className="font-lexend font-normal text-gray-900 dark:text-gray-100 text-base">
        {label}
        {required && <span className="text-red-600">*</span>}
      </label>

      <div
        className={`flex items-center w-full h-10 p-2 rounded-[7px] border bg-white dark:bg-gray-800
        ${showError ? "border-red-600" : "border-gray-300 dark:border-gray-700"}
        focus-within:border-blue-500 focus-within:ring-1 focus-within:ring-blue-500
      `}
      >
        <PhoneInput
          name={name}
          placeholder={placeholder}
          value={value}
          onChange={(val) => {
            if (readOnly) return;
            onChange(val || "");  
            onClearError();
            onTouch();
          }}
          // onCountryChange={() => {
          //   onChange("");
          //   onClearError();
          // }}
          international
          limitMaxLength
          disabled={readOnly}
          defaultCountry={defaultCountry}
          countryCallingCodeEditable={false}
          className="w-full flex items-center"
        />
      </div>

      {/* Custom fixes for alignment + clean UI */}
      <style>{`
        .react-phone-number-input {
          display: flex;
          align-items: center;
          width: 100%;
        }
        .PhoneInputInput {
          border: none !important;
          outline: none !important;
          box-shadow: none !important;
          font-size: 0.875rem;
          color: #111827;
          width: 100%;
          padding-left: 0.5rem;
        }
        .react-phone-number-input .PhoneInputCountry {
          display: flex;
          align-items: center;
          height: 52px;
          padding-left: 12px;
        }

        .react-phone-number-input .PhoneInputCountrySelect {
          height: 52px !important;
        }

        .react-phone-number-input .PhoneInputInput {
          font-size: 14px;
          padding-left: 10px;
          border: none;
          outline: none;
          width: 100%;
          height: 52px;
          color: #111827;
        }
        .dark .PhoneInputInput {
          color: #f3f4f6 !important;
          background-color: transparent;
        }
        .dark .PhoneInputCountrySelect {
          color: #f3f4f6;
          background-color: #111827;
        }
      `}</style>

      {showError && <p className="text-red-600 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default CommonPhoneInput;
