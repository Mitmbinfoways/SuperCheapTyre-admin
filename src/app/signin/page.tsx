"use client";

import { useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FormLabel } from "@/components/ui/FormLabel";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { signIn } from "@/services/SignInService";
import { Toast } from "@/components/ui/Toast";

interface FieldErrors {
  email?: string;
  password?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const router = useRouter();

  // useEffect(() => {
  //   const existingToken =
  //     typeof window !== "undefined"
  //       ? sessionStorage.getItem("authToken")
  //       : null;
  //   if (existingToken) router.replace("/");
  // }, [router]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: keyof FieldErrors,
  ) => {
    const value = e.target.value;

    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);

    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateFields = (): FieldErrors => {
    const errors: FieldErrors = {};

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      errors.email = "Email is required";
    } else if (!emailRegex.test(email)) {
      errors.email = "Please enter a valid email address";
    }

    if (!password.trim()) {
      errors.password = "Password is required";
    }
    return errors;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);

    const errors = validateFields();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsLoading(true);
    try {
      const response = await signIn({ email, password });

      const token = response?.data?.token;
      const admin = response?.data?.admin;

      if (token) sessionStorage.setItem("authToken", token);
      if (admin) localStorage.setItem("adminUser", JSON.stringify(admin));

      Toast({
        message: response?.message || "Signed in successfully",
        type: "success",
      });

      router.replace("/");
    } catch (error: any) {
      console.log(error.response.data.errorData);
      const apiMessage =
      error.response.data.errorData || "Failed to sign in";
      setErrorMessage(apiMessage);
      Toast({ message: apiMessage, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg">
        <div className="relative mb-6 flex h-24 w-24 justify-center">
          <Image src="/logo.png" alt="Logo" fill className="object-contain" />
        </div>
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">
          Sign in to SuperCheapTyre
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5" noValidate>
          <div>
            <FormLabel label="Email address" required />
            <TextField
              name="email"
              type="email"
              value={email}
              onChange={(e) => handleChange(e, "email")}
              placeholder="Enter your email"
              error={fieldErrors.email}
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <FormLabel label="Password" required />
              <div className="mb-2 text-sm">
                <a
                  href="/forgot-password"
                  className="font-medium text-indigo-600 hover:text-indigo-500"
                >
                  Forgot password?
                </a>
              </div>
            </div>
            <TextField
              name="password"
              type="password"
              value={password}
              onChange={(e) => handleChange(e, "password")}
              placeholder="Enter your password"
              error={fieldErrors.password}
            />
          </div>

          {errorMessage && (
            <p className="text-sm text-red-600" role="alert">
              {errorMessage}
            </p>
          )}

          <Button
            variant="primary"
            className="w-full"
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
