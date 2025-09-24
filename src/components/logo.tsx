import logo from "../../public/logo_dark.svg";
import darkLogo from "../../public/logo_light.svg";
import Image from "next/image";

export function Logo() {
  return (
    <div className="relative h-20">
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
