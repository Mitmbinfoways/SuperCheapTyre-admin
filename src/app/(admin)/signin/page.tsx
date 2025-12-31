"use client";

import { useState, ChangeEvent, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FormLabel } from "@/components/ui/FormLabel";
import TextField from "@/components/ui/TextField";
import Button from "@/components/ui/Button";
import Image from "next/image";
import { signIn } from "@/services/SignInService";
import { verify2FALogin, request2FAReset } from "@/services/TwoFactorService";
import { Toast } from "@/components/ui/Toast";
import logo from "../../../../public/logo_dark.svg";
import Darklogo from "../../../../public/logo_light.svg";
import { setCredentials } from "@/Store/Slice/authSlice";
import { useDispatch } from "react-redux";
import Link from "next/link";

interface FieldErrors {
  email?: string;
  password?: string;
  otp?: string;
}

export default function LoginPage() {
  const [step, setStep] = useState<1 | 2>(1);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [tempToken, setTempToken] = useState<string | null>(null);

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
    if (existingToken) router.replace("/");
  }, [router]);

  const handleChange = (
    e: ChangeEvent<HTMLInputElement>,
    field: keyof FieldErrors,
  ) => {
    const value = e.target.value;

    if (field === "email") setEmail(value);
    if (field === "password") setPassword(value);
    if (field === "otp") setOtp(value);

    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const validateFields = (): FieldErrors => {
    const errors: FieldErrors = {};

    if (step === 1) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!email.trim()) {
        errors.email = "Email is required";
      } else if (!emailRegex.test(email)) {
        errors.email = "Please enter a valid email address";
      }

      if (!password.trim()) {
        errors.password = "Password is required";
      }
    } else {
      if (!otp.trim() || otp.length < 6) {
        errors.otp = "Please enter a valid 6-digit code";
      }
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

    if (step === 1) {
      // Step 1: Initial Login
      try {
        const response = await signIn({ email, password });

        // Check for 2FA requirement (custom response structure)
        if ((response.data as any).requires2FA) {
          setTempToken((response.data as any).tempToken);
          setStep(2);
          setIsLoading(false);
          return;
        }

        const token = response?.data?.token;
        const admin = response?.data?.admin;

        if (token && admin) {
          dispatch(setCredentials({ admin, token }));
          Toast({
            message: response?.message || "Login successful",
            type: "success",
          });
          router.replace("/");
        }
      } catch (error: any) {
        const apiMessage = error.response?.data?.errorData || error.response?.data?.message || "Failed to sign in";
        setErrorMessage(apiMessage);
        setIsLoading(false);
      }
    } else {
      // Step 2: Verify 2FA
      try {
        if (!tempToken) {
          setStep(1);
          return;
        }
        const response = await verify2FALogin(tempToken, otp);

        const token = response?.data?.token;
        const admin = response?.data?.admin;

        if (token && admin) {
          dispatch(setCredentials({ admin, token }));
          Toast({
            message: response?.message || "Login successful",
            type: "success",
          });
          router.replace("/");
        }
      } catch (error: any) {
        const apiMessage = error.response?.data?.errorData || error.response?.data?.message || "Verification failed";
        setErrorMessage(apiMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md rounded-xl bg-white shadow-lg dark:bg-gray-800">
        <div className="relative flex h-24 w-full justify-center bg-gray-800 rounded-t-xl">
          <Image
            src={Darklogo}
            alt="Logo"
            width={200}
            height={80}
            className="object-contain dark:hidden"
            quality={100}
          />
          <Image
            src={Darklogo}
            alt="Logo"
            width={200}
            height={80}
            className="hidden object-contain dark:block"
            quality={100}
          />
        </div>
        <div className="p-8 pt-2">
          <h2 className="mb-6 text-center text-2xl font-bold text-gray-900 dark:text-gray-100">
            {step === 1 ? "Sign in to SuperCheapTyre" : "Two-Factor Authentication"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>

            {step === 1 && (
              <>
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
                      <Link
                        href="/forgot-password"
                        className="font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
                      >
                        Forgot password?
                      </Link>
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
              </>
            )}

            {step === 2 && (
              <div>
                <div className="text-center mb-4 text-sm text-gray-600 dark:text-gray-400">
                  Enter the 6-digit code from your authenticator app
                </div>
                <FormLabel label="Authentication Code" required />
                <TextField
                  name="otp"
                  type="text"
                  value={otp}
                  onChange={(e) => handleChange(e, "otp")}
                  placeholder="000000"
                  error={fieldErrors.otp}
                  maxLength={6}
                  className="text-center tracking-widest text-lg"
                />
                <button
                  type="button"
                  onClick={async () => {
                    if (!tempToken) return;
                    try {
                      setIsLoading(true);
                      await request2FAReset(tempToken);
                      Toast({ message: "Reset link sent to administrator email", type: "success" });
                    } catch (err) {
                      Toast({ message: "Failed to send reset link", type: "error" });
                    } finally {
                      setIsLoading(false);
                    }
                  }}
                  className="w-full text-end text-sm text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 mt-2"
                >
                  Forgot OTP?
                </button>
              </div>

            )}

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
              {isLoading ? "Verifying..." : (step === 1 ? "Sign in" : "Verify")}
            </Button>

            {step === 2 && (
              <>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full text-center text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 mt-2"
                >
                  Back to Login
                </button>
              </>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}
