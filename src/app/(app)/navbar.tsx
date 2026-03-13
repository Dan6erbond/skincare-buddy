"use client";

import * as queryKeys from "@/lib/query/keys";

import { BookOpen, Calendar, Heart, Package, ShieldCheck } from "lucide-react";
import {
  Button,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
  Tooltip,
} from "@heroui/react";

import Image from "next/image";
import Link from "next/link";
import { Query } from "appwrite";
import UserDropdown from "@/components/ui/user-dropdown";
import { teamIds } from "@/lib/appwrite/const";
import { useAppwrite } from "@/contexts/appwrite";
import { useAuth } from "@/contexts/auth";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";

export default function AppNavbar() {
  const pathname = usePathname();

  const { user } = useAuth();
  const { teams } = useAppwrite();

  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const { data: isAdmin } = useQuery({
    queryKey: queryKeys.userTeamMemberships(user?.$id ?? "", teamIds.admins),
    queryFn: async () => {
      if (!user?.$id) return false;
      const { total } = await teams.listMemberships({
        teamId: teamIds.admins,
        queries: [Query.equal("userId", user.$id)],
      });
      return total > 0;
    },
    enabled: !!user?.$id,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  const navLinks = [
    { label: "Products", href: "/products", icon: Package },
    { label: "Wishlist", href: "/wishlist", icon: Heart },
    { label: "Routines", href: "/routines", icon: Calendar },
    { label: "Journal", href: "/journal", icon: BookOpen },
  ];

  return (
    <Navbar
      isBordered
      maxWidth="xl"
      onMenuOpenChange={setIsMenuOpen}
      isMenuOpen={isMenuOpen}
    >
      <NavbarContent>
        {user && (
          <NavbarMenuToggle
            aria-label={isMenuOpen ? "Close menu" : "Open menu"}
            className="sm:hidden"
          />
        )}
        <NavbarBrand
          as={Link}
          href={user ? "/dashboard" : "/"}
          className="gap-2 group"
        >
          <Image src="/logo.png" height={50} width={50} alt="Skincare Buddy" />
          <p className="font-black text-inherit uppercase tracking-tighter text-xl">
            Skincare<span className="text-primary">Buddy</span>
          </p>
        </NavbarBrand>
      </NavbarContent>

      {/* Desktop Navigation */}
      {user && (
        <NavbarContent className="hidden sm:flex gap-6" justify="center">
          {navLinks.map((link) => (
            <NavbarItem key={link.href} isActive={pathname === link.href}>
              <Link
                href={link.href}
                className={`flex items-center gap-2 text-sm font-medium ${
                  pathname === link.href
                    ? "text-primary"
                    : "text-default-600 hover:text-primary"
                }`}
              >
                <link.icon className="size-4" />
                {link.label}
              </Link>
            </NavbarItem>
          ))}
        </NavbarContent>
      )}

      <NavbarContent as="div" justify="end">
        {isAdmin && (
          <Tooltip content="Admin Panel" closeDelay={0}>
            <Button
              as={Link}
              href="/admin"
              isIconOnly
              variant="light"
              radius="full"
              color="secondary"
              className="hidden sm:flex" // Hide on tiny screens if avatar is enough
            >
              <ShieldCheck className="size-5" />
            </Button>
          </Tooltip>
        )}

        <UserDropdown />
      </NavbarContent>

      {/* Mobile Navigation Menu */}
      <NavbarMenu className="mt-4 flex flex-col gap-2">
        {navLinks.map((link) => (
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

        {isAdmin && (
          <NavbarMenuItem>
            <Link
              href="/admin"
              className="flex w-full items-center gap-4 p-2 rounded-lg text-secondary"
              onClick={() => setIsMenuOpen(false)}
            >
              <ShieldCheck className="size-5" />
              <span className="text-lg font-medium">Admin Panel</span>
            </Link>
          </NavbarMenuItem>
        )}
      </NavbarMenu>
    </Navbar>
  );
}
