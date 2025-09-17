// components/CommonDialog.tsx
import React, { ReactNode } from "react";
import { IoMdClose } from "react-icons/io";

interface CommonDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: "sm" | "md" | "lg"; // optional sizes
}

const CommonDialog: React.FC<CommonDialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "md",
}) => {
  if (!isOpen) return null;

  // Width based on size
  const sizeClass =
    size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-3xl" : "max-w-md"; // default md

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div
        className={`w-full rounded-xl bg-white shadow-lg dark:bg-gray-900 ${sizeClass} relative p-6`}
      >
        {/* Title */}
        <div className="mb-4 flex items-center justify-between">
          {title && (
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="rounded-xl p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <IoMdClose size={20} className="text-gray-700 dark:text-gray-300" />
          </button>
        </div>

        {/* Content */}
        <div className="mb-4 text-gray-800 dark:text-gray-200">{children}</div>

        {/* Footer */}
        {footer && <div className="flex justify-end space-x-2">{footer}</div>}
      </div>
    </div>
  );
};

export default CommonDialog;
