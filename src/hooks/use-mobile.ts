'use client';
import { useEffect, useState } from "react";

export const MOBILE_BREAKPOINT = 1024;

export function useIsMobile() {
  const [isMobile, setIsMobile] = useState<boolean | null>(null);

  useEffect(() => {
    const onChange = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    onChange();

    const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`);
    mql.addEventListener("change", onChange);

    return () => mql.removeEventListener("change", onChange);
  }, []);

  return isMobile;
}
