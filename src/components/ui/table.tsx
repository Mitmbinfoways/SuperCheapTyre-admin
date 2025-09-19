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

function Table<T extends { id?: string | number }>({
  columns,
  data,
  className = "",
  emptyMessage = "No data available",
  loading = false,
  onRowClick,
}: TableProps<T>) {
  if (loading) {
    return (
      <div className={`w-full overflow-x-auto rounded-lg ${className}`}>
        <div className="animate-pulse">
          <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-t-lg"></div>
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-16 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"></div>
          ))}
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className={`w-full overflow-x-auto rounded-lg ${className}`}>
        <div className="text-center py-12 bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
          <p className="text-gray-500 dark:text-gray-400 text-lg">{emptyMessage}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full overflow-x-auto rounded-lg shadow-sm ${className}`}>
      <table className="w-full min-w-[1000px] table-auto divide-y divide-gray-200 overflow-hidden rounded-lg dark:divide-gray-700">
        <thead className="bg-lightblue dark:bg-gray-800">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key as string}
                className={`px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-primary dark:text-gray-200 ${
                  col.align === "right" ? "text-right" : col.align === "center" ? "text-center" : "text-left"
                } ${col.width ? `w-${col.width}` : ""}`}
                style={col.width ? { width: col.width } : undefined}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
          {data.map((item, index) => (
            <tr
              key={item.id || index}
              className={`transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                onRowClick ? "cursor-pointer" : ""
              }`}
              onClick={() => onRowClick?.(item, index)}
            >
              {columns.map((col) => (
                <td
                  key={col.key as string}
                  className={`px-4 py-3 text-sm ${
                    col.align === "right" 
                      ? "text-right" 
                      : col.align === "center" 
                      ? "text-center" 
                      : "text-gray-900 dark:text-gray-200"
                  } ${col.width ? `w-${col.width}` : ""}`}
                  style={col.width ? { width: col.width } : undefined}
                >
                  {col.render
                    ? col.render(item, index)
                    : (item as any)[col.key]}
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
