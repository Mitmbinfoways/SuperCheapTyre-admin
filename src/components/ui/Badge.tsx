import React, { ReactNode } from "react";
import clsx from "clsx";

type BadgeColor =
  | "green"
  | "red"
  | "yellow"
  | "blue"
  | "gray"
  | "purple"
  | "custom";

type BadgeSize = "sm" | "md" | "lg";

interface BadgeProps {
  label: ReactNode;
  color?: BadgeColor;
  size?: BadgeSize;
  customClass?: string;
}

const Badge: React.FC<BadgeProps> = ({
  label,
  color = "gray",
  size = "sm",
  customClass = "",
}) => {
  const colorClasses: Record<Exclude<BadgeColor, "custom">, string> = {
    green: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    red: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    yellow:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
    blue: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    gray: "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200",
    purple:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  };

  const sizeClasses: Record<BadgeSize, string> = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-base px-4 py-2",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center font-medium rounded-full",
        color !== "custom" ? colorClasses[color] : "",
        sizeClasses[size],
        customClass
      )}
    >
      {label}
    </span>
  );
};

export default Badge;
