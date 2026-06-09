import Image from "next/image";
import Link from "next/link";

export function Header() {
  return (
    <header className="sticky top-0 z-20 flex items-center justify-center border-b border-white/10 bg-gz-bg/95 px-4 py-3 backdrop-blur">
      <Link href="/" aria-label="GoalZone home" className="flex items-center">
        <Image src="/logo.jpeg" alt="The Goal Zone" width={120} height={48} priority className="h-10 w-auto" />
      </Link>
    </header>
  );
}
