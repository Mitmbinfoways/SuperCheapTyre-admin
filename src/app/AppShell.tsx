"use client";

import { Header } from "@/components/Layouts/header";
import { Sidebar } from "@/components/Layouts/sidebar";
import { usePathname, useRouter } from "next/navigation";
import type { PropsWithChildren } from "react";
import { useEffect, useState } from "react";

export default function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const router = useRouter();
  const isAuthOnlyPage = pathname === "/signin";

  const [hasCheckedAuth, setHasCheckedAuth] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    try {
      const token = typeof window !== "undefined" ? sessionStorage.getItem("authToken") : null;
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
    return (
      <div className="w-full dark:bg-[#020d1a]">
        
          {children}
        
      </div>
    );
  }

  // Avoid flashing protected content before auth check completes
  if (!hasCheckedAuth) {
    return null;
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


