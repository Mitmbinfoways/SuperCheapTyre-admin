"use client";

import Image from "next/image";
import Link from "next/link";
import { useSidebarContext } from "../sidebar/sidebar-context";
import { MenuIcon } from "./icons";
import { ThemeToggleSwitch } from "./theme-toggle";
import { UserInfo } from "./user-info";
import logo from "../../../../public/logo_dark.svg"
import DarkLogo from "../../../../public/logo_light.svg"

export function Header() {
  const { toggleSidebar, isMobile } = useSidebarContext();

  return (
    <header className="sticky top-0 z-10 flex items-center justify-between border-b border-stroke bg-white px-4 py-3 shadow-1 dark:border-stroke-dark dark:bg-gray-dark md:px-5 2xl:px-10">
      <button
        onClick={toggleSidebar}
        className="rounded-lg border px-1.5 py-1 dark:border-stroke-dark dark:bg-[#020D1A] hover:dark:bg-[#FFFFFF1A] xl:hidden "
      >
        <MenuIcon />
        <span className="sr-only">Toggle Sidebar</span>
      </button>

      {isMobile && (
        <Link href="/admin" className="ml-2 max-[430px]:hidden min-[375px]:ml-4">
          <Image
            src={DarkLogo}
            alt="logo"
            width={120}
            height={0}
            className="h-14 object-contain dark:hidden"
            priority
          />
          <Image
            src={logo}
            alt="logo"
            width={120}
            height={0}
            className="hidden h-14 object-contain dark:block"
            priority
          />
        </Link>
      )}

      <div className="flex flex-1 items-center justify-end gap-2 min-[375px]:gap-4">
        <ThemeToggleSwitch />
        <div className="shrink-0">
          <UserInfo />
        </div>
      </div>
    </header>
  );
}