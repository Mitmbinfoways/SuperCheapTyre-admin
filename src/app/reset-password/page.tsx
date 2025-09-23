"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { FormLabel } from "@/components/ui/FormLabel";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldError, setFieldError] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    if (fieldError) setFieldError("");
  };

  const handleConfirmChange = (e: ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
    if (fieldError) setFieldError("");
  };

  const validateForm = (): boolean => {
    if (!password.trim() || !confirmPassword.trim()) {
      setFieldError("Both fields are required");
      return false;
    }
    if (password.length < 6) {
      setFieldError("Password must be at least 6 characters");
      return false;
    }
    if (password !== confirmPassword) {
      setFieldError("Passwords do not match");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);

    try {
    } catch (err: any) {
      Toast({ message: err.message || "Something went wrong", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
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
            />
          </div>

          <div>
            <FormLabel label="Confirm Password" required />
            <TextField
              type="password"
              value={confirmPassword}
              onChange={handleConfirmChange}
              placeholder="Confirm new password"
              error={fieldError}
            />
          </div>

          <Button
            variant="primary"
            type="submit"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? "Resetting..." : "Reset Password"}
          </Button>
        </form>
      </div>
    </div>
  );
}
