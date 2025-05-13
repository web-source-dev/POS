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
  ChevronLeft,
  ChevronRight,
  Calendar,
} from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/lib/auth"
import { UserAuthMenu } from "@/components/auth/user-auth-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Image from "next/image"
interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
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
      href: "/today",
      label: "Today's Sales",
      icon: Calendar,
      active: pathname === "/today",
    },
    {
      href: "/reports",
      label: "Reports",
      icon: BarChart3,
      active: pathname === "/reports",
    },
    {
      href: "/accounting",
      label: "Accounting",
      icon: DollarSign,
      active: pathname === "/accounting",
    },
    {
      href: "/summary",
      label: "Summary",
      icon: BarChart3,
      active: pathname === "/summary",
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
      <div 
        className={cn(
          "hidden lg:flex h-full flex-col fixed inset-y-0 z-50 transition-all duration-300",
          collapsed ? "w-20" : "w-72"
        )}
      >
        <div className={cn(
          "p-6 border-b flex items-center justify-between",
          collapsed && "p-4"
        )}>
          {!collapsed && (
            <div>
              <Image src="/logo.png" alt="Logo" width={100} height={100} className="rounded-full mix-blend-multiply" />
            </div>
          )}
          <Button 
            variant="ghost" 
            size="icon" 
            className={cn("ml-auto")} 
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </Button>
        </div>
        <div className="flex flex-col p-3 space-y-1 flex-1">
          <TooltipProvider>
            {routes.map((route) => (
              collapsed ? (
                <Tooltip key={route.href} delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Link
                      href={route.href}
                      className={cn(
                        "flex items-center justify-center py-2 rounded-md transition-colors",
                        route.active ? "bg-primary text-primary-foreground" : "hover:bg-muted",
                      )}
                    >
                      <route.icon className="h-5 w-5" />
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {route.label}
                  </TooltipContent>
                </Tooltip>
              ) : (
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
              )
            ))}
          </TooltipProvider>
        </div>
        <div className={cn(
          "p-4 border-t flex items-center",
          collapsed ? "justify-center" : "justify-between"
        )}>
          {!collapsed && <UserAuthMenu />}
          <ModeToggle />
        </div>
      </div>

      {/* Main Content */}
      <div className={cn(
        "h-full transition-all duration-300",
        collapsed ? "lg:pl-20" : "lg:pl-72"
      )}>
        <div className="h-full pt-0 lg:pt-0">{children}</div>
      </div>
    </div>
  )
}
