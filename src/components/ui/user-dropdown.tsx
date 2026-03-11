"use client";

import {
  Avatar,
  Button,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
  NavbarItem,
} from "@heroui/react";
import { LogOut, User as UserIcon } from "lucide-react";

import Link from "next/link";
import { signOut } from "@/lib/appwrite/server";
import { useAuth } from "@/contexts/auth";

export default function UserDropdown() {
  const { user } = useAuth();

  return user ? (
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
      <Button as={Link} color="primary" href="/login" variant="flat" size="sm">
        Login
      </Button>
    </NavbarItem>
  );
}
