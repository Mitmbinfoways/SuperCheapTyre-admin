"use client";
import React from "react";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  const getPageNumbers = () => {
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    return {
      pages: Array.from(
        { length: endPage - startPage + 1 },
        (_, i) => startPage + i,
      ),
      startPage,
      endPage,
    };
  };

  const { pages, endPage } = getPageNumbers();

  return (
    <nav className="flex items-center justify-center space-x-2 rounded-lg p-1 text-gray-900 dark:text-gray-100">
      <button
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        className="rounded-full p-2 transition hover:bg-blue-100 disabled:opacity-50 dark:hover:bg-blue-900"
      >
        <IoIosArrowBack />
      </button>
      {pages[0] > 1 && (
        <>
          <button
            onClick={() => onPageChange(1)}
            className={`rounded-full px-3 py-1 transition ${
              currentPage === 1
                ? "bg-blue-600 text-white"
                : "hover:bg-blue-100 dark:hover:bg-blue-900"
            }`}
          >
            1
          </button>
          {pages[0] > 2 && (
            <span className="text-gray-400 dark:text-gray-500">...</span>
          )}
        </>
      )}
      {pages.map((page) => (
        <button
          key={page}
          onClick={() => onPageChange(page)}
          className={`rounded-full px-3 py-1 transition ${
            currentPage === page
              ? "bg-blue-600 text-white"
              : "hover:bg-blue-100 dark:hover:bg-blue-900"
          }`}
        >
          {page}
        </button>
      ))}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="text-gray-400 dark:text-gray-500">...</span>
          )}
          <button
            onClick={() => onPageChange(totalPages)}
            className={`rounded-full px-3 py-1 transition ${
              currentPage === totalPages
                ? "bg-blue-600 text-white"
                : "hover:bg-blue-100 dark:hover:bg-blue-900"
            }`}
          >
            {totalPages}
          </button>
        </>
      )}
      <button
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        className="rounded-full p-2 transition hover:bg-blue-100 disabled:opacity-50 dark:hover:bg-blue-900"
      >
        <IoIosArrowForward />
      </button>
    </nav>
  );
};

export default Pagination;
