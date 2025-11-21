// Utility functions for consistent pagination behavior across the application

/**
 * Determines if we should navigate to the previous page after deleting the last item on a page
 * @param itemsOnCurrentPage Number of items on the current page
 * @param currentPage Current page number (1-based)
 * @param totalPages Total number of pages
 * @returns True if we should navigate to the previous page
 */
export const shouldNavigateToPreviousPage = (
  itemsOnCurrentPage: number,
  currentPage: number,
  totalPages: number
): boolean => {
  // Navigate to previous page if:
  // 1. We're deleting the last item on the current page
  // 2. We're not on the first page
  // 3. We're on the last page (to avoid showing an empty page)
  return itemsOnCurrentPage === 1 && currentPage > 1 && currentPage === totalPages;
};

/**
 * Calculates the new page after a deletion operation
 * @param itemsOnCurrentPage Number of items on the current page
 * @param currentPage Current page number (1-based)
 * @param totalPages Total number of pages
 * @returns The new page number to navigate to
 */
export const calculatePageAfterDeletion = (
  itemsOnCurrentPage: number,
  currentPage: number,
  totalPages: number
): number => {
  if (shouldNavigateToPreviousPage(itemsOnCurrentPage, currentPage, totalPages)) {
    return currentPage - 1;
  }
  return currentPage;
};