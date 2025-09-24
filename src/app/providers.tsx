"use client";

import { SidebarProvider } from "@/components/Layouts/sidebar/sidebar-context";
import { ThemeProvider } from "next-themes";
import { Toaster } from "react-hot-toast";
import { Provider } from "react-redux";
import { store } from "@/Store/Store";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider defaultTheme="light" attribute="class">
      <Provider store={store}>
        <SidebarProvider>
          <Toaster position="top-right" />
          {children}
        </SidebarProvider>
      </Provider>
    </ThemeProvider>
  );
}
