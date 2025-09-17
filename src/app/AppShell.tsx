"use client";

import { Header } from "@/components/Layouts/header";
import { Sidebar } from "@/components/Layouts/sidebar";
import { usePathname } from "next/navigation";
import type { PropsWithChildren } from "react";

export default function AppShell({ children }: PropsWithChildren) {
  const pathname = usePathname();
  const isAuthOnlyPage = pathname === "/login";

  if (isAuthOnlyPage) {
    return (
      <div className="min-h-screen w-full bg-gray-2 dark:bg-[#020d1a]">
        <main className="isolate mx-auto flex min-h-screen w-full max-w-screen-2xl items-center justify-center p-4 md:p-6 2xl:p-10">
          {children}
        </main>
      </div>
    );
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


