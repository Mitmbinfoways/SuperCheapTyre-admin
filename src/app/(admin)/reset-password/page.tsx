"use client";

import { useState, ChangeEvent } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { FormLabel } from "@/components/ui/FormLabel";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { forgotPassword } from "@/services/SignInService";

interface FieldErrors {
  password?: string;
  confirmPassword?: string;
}

export default function ResetPasswordPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (fieldErrors.password) {
      setFieldErrors((prev) => ({ ...prev, password: undefined }));
    }
  };

  const handleConfirmChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (fieldErrors.confirmPassword) {
      setFieldErrors((prev) => ({ ...prev, confirmPassword: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const errors: FieldErrors = {};

    if (!password.trim()) {
      errors.password = "Password is required";
    }
    if (!confirmPassword.trim()) {
      errors.confirmPassword = "Confirm password is required";
    } else if (password !== confirmPassword) {
      errors.confirmPassword = "Passwords do not match";
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!token) return;
    setIsLoading(true);

    try {
      await forgotPassword({ token, newPassword: password });
      Toast({ message: "Password reset successfully", type: "success" });
      setPassword("");
      setConfirmPassword("");
      router.push("/login");
    } catch (err: any) {
      Toast({ message: "Something went wrong", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md rounded-xl bg-white dark:bg-gray-800 p-8 shadow-lg">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
          Reset Password
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <FormLabel label="New Password" required />
            <TextField
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter new password"
              error={fieldErrors.password}
            />
          </div>

          <div>
            <FormLabel label="Confirm Password" required />
            <TextField
              type="password"
              value={confirmPassword}
              onChange={handleConfirmChange}
              placeholder="Confirm new password"
              error={fieldErrors.confirmPassword}
            />
          </div>

          <Button
            variant="primary"
            type="submit"
            className="w-full"
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
