import { createPortal } from "react-dom";
import { MouseEvent, ReactNode } from "react";
import { IoMdClose } from "react-icons/io";

interface CommonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export default function CommonDialog({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}: CommonDialogProps) {
  if (!isOpen) return null;

  const sizeClass =
    size === "sm"
      ? "max-w-sm"
      : size === "lg"
        ? "max-w-3xl"
        : size === "xl"
          ? "max-w-5xl"
          : "max-w-md";

  const handleDialogClick = (e: MouseEvent) => e.stopPropagation();

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className={`w-full rounded-xl bg-white shadow-lg dark:bg-gray-900 ${sizeClass} relative max-h-[90vh] flex flex-col p-4 sm:p-6`}
        onClick={handleDialogClick}
      >
        <div className="mb-4 flex items-center justify-between flex-shrink-0">
          {title && (
            <div className="w-full">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                {title}
              </h2>
            </div>
          )}
          <div className="w-full flex justify-end">
            <button
              onClick={onClose}
              className="rounded-xl p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <IoMdClose size={20} className="text-gray-700 dark:text-gray-300" />
            </button>
          </div>
        </div>

        <div className="mb-4 text-gray-800 dark:text-gray-200 flex-1 overflow-y-auto min-h-0">{children}</div>

        {footer && <div className="flex justify-end space-x-2 pt-4 border-t border-gray-100 dark:border-gray-800 flex-shrink-0">{footer}</div>}
      </div>
    </div>,
    document.body
  );
}
