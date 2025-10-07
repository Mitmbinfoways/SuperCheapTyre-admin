import React from "react";

export interface Column<T> {
  title: string;
  key: keyof T | string;
  align?: "left" | "right" | "center";
  render?: (item: T, index: number) => React.ReactNode;
  width?: string;
  sortable?: boolean;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
  emptyMessage?: string;
  loading?: boolean;
  onRowClick?: (item: T, index: number) => void;
}

function Table<T extends { id?: string | number; _id?: string }>({
  columns,
  data,
  className = "",
  emptyMessage = "No data available",
  loading = false,
  onRowClick,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className={`w-full overflow-x-auto rounded-t-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="h-16 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`w-full overflow-x-auto rounded-t-lg ${className}`}>
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-lg">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-x-auto rounded-t-lg ${className}`}>
      <table className="w-full table-auto overflow-hidden rounded-t-lg">
        <thead className="bg-lightblue dark:bg-gray-800">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key as string}
                className={`px-4 py-3 text-xs font-medium uppercase tracking-wider text-primary dark:text-gray-200 ${
                  col.align === "right"
                    ? "text-right"
                    : col.align === "center"
                    ? "text-center"
                    : "text-left"
                }`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 border-t border-b border-gray-200 dark:border-gray-700">
          {data.map((item, index) => (
            <tr
              key={(item as any).id || (item as any)._id || index}
              className={`transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                onRowClick ? "cursor-pointer" : ""
              } border-b last:border-b-0 border-gray-200 dark:border-gray-700`}
              onClick={() => onRowClick?.(item, index)}
            >
              {columns.map((col) => (
                <td
                  key={col.key as string}
                  className={`px-4 py-3 text-sm ${
                    col.align === "right"
                      ? "text-right"
                      : col.align === "center"
                      ? "text-center text-gray-900 dark:text-gray-300"
                      : "text-gray-900 dark:text-gray-200"
                  }`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.render ? col.render(item, index) : (item as any)[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
