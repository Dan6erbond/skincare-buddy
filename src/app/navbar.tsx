"use client";

import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar,
  NavbarBrand,
  NavbarContent,
  NavbarItem,
  NavbarMenu,
  NavbarMenuItem,
  NavbarMenuToggle,
} from "@heroui/react";
import {
  Beaker,
  Calendar,
  Heart,
  LayoutDashboard,
  LogOut,
  Package,
  User as UserIcon,
} from "lucide-react";

import Link from "next/link";
import React from "react";
import { signOut } from "@/lib/appwrite/server";
import { useAuth } from "@/contexts/auth";
import { usePathname } from "next/navigation";

export default function AppNavbar() {
  const { user } = useAuth();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const navLinks = [
    { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
    { label: "Products", href: "/products", icon: Package },
    { label: "Wishlist", href: "/wishlist", icon: Heart },
    { label: "Routines", href: "/routines", icon: Calendar },
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
          <div className="bg-primary/10 p-2 rounded-lg group-hover:bg-primary/20 transition-colors">
            <Beaker className="text-primary" size={20} />
          </div>
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
        {user ? (
          <Dropdown placement="bottom-end">
            <DropdownTrigger>
              <Avatar
                isBordered
                as="button"
                className="transition-transform"
                color="primary"
                name={user?.name}
                size="sm"
              />
            </DropdownTrigger>
            <DropdownMenu aria-label="Profile Actions" variant="flat">
              <DropdownItem
                key="profile_header"
                className="h-14 gap-2"
                textValue="Signed in as"
              >
                <p className="text-xs text-default-500">Signed in as</p>
                <p className="font-semibold">{user?.email || "Guest"}</p>
              </DropdownItem>

              <DropdownItem
                key="profile"
                as={Link}
                startContent={<UserIcon className="size-4" />}
                href="/profile"
              >
                My Profile
              </DropdownItem>

              <DropdownItem
                key="logout"
                color="danger"
                className="text-danger"
                startContent={<LogOut className="size-4" />}
                onPress={() => signOut()}
              >
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        ) : (
          <NavbarItem>
            <Button
              as={Link}
              color="primary"
              href="/login"
              variant="flat"
              size="sm"
            >
              Login
            </Button>
          </NavbarItem>
        )}
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
      </NavbarMenu>
    </Navbar>
  );
}
