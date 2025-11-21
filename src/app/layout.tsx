import "@/css/satoshi.css";
import "@/css/style.css";

import AppShell from "./AppShell";

import "flatpickr/dist/flatpickr.min.css";
import "jsvectormap/dist/jsvectormap.css";

import type { Metadata } from "next";
import NextTopLoader from "nextjs-toploader";
import type { PropsWithChildren } from "react";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: {
    template: "SuperCheapTyre Admin",
    default: "SuperCheapTyre Admin",
  },
  icons: {
    icon: "/admin/favicon.png"
  }
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <NextTopLoader color="#5750F1" showSpinner={false} />
          <AppShell>{children}</AppShell>
        </Providers>
        {/* Portal container for datepickers and other overlays */}
        <div id="root-portal"></div>
      </body>
    </html>
  );
}