import React, { ReactNode } from "react";

interface TooltipProps {
  content: string;
  children: ReactNode;
  position?: "top" | "bottom" | "left" | "right";
  className?: string;
}

const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  position = "top",
  className = "",
}) => {
  const positionClasses = {
    top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
    bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
    left: "right-full top-1/2 -translate-y-1/2 mr-2",
    right: "left-full top-1/2 -translate-y-1/2 ml-2",
  };

  return (
    <div className={`relative inline-block group ${className}`}>
      {children}
      <div
        className={`
          absolute z-50 hidden w-max max-w-xs rounded-md bg-gray-800 px-3 py-2 text-sm text-white
          opacity-0 transition-all duration-200 group-hover:block group-hover:opacity-100
          ${positionClasses[position]}
        `}
      >
        {content}
        <div
          className={`
            absolute border-8 border-transparent 
            ${position === "top" ? "border-t-gray-800 bottom-[-0.5rem] left-1/2 -translate-x-1/2" : ""}
            ${position === "bottom" ? "border-b-gray-800 top-[-0.5rem] left-1/2 -translate-x-1/2" : ""}
            ${position === "left" ? "border-l-gray-800 right-[-0.5rem] top-1/2 -translate-y-1/2" : ""}
            ${position === "right" ? "border-r-gray-800 left-[-0.5rem] top-1/2 -translate-y-1/2" : ""}
          `}
        />
      </div>
    </div>
  );
};

export default Tooltip;
