import React from "react";

interface EmptyStateProps {
  message: string;
  className?: string;
}

const EmptyState: React.FC<EmptyStateProps> = ({ message, className = "" }) => {
  return (
    <div className={`flex h-96 w-full items-center justify-center ${className}`}>
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <svg
            className="h-16 w-16 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            ></path>
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
          {message}
        </p>
      </div>
    </div>
  );
};

export default EmptyState;