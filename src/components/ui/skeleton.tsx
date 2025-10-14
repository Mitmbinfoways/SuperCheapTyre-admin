import React from "react";

interface SkeletonProps {
  count?: number; 
  height?: string | number;
  className?: string; 
}

const Skeleton: React.FC<SkeletonProps> = ({
  count = 8,
  height = "2rem",
  className = "",
}) => {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      {[...Array(count)].map((_, i) => (
        <div
          key={i}
          className={`rounded bg-gray-200 dark:bg-gray-600`}
          style={{ height }}
        />
      ))}
    </div>
  );
};

export default Skeleton;
