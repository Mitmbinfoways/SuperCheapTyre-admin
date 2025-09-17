import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Login",
};

export default function LoginPage() {
  return (
    <div className="w-full max-w-[880px] rounded-[10px] bg-white p-6 shadow-1 dark:bg-gray-dark dark:shadow-card sm:p-10">
      Hello
    </div>
  );
}