"use client";

import React, { useState, useRef, useEffect } from "react";
import { HiChevronDown, HiCheck, HiSearch } from "react-icons/hi";

interface SelectOption {
  label: string;
  value: string;
  description?: string;
  icon?: React.ReactNode;
}

interface SelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  name?: string;
  id?: string;
  label?: string;
  error?: string;
  searchable?: boolean;
  maxHeight?: string;
}

const Select: React.FC<SelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select an option",
  disabled = false,
  required = false,
  className = "",
  name = "",
  id,
  label,
  error,
  searchable = false,
  maxHeight = "200px",
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [dropdownPosition, setDropdownPosition] = useState<"bottom" | "top">(
    "bottom",
  );
  const dropdownRef = useRef<HTMLDivElement>(null);

  const filteredOptions = options.filter(
    (option) =>
      option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      option.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  // Auto-flip dropdown position
  useEffect(() => {
    if (isOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      const spaceAbove = rect.top;
      const dropdownHeight = Math.min(options.length * 48, parseInt(maxHeight)); // approximate height per item
      if (spaceBelow < dropdownHeight && spaceAbove > dropdownHeight) {
        setDropdownPosition("top");
      } else {
        setDropdownPosition("bottom");
      }
    }
  }, [isOpen, options.length, maxHeight]);

  const handleOptionClick = (optionValue: string) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchTerm("");
  };

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm("");
    }
  };

  return (
    <div className={`relative w-full ${className}`} ref={dropdownRef}>
      {label && (
        <label
          htmlFor={id || name}
          className="mb-2 block text-sm font-semibold text-gray-700 dark:text-gray-300"
        >
          {label}
          {required && <span className="ml-1 text-red-500">*</span>}
        </label>
      )}

      {/* Main dropdown trigger */}
      <div
        onClick={toggleDropdown}
        className={`relative w-full cursor-pointer rounded-lg border bg-white px-3 py-2 text-left transition-all duration-200 ${
          disabled
            ? "cursor-not-allowed border-gray-200 bg-gray-50 text-gray-400"
            : isOpen
              ? "ring-2 ring-indigo-400"
              : "border-gray-300"
        } dark:border-gray-600 dark:bg-gray-800 dark:hover:border-gray-500 ${isOpen ? "dark:border-indigo-400 dark:ring-indigo-400/20" : ""} `}
      >
        <div className="flex items-center justify-between">
          <div className="flex min-w-0 flex-1 items-center space-x-3">
            {selectedOption?.icon && (
              <div className="flex-shrink-0 text-gray-400 dark:text-gray-500">
                {selectedOption.icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              {selectedOption ? (
                <div>
                  <div className="truncate text-black dark:text-gray-100">
                    {selectedOption.label}
                  </div>
                  {selectedOption.description && (
                    <div className="truncate text-xs text-gray-500 dark:text-gray-400">
                      {selectedOption.description}
                    </div>
                  )}
                </div>
              ) : (
                <span className="text-gray-500 dark:text-gray-400">
                  {placeholder}
                </span>
              )}
            </div>
          </div>
          <HiChevronDown
            className={`ml-2 h-5 w-5 flex-shrink-0 text-gray-400 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </div>

      {/* Dropdown menu */}
      {isOpen && (
        <div
          className={`absolute z-50 w-full rounded-xl border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-800 ${dropdownPosition === "bottom" ? "mt-2" : "bottom-full mb-2"} `}
        >
          {searchable && (
            <div className="border-b border-gray-200 p-3 dark:border-gray-700">
              <div className="relative">
                <HiSearch className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search options..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 py-2 pl-10 pr-4 text-sm focus:border-indigo-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-100 dark:placeholder-gray-400 dark:focus:border-indigo-400 dark:focus:bg-gray-600"
                  autoFocus
                />
              </div>
            </div>
          )}

          <div
            className="max-h-60 space-y-1 overflow-auto p-3"
            style={{ maxHeight }}
          >
            {filteredOptions.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                No options found
              </div>
            ) : (
              filteredOptions.map((option) => (
                <div
                  key={option.value}
                  onClick={() => handleOptionClick(option.value)}
                  className={`group relative flex cursor-pointer items-center space-x-3 rounded-lg px-3 py-2 transition-colors duration-150 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 ${
                    value === option.value
                      ? "bg-indigo-100 text-indigo-900 dark:bg-indigo-900/40 dark:text-indigo-100"
                      : "text-gray-900 dark:text-gray-100"
                  } `}
                >
                  {option.icon && (
                    <div
                      className={`flex-shrink-0 ${
                        value === option.value
                          ? "text-indigo-600 dark:text-indigo-400"
                          : "text-gray-400 group-hover:text-indigo-500"
                      }`}
                    >
                      {option.icon}
                    </div>
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="truncate font-medium">{option.label}</div>
                    {option.description && (
                      <div
                        className={`truncate text-xs ${
                          value === option.value
                            ? "text-indigo-700 dark:text-indigo-300"
                            : "text-gray-500 dark:text-gray-400"
                        }`}
                      >
                        {option.description}
                      </div>
                    )}
                  </div>

                  {value === option.value && (
                    <HiCheck className="h-4 w-4 flex-shrink-0 text-indigo-600 dark:text-indigo-400" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
};

export default Select;
