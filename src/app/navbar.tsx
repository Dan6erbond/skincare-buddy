"use client";

import {
  Avatar,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  Navbar,
  NavbarBrand,
  NavbarContent,
} from "@heroui/react";
import { Beaker, LogOut, User as UserIcon } from "lucide-react";

import Link from "next/link";
import { signOut } from "@/lib/appwrite/server";
import { useAuth } from "@/contexts/auth";

export default function AppNavbar() {
  const { user } = useAuth();

  return (
    <Navbar isBordered maxWidth="xl">
      <NavbarBrand
        as={Link}
        href={user ? "/dashboard" : "/"}
        className="gap-2 group"
      >
        <div className="bg-primary/10 p-2 rounded-lg">
          <Beaker className="text-primary" size={20} />
        </div>
        <p className="font-black text-inherit uppercase tracking-tighter text-xl">
          Skincare<span className="text-primary">Buddy</span>
        </p>
      </NavbarBrand>

      <NavbarContent as="div" justify="end">
        {user && (
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
                startContent={<UserIcon size={16} />}
                href="/profile"
              >
                My Profile
              </DropdownItem>

              <DropdownItem
                key="logout"
                color="danger"
                className="text-danger"
                startContent={<LogOut size={16} />}
                onPress={() => signOut()}
              >
                Log Out
              </DropdownItem>
            </DropdownMenu>
          </Dropdown>
        )}
      </NavbarContent>
    </Navbar>
  );
}
