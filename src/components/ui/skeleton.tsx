import React from "react";

interface SkeletonProps {
  count?: number;
  height?: string | number;
  className?: string;
  rounded?: string;
}

const Skeleton: React.FC<SkeletonProps> = ({
  count = 8,
  height = "2rem",
  className = "",
  rounded = "rounded-lg",
}) => {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={`${rounded} bg-gray-300 dark:bg-gray-700`}
          style={{ height }}
        />
      ))}
    </div>
  );
};

export default Skeleton;
