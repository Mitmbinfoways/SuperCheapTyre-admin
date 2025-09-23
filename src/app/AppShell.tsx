"use client";

import { Header } from "@/components/Layouts/header";
import { Sidebar } from "@/components/Layouts/sidebar";
import { usePathname, useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";

export default function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const authOnlyRoutes = ["/signin", "/forgot-password" , "/reset-password"];
  const isAuthOnlyPage = authOnlyRoutes.includes(pathname);

  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    try {
      const token =
        typeof window !== "undefined"
          ? sessionStorage.getItem("authToken")
          : null;
      const authorized = Boolean(token);
      setIsAuthorized(authorized);
      setHasCheckedAuth(true);

      if (!authorized && !isAuthOnlyPage) {
        router.replace("/signin");
      }
    } catch {
      setIsAuthorized(false);
      setHasCheckedAuth(true);
      if (!isAuthOnlyPage) {
        router.replace("/signin");
      }
    }
  }, [pathname, isAuthOnlyPage, router]);

  if (isAuthOnlyPage) {
    return <div className="w-full dark:bg-[#020d1a]">{children}</div>;
  }

  if (!hasCheckedAuth) {
    // Render a lightweight shell to avoid blank screen and improve LCP
    return (
      <div className="flex min-h-screen">
        <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
          <div className="sticky top-0 z-10 h-[56px] border-b border-stroke bg-white shadow-1 dark:border-stroke-dark dark:bg-gray-dark" />
          <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10" />
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return null;
  }

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="w-full bg-gray-2 dark:bg-[#020d1a]">
        <Header />

        <main className="isolate mx-auto w-full max-w-screen-2xl overflow-hidden p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    </div>
  );
}
