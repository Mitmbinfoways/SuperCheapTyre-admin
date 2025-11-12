"use client";

import { useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FormLabel } from "@/components/ui/FormLabel";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { signIn } from "@/services/SignInService";
import { Toast } from "@/components/ui/Toast";
import logo from "../../../../public/logo_dark.svg";
import Darklogo from "../../../../public/logo_light.svg";
import { setCredentials } from "@/Store/Slice/authSlice";
import { useDispatch } from "react-redux";

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
  const dispatch = useDispatch();

  useEffect(() => {
    const existingToken =
      typeof window !== "undefined"
        ? sessionStorage.getItem("authToken")
        : null;
    if (existingToken) router.replace("/admin");
  }, [router]);

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

      if (token && admin) {
        dispatch(setCredentials({ admin, token }));
      }

      Toast({
        message: response?.message || "Login successful",
        type: "success",
      });

      router.replace("/admin");
    } catch (error: any) {
      const apiMessage = error.response?.data?.errorData || "Failed to sign in";
      setErrorMessage(apiMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-xl bg-white p-8 shadow-lg dark:bg-gray-800">
        <div className="relative mb-6 flex h-24 w-full justify-center">
          <Image
            src={logo}
            alt="Logo"
            fill
            className="object-contain dark:hidden"
          />
          <Image
            src={Darklogo}
            alt="Logo"
            fill
            className="hidden object-contain dark:block"
          />
        </div>
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
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
                  href="/admin/forgot-password"
                  className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
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
            <p className="text-sm text-red-600 dark:text-red-400" role="alert">
              {errorMessage}
            </p>
          )}

          <Button
            variant="primary"
            className="w-full"
            type="submit"
          >
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
