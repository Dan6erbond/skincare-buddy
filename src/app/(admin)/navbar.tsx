"use client";

import { ArrowLeft, Library, ShieldCheck, Tags } from "lucide-react";
import {
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
} from "@heroui/react";

import Link from "next/link";
import UserDropdown from "@/components/ui/user-dropdown";
import { usePathname } from "next/navigation";

export default function AdminNavbar() {
  const pathname = usePathname();

  const adminLinks = [
    { label: "Catalog", href: "/admin/products", icon: Library },
    { label: "Brands", href: "/admin/brands", icon: Tags },
  ];

  return (
    <Navbar
      isBordered
      maxWidth="xl"
      className="bg-content1/50 backdrop-blur-md border-b-secondary/20"
      position="sticky"
    >
      <NavbarBrand className="gap-2" as={Link} href="/admin">
        <ShieldCheck className="text-secondary size-5" />
        <p className="font-bold text-secondary uppercase tracking-wider text-sm">
          Admin <span className="text-foreground">Console</span>
        </p>
      </NavbarBrand>

      <NavbarContent className="flex gap-4" justify="center">
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
    </Navbar>
  );
}
