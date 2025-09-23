"use client";

import { useState, ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { FormLabel } from "@/components/ui/FormLabel";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
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

      setEmail("");
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
          Forgot Password
        </h2>

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
            className="w-full"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Sending..." : "Send"}
          </Button>
        </form>
      </div>
    </div>
  );
}
