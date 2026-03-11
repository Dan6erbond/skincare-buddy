"use client";

import { ArrowLeft, Library, ShieldCheck, Tags } from "lucide-react";
import {
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/react";

import Link from "next/link";
import UserDropdown from "@/components/ui/user-dropdown";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function AdminNavbar() {
  const pathname = usePathname();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const adminLinks = [
    { label: "Catalog", href: "/admin/products", icon: Library },
    { label: "Brands", href: "/admin/brands", icon: Tags },
  ];

  return (
    <Navbar
      isBordered
      maxWidth="xl"
      position="sticky"
      onMenuOpenChange={setIsMenuOpen}
      isMenuOpen={isMenuOpen}
    >
      <NavbarContent>
        <NavbarMenuToggle
          aria-label={isMenuOpen ? "Close menu" : "Open menu"}
          className="sm:hidden"
        />
        <NavbarBrand className="gap-2" as={Link} href="/admin">
          <ShieldCheck className="text-secondary size-5" />
          <p className="hidden sm:block font-bold text-secondary uppercase tracking-wider text-sm">
            Admin <span className="text-foreground">Console</span>
          </p>
        </NavbarBrand>
      </NavbarContent>

      <NavbarContent className="hidden sm:flex gap-6" justify="center">
        {adminLinks.map((link) => {
          const isActive = pathname === link.href;
          return (
            <NavbarItem key={link.href} isActive={isActive}>
              <Link
                href={link.href}
                className={`flex items-center gap-2 text-sm font-medium ${
                  isActive
                    ? "text-primary"
                    : "text-default-600 hover:text-primary"
                }`}
              >
                <link.icon className="size-4" />
                {link.label}
              </Link>
            </NavbarItem>
          );
        })}
      </NavbarContent>

      <NavbarContent justify="end">
        <NavbarItem>
          <Button
            as={Link}
            href="/dashboard"
            variant="ghost"
            size="sm"
            startContent={<ArrowLeft className="size-4" />}
          >
            Back to App
          </Button>
        </NavbarItem>

        <UserDropdown />
      </NavbarContent>

      {/* Mobile Navigation Menu */}
      <NavbarMenu className="mt-4 flex flex-col gap-2">
        {adminLinks.map((link) => (
          <NavbarMenuItem key={link.href}>
            <Link
              href={link.href}
              className={`flex w-full items-center gap-4 p-2 rounded-lg ${
                pathname === link.href
                  ? "bg-primary/10 text-primary"
                  : "text-default-600"
              }`}
              onClick={() => setIsMenuOpen(false)}
            >
              <link.icon className="size-5" />
              <span className="text-lg font-medium">{link.label}</span>
            </Link>
          </NavbarMenuItem>
        ))}
      </NavbarMenu>
    </Navbar>
  );
}
