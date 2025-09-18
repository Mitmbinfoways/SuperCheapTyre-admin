import React from "react";

export interface Column<T> {
  title: string;
  key: keyof T | string;
  align?: "left" | "right";
  render?: (item: T, index: number) => React.ReactNode;
}

interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  className?: string;
}

function Table<T extends { id?: string | number }>({
  columns,
  data,
  className = "",
}: TableProps<T>) {
  return (
    <div className={`overflow-x-auto rounded-lg ${className}`}>
      <table className="min-w-full divide-y divide-gray-200 overflow-hidden rounded-lg dark:divide-gray-700">
        <thead className="bg-lightblue dark:bg-gray-800">
          <tr>
            {columns.map((col) => (
              <th
                key={col.key as string}
                className={`px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-primary dark:text-gray-200 ${
                  col.align === "right" ? "text-right" : ""
                }`}
              >
                {col.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white dark:bg-gray-900">
          {data.map((item, index) => {
            const isLastRow = index === data.length - 1;
            return (
              <tr
                key={item.id || index}
                className={`border-b transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800 ${
                  isLastRow ? "border-gray-200 dark:border-gray-700" : ""
                }`}
              >
                {columns.map((col) => (
                  <td
                    key={col.key as string}
                    className={`whitespace-nowrap px-6 py-4 text-sm ${
                      col.align === "right"
                        ? "text-right"
                        : "text-gray-900 dark:text-gray-200"
                    }`}
                  >
                    {col.render
                      ? col.render(item, index)
                      : (item as any)[col.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
