"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { FormLabel } from "@/components/ui/FormLabel";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { RequestReset } from "@/services/SignInService";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [fieldError, setFieldError] = useState<string>("");

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
    if (fieldError) setFieldError("");
  };

  const validateEmail = (): boolean => {
    if (!email.trim()) {
      setFieldError("Email is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setFieldError("Please enter a valid email address");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateEmail()) return;

    setIsLoading(true);

    try {
      await RequestReset({ email });
      setEmail("");
      Toast({ message: "Password reset link sent to mail", type: "success" });
    } catch (err: any) {
      Toast({ message: err.message || "Something went wrong", type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-8 shadow-xl">
        {/* Title */}
        <h2 className="mb-2 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
          Forgot Password
        </h2>
        <p className="mb-6 text-center text-sm text-gray-500 dark:text-gray-300">
          Enter your email to reset your password
        </p>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <FormLabel label="Email" required />
            <TextField
              name="email"
              type="email"
              value={email}
              onChange={handleChange}
              placeholder="Enter your admin email"
              error={fieldError}
            />
          </div>

          <Button
            variant="primary"
            className="w-full rounded-lg py-2 text-base font-medium"
            type="submit"
          >
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </form>
        <div className="mt-6 text-center">
          <span
            onClick={() => router.push("/admin/signin")}
            className="cursor-pointer text-sm font-medium text-primary hover:underline"
          >
            ← Back to Sign in
          </span>
        </div>
      </div>
    </div>
  );
}
