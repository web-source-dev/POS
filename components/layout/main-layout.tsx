"use client"

import type React from "react"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  BarChart3,
  Box,
  ClipboardList,
  DollarSign,
  Home,
  Menu,
  Settings,
  ShoppingCart,
  Truck,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/lib/auth"
import { UserAuthMenu } from "@/components/auth/user-auth-menu"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const { isAdmin } = useAuth()

  const routes = [
    {
      href: "/",
      label: "Dashboard",
      icon: Home,
      active: pathname === "/",
    },
    {
      href: "/pos",
      label: "POS",
      icon: ShoppingCart,
      active: pathname === "/pos",
    },
    {
      href: "/inventory",
      label: "Inventory",
      icon: Box,
      active: pathname === "/inventory",
    },
    {
      href: "/suppliers",
      label: "Suppliers",
      icon: Truck,
      active: pathname === "/suppliers",
    },
    {
      href: "/purchases",
      label: "Purchases",
      icon: ClipboardList,
      active: pathname === "/purchases",
    },
    {
      href: "/reports",
      label: "Reports",
      icon: BarChart3,
      active: pathname === "/reports",
    },
    {
      href: "/finance",
      label: "Finance",
      icon: DollarSign,
      active: pathname === "/finance",
    },
    {
      href: "/settings",
      label: "Settings",
      icon: Settings,
      active: pathname === "/settings",
    },
  ]

  // Add admin route if user is admin
  if (isAdmin && isAdmin()) {
    routes.push({
      href: "/admin",
      label: "Admin",
      icon: Settings,
      active: pathname === "/admin",
    });
  }

  return (
    <div className="h-full">
      {/* Mobile Navigation */}
      <Sheet open={open} onOpenChange={setOpen}>
        <div className="flex items-center border-b h-16 px-4 lg:hidden">
          <Button variant="ghost" size="icon" onClick={() => setOpen(true)}>
            <Menu className="h-6 w-6" />
          </Button>
          <div className="flex items-center gap-2">
            <ModeToggle />
          </div>
        </div>
        <SheetContent side="left">
          <div className="flex flex-col p-2">
            {routes.map((route) => (
              <Link
                key={route.href}
                href={route.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-x-2 text-sm font-medium px-3 py-2 rounded-md transition-colors",
                  route.active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                )}
              >
                <route.icon className="h-5 w-5" />
                {route.label}
              </Link>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Desktop Navigation */}
      <div className="hidden lg:flex h-full w-72 flex-col fixed inset-y-0 z-50">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold mb-1">POS System</h2>
          <p className="text-sm text-muted-foreground">Inventory & POS System</p>
        </div>
        <div className="flex flex-col p-3 space-y-1 flex-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={cn(
                "flex items-center gap-x-2 text-sm font-medium px-3 py-2 rounded-md transition-colors",
                route.active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
              )}
            >
              <route.icon className="h-5 w-5" />
              {route.label}
            </Link>
          ))}
        </div>
        <div className="p-4 border-t flex items-center justify-between">
          <UserAuthMenu />
          <ModeToggle />
        </div>
      </div>

      {/* Main Content */}
      <div className="lg:pl-72 h-full">
        <div className="h-full pt-0 lg:pt-0">{children}</div>
      </div>
    </div>
  )
}
