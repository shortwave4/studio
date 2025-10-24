"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  MessageSquare,
  Users,
  Image as ImageIcon,
  ShoppingBag,
  Settings,
  Flame,
} from "lucide-react";

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from "@/components/ui/sidebar";

export function MainNav() {
  const pathname = usePathname();

  const menuItems = [
    { href: "/", label: "Discover", icon: Users },
    { href: "/chat", label: "Chat", icon: MessageSquare },
    { href: "/status", label: "Status", icon: ImageIcon },
    { href: "/products", label: "Products", icon: ShoppingBag },
    { href: "/settings", label: "Settings", icon: Settings },
  ];

  return (
    <SidebarMenu>
      {menuItems.map(({ href, label, icon: Icon }) => (
        <SidebarMenuItem key={href}>
          <Link href={href} passHref legacyBehavior>
            <SidebarMenuButton
              asChild
              isActive={pathname === href}
              tooltip={label}
            >
              <a>
                <Icon />
                <span>{label}</span>
              </a>
            </SidebarMenuButton>
          </Link>
        </SidebarMenuItem>
      ))}
    </SidebarMenu>
  );
}
