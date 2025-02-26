"use client";
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation";

export function Header() {
  const router = useRouter();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 tomorrow">
      <div className="flex items-center justify-between px-6 py-4 backdrop-blur-xl bg-gray-400 dark:bg-black/50">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-3">
            <Image
              src="cred-vault-logo.svg"
              alt="CredsVault"
              width={50}
              height={50}
              className="w-10 h-10"
            />
            <span className="font-semibold text-white">CredsVault</span>
          </Link>
        </div>
        <nav className="hidden md:flex items-center gap-8">
          <Link href="#" className="text-md text-white dark:text-gray-300 hover:text-white transition-colors">
            Services
          </Link>
          <Link href="#" className="text-sm text-white dark:text-gray-300 hover:text-white transition-colors">
            About
          </Link>
          <Link href="#" className="text-sm text-white dark:text-gray-300 hover:text-white transition-colors">
            Community
          </Link>
          <Link href="#" className="text-sm text-white dark:text-gray-300 hover:text-white transition-colors">
            Help/FAQ
          </Link>
          <Link href="#" className="text-sm text-white hover:text-white transition-colors">
            Contact
          </Link>
        </nav>
        <Button variant="secondary" className="bg-white text-black hover:bg-gray-100" onClick={() => router.push('/user/login')}>
          Login
        </Button>
      </div>
    </header>
  )
}

