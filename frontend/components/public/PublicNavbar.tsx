"use client";

import { usePathname, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

const navLinks = [
  { label: "Properties", href: "/public-properties" },
  { label: "Student Reels", href: "/reels" },
  { label: "Marketplace", href: "/marketplace" },
  { label: "Offers", href: "/offers" },
  { label: "FAQ", href: "/faq" },
  { label: "Contact", href: "/contact" },
];

export default function PublicNavbar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <header className="border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 sticky top-0 z-50">
      <div className="mx-auto px-6 py-4 flex items-center justify-between">
        <a href="/">
          <img src="/smlogo-t.png" width={220} alt="Student Moves" />
        </a>
        <nav className="hidden md:flex items-center space-x-6">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className={
                pathname === link.href
                  ? "text-primary font-medium transition-colors"
                  : "text-gray-600 hover:text-primary transition-colors"
              }
            >
              {link.label}
            </a>
          ))}
        </nav>
        <Button
          className="cursor-pointer text-white"
          onClick={() => router.push("/auth/signin")}
        >
          Sign In
        </Button>
      </div>
    </header>
  );
}
