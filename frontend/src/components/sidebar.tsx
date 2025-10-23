"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { 
  Trophy, 
  Users, 
  Calendar,
  Home,
  Swords,
  Medal,
  Goal,
  LogIn,
  LogOut,
  UserCircle,
  Settings
} from "lucide-react"
import { cn } from "@/lib/utils"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
  TooltipProvider
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/contexts/AuthContext"
import { type LucideIcon } from "lucide-react"
import { Separator } from "@/components/ui/separator"

interface RouteItem {
  label: string;
  icon: LucideIcon;
  href: string;
  color?: string;
  adminOnly?: boolean;
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
    color: 'text-red-500',
    adminOnly: true
  },
  {
    label: 'Ayarlar',
    icon: Settings,
    href: '/settings',
    color: 'text-gray-500',
    adminOnly: true
  }
];

interface SidebarProps {
  isCollapsed: boolean;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const { user, isAuthenticated, isAdmin, logout } = useAuth()

  // Filter routes based on user role
  const filteredRoutes = routes.filter(route => {
    if (route.adminOnly) {
      return isAdmin
    }
    return true
  })

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <div className={cn(
      "relative border-r bg-background flex flex-col",
      isCollapsed ? "w-[64px]" : "w-64"
    )}>
      <div className="flex h-[60px] items-center border-b px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-2xl">⚽</span>
          {!isCollapsed && <span>Football Tournament</span>}
        </Link>
      </div>
      
      {/* User Info */}
      {!isCollapsed && isAuthenticated && (
        <div className="border-b px-4 py-3 bg-gradient-to-r from-muted/50 to-muted/30">
          <div className="flex items-center gap-2">
            <div className={cn(
              "p-1.5 rounded-full",
              isAdmin ? "bg-primary/10" : "bg-muted"
            )}>
              <UserCircle className={cn(
                "h-5 w-5",
                isAdmin ? "text-primary" : "text-muted-foreground"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold truncate">{user?.name}</p>
              <p className={cn(
                "text-xs capitalize font-medium",
                isAdmin ? "text-primary" : "text-muted-foreground"
              )}>
                {isAdmin ? '⭐ Admin' : user?.role}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="flex-1 py-2 overflow-auto">
        <TooltipProvider>
          <nav className="grid items-start px-2 text-sm font-medium gap-1">
            {filteredRoutes.map((item) => {
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

      {/* Auth Section */}
      <div className="border-t p-2 bg-muted/20">
        {isCollapsed ? (
          <TooltipProvider>
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                {isAuthenticated ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center hover:bg-destructive/10 hover:text-destructive"
                    onClick={handleLogout}
                  >
                    <LogOut className="h-4 w-4" />
                  </Button>
                ) : (
                  <Link href="/login">
                    <Button variant="ghost" size="sm" className="w-full justify-center hover:bg-primary/10">
                      <LogIn className="h-4 w-4" />
                    </Button>
                  </Link>
                )}
              </TooltipTrigger>
              <TooltipContent side="right">
                {isAuthenticated ? 'Çıkış Yap' : 'Giriş Yap'}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ) : (
          <>
            {isAuthenticated ? (
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start gap-2 border-destructive/20 bg-destructive/5 hover:bg-destructive/10 hover:border-destructive/30 text-destructive hover:text-destructive"
                onClick={handleLogout}
              >
                <LogOut className="h-4 w-4" />
                <span className="font-medium">Çıkış Yap</span>
              </Button>
            ) : (
              <Link href="/login" className="block">
                <Button variant="outline" size="sm" className="w-full justify-start gap-2 border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30">
                  <LogIn className="h-4 w-4" />
                  <span className="font-medium">Giriş Yap</span>
                </Button>
              </Link>
            )}
          </>
        )}
      </div>
    </div>
  )
}
