import logo from "../../public/logo_dark.svg";
import darkLogo from "../../public/logo_light.svg";
import Image from "next/image";

export function Logo() {
  return (
    <div className="relative h-20 flex items-center justify-center">
      <Image
        src={logo}
        className="w-56 dark:hidden"
        alt="SuperCheapTyre Admin logo"
        role="presentation"
        quality={100}
      />
      <Image
        src={darkLogo}
        className="w-56 hidden dark:block"
        alt="SuperCheapTyre Admin logo"
        role="presentation"
        quality={100}
      />
    </div>
  );
}
