interface FormLabelProps {
  label: string;
  required?: boolean;
  htmlFor?: string;
}

export const FormLabel: React.FC<FormLabelProps> = ({
  label,
  required = false,
  htmlFor,
}) => {
  return (
    <label
      htmlFor={htmlFor}
      className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
    >
      {label} {required && <span className="text-red-500">*</span>}
    </label>
  );
};
