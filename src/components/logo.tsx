import darkLogo from "../../public/logos/dark.svg";
import logo from "../../public/logos/main.svg";
import Image from "next/image";

export function Logo() {
  return (
    <div className="relative h-8 max-w-[10.847rem]">
      <Image
        src={logo}
        fill
        className="dark:hidden"
        alt="SuperCheapTyre Admin logo"
        role="presentation"
        quality={100}
      />

      <Image
        src={darkLogo}
        fill
        className="hidden dark:block"
        alt="SuperCheapTyre Admin logo"
        role="presentation"
        quality={100}
      />
    </div>
  );
}
