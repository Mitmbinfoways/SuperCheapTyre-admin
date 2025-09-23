"use client";

import { useState, ChangeEvent, useEffect } from "react";
import { FormLabel } from "@/components/ui/FormLabel";
import TextField from "@/components/ui/TextField";
import Image from "next/image";
import Button from "@/components/ui/Button";
import { signIn } from "@/services/SignInService";
import { Toast } from "@/components/ui/Toast";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const router = useRouter();
  
  useEffect(() => {
      const existingToken = typeof window !== "undefined" ? sessionStorage.getItem("authToken") : null;
      if (existingToken) {
        router.replace("/");
      }
  }, [router]);

  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value);
  const handlePasswordChange = (e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);
    try {
      const response = await signIn({ email, password });
      if (response?.data?.token) {
        sessionStorage.setItem("authToken", response.data.token);
      }
      if (response?.data?.admin) {
        localStorage.setItem("adminUser", JSON.stringify(response.data.admin));
      }
      Toast({ message: response?.message || "Signed in successfully", type: "success" });
      router.replace("/");
    } catch (error: any) {
      const apiMessage = error?.response?.data?.message || error?.message || "Failed to sign in";
      setErrorMessage(apiMessage);
      Toast({ message: apiMessage, type: "error" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
        <div className="flex justify-center mb-6 relative h-24 w-24">
          <Image
            src="/logo.png"
            alt="Logo"
            fill
            className="object-contain"
          />
        </div>
        <h2 className="text-center text-2xl font-bold text-gray-900 mb-6">
          Sign in to SuperCheapTyre
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <FormLabel label="Email address" required />
            <TextField
              name="email"
              type="email"
              value={email}
              onChange={handleEmailChange}
              placeholder="Enter your email"
              required
              className="mt-2 block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <div className="flex items-center justify-between">
              <FormLabel label="Password" required />
              <div className="text-sm mb-2">
                <a href="/forgot" className="font-medium  text-indigo-600 hover:text-indigo-500">
                  Forgot password?
                </a>
              </div>
            </div>
            <TextField
              name="password"
              type="password"
              value={password}
              onChange={handlePasswordChange}
              placeholder="Enter your password"
              required
            />
          </div>
          {errorMessage && (
            <p className="text-sm text-red-600" role="alert">{errorMessage}</p>
          )}

          <Button variant="primary" className="w-full" type="submit" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign in"}
          </Button>
        </form>
      </div>
    </div>
  );
}
