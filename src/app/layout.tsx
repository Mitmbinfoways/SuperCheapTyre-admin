import "@/css/satoshi.css";
import "@/css/style.css";

import AppShell from "./AppShell";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";
import ClientOnly from "@/components/ClientOnly";

export const metadata: Metadata = {
  title: {
    template: "SuperCheapTyre Admin",
    default: "SuperCheapTyre Admin",
  },
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <NextTopLoader color="#5750F1" showSpinner={false} />

          <ClientOnly>
            <AppShell>{children}</AppShell>
          </ClientOnly>
        </Providers>
      </body>
    </html>
  );
}
