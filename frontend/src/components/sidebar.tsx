"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { 
  Trophy, 
  Users, 
  Calendar,
  Home,
  Swords,
  Medal,
  Goal
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"
import { type LucideIcon } from "lucide-react"

interface RouteItem {
  label: string;
  icon: LucideIcon;
  href: string;
  color?: string;
}

const routes: RouteItem[] = [
  {
    label: 'Ana Sayfa',
    icon: Home,
    href: '/',
  },
  {
    label: 'Turnuvalar',
    icon: Trophy,
    href: '/tournaments',
    color: 'text-yellow-500'
  },
  {
    label: 'Takımlar',
    icon: Users,
    href: '/teams',
    color: 'text-blue-500'
  },
  {
    label: 'Maçlar',
    icon: Swords,
    href: '/matches',
    color: 'text-purple-500'
  },
  {
    label: 'Fikstür',
    icon: Calendar,
    href: '/matches/fixtures',
    color: 'text-green-500'
  },
  {
    label: 'Puan Durumu',
    icon: Medal,
    href: '/matches/standings',
    color: 'text-amber-500'
  },
  {
    label: 'Skor Girişi',
    icon: Goal,
    href: '/matches/score',
    color: 'text-red-500'
  }
];

interface SidebarProps {
  isCollapsed: boolean;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  const pathname = usePathname()

  return (
    <div className={cn(
      "relative border-r bg-background",
      isCollapsed ? "w-[64px]" : "w-64"
    )}>
      <div className="flex h-[60px] items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-2xl">⚽</span>
          {!isCollapsed && <span>Football Tournament</span>}
        </Link>
      </div>
      <div className="py-2">
        <TooltipProvider>
          <nav className="grid items-start px-2 text-sm font-medium gap-1">
            {routes.map((item) => {
              if (isCollapsed) {
                return (
                  <Tooltip key={item.href} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <Link
                        href={item.href}
                        className={cn(
                          "flex items-center justify-center rounded-lg px-2 py-2 hover:bg-accent",
                          pathname === item.href ? "bg-accent" : "transparent",
                          item.color
                        )}
                      >
                        <item.icon className="h-4 w-4" />
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="font-normal">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-accent transition-colors",
                    pathname === item.href ? "bg-accent" : "transparent",
                    item.color
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  <span className={cn(
                    "text-sm font-medium",
                    pathname !== item.href && "text-muted-foreground"
                  )}>
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </nav>
        </TooltipProvider>
      </div>
    </div>
  )
} 