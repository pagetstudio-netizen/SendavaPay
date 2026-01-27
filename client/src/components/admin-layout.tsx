import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  LayoutDashboard,
  Users,
  FileCheck,
  ArrowRightLeft,
  Wallet,
  Percent,
  Phone,
  Globe,
  LinkIcon,
  MessageSquare,
  Shield,
  Settings,
  Bell,
  Menu,
  LogOut,
  ChevronRight,
  User,
} from "lucide-react";
import type { AdminNotification as AdminNotificationType, User as UserType } from "@shared/schema";

interface AdminLayoutProps {
  children: React.ReactNode;
}

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

const navItems: NavItem[] = [
  { title: "Tableau de bord", href: "/admin", icon: LayoutDashboard },
  { title: "Utilisateurs", href: "/admin/users", icon: Users },
  { title: "KYC", href: "/admin/kyc", icon: FileCheck },
  { title: "Transactions", href: "/admin/transactions", icon: ArrowRightLeft },
  { title: "Retraits", href: "/admin/withdrawals", icon: Wallet },
  { title: "Frais", href: "/admin/commissions", icon: Percent },
  { title: "Numéros de retrait", href: "/admin/withdrawal-numbers", icon: Phone },
  { title: "Pays & Opérateurs", href: "/admin/countries", icon: Globe },
  { title: "Liens de paiement", href: "/admin/payment-links", icon: LinkIcon },
  { title: "Message global", href: "/admin/messaging", icon: MessageSquare },
  { title: "Logs & Sécurité", href: "/admin/logs", icon: Shield },
  { title: "Paramètres", href: "/admin/settings", icon: Settings },
];

function formatTimeAgo(date: Date | string) {
  const now = new Date();
  const then = new Date(date);
  const seconds = Math.floor((now.getTime() - then.getTime()) / 1000);
  
  if (seconds < 60) return "À l'instant";
  if (seconds < 3600) return `Il y a ${Math.floor(seconds / 60)} min`;
  if (seconds < 86400) return `Il y a ${Math.floor(seconds / 3600)} h`;
  return `Il y a ${Math.floor(seconds / 86400)} j`;
}

function NavLink({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick?: () => void }) {
  const Icon = item.icon;
  
  return (
    <Link href={item.href} onClick={onClick}>
      <div
        className={`flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
          isActive
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover-elevate"
        }`}
        data-testid={`nav-${item.href.replace("/admin/", "").replace("/admin", "dashboard")}`}
      >
        <Icon className="h-5 w-5 flex-shrink-0" />
        <span className="text-sm font-medium">{item.title}</span>
        {isActive && <ChevronRight className="h-4 w-4 ml-auto" />}
      </div>
    </Link>
  );
}

function Sidebar({ onLinkClick }: { onLinkClick?: () => void }) {
  const [location] = useLocation();
  
  const isActive = (href: string) => {
    if (href === "/admin") {
      return location === "/admin" || location === "/admin/";
    }
    return location.startsWith(href);
  };

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b">
        <Link href="/">
          <div className="flex items-center gap-2 cursor-pointer">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">S</span>
            </div>
            <div>
              <h1 className="font-bold text-lg">SendavaPay</h1>
              <p className="text-xs text-muted-foreground">Administration</p>
            </div>
          </div>
        </Link>
      </div>
      
      <ScrollArea className="flex-1 px-3 py-4">
        <nav className="space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.href}
              item={item}
              isActive={isActive(item.href)}
              onClick={onLinkClick}
            />
          ))}
        </nav>
      </ScrollArea>
      
      <div className="p-4 border-t">
        <Link href="/dashboard">
          <Button variant="outline" className="w-full justify-start gap-2" data-testid="button-back-to-app">
            <LogOut className="h-4 w-4" />
            <span>Retour à l'app</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}

function NotificationsDropdown() {
  const { data: notifications, isLoading } = useQuery<AdminNotificationType[]>({
    queryKey: ["/api/admin/notifications"],
    refetchInterval: 30000,
  });

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["/api/admin/notifications/unread-count"],
    refetchInterval: 30000,
  });

  const markReadMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("POST", `/api/admin/notifications/${id}/read`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread-count"] });
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/admin/notifications/read-all");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/notifications/unread-count"] });
    },
  });

  const count = unreadCount?.count || 0;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
            >
              {count > 9 ? "9+" : count}
            </Badge>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Notifications</span>
          {count > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-1 px-2 text-xs"
              onClick={() => markAllReadMutation.mutate()}
              data-testid="button-mark-all-read"
            >
              Tout marquer lu
            </Button>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <ScrollArea className="h-80">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : notifications && notifications.length > 0 ? (
            <div className="space-y-1 p-1">
              {notifications.slice(0, 10).map((notification) => (
                <DropdownMenuItem
                  key={notification.id}
                  className={`flex flex-col items-start gap-1 p-3 cursor-pointer ${
                    !notification.isRead ? "bg-muted/50" : ""
                  }`}
                  onClick={() => {
                    if (!notification.isRead) {
                      markReadMutation.mutate(notification.id);
                    }
                  }}
                >
                  <div className="flex items-center gap-2 w-full">
                    <span className={`h-2 w-2 rounded-full ${
                      notification.notificationType === "alert" 
                        ? "bg-red-500" 
                        : notification.notificationType === "warning"
                        ? "bg-yellow-500"
                        : "bg-blue-500"
                    }`} />
                    <span className="font-medium text-sm flex-1">{notification.title}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatTimeAgo(notification.createdAt)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 pl-4">
                    {notification.message}
                  </p>
                </DropdownMenuItem>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune notification</p>
            </div>
          )}
        </ScrollArea>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [location] = useLocation();
  
  const { data: user } = useQuery<UserType>({
    queryKey: ["/api/user"],
  });

  const currentPage = navItems.find((item) => {
    if (item.href === "/admin") {
      return location === "/admin" || location === "/admin/";
    }
    return location.startsWith(item.href);
  });

  return (
    <div className="flex h-screen bg-background">
      <aside className="hidden lg:flex w-64 flex-col border-r bg-card">
        <Sidebar />
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b bg-card flex items-center justify-between px-4 gap-4">
          <div className="flex items-center gap-4">
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild className="lg:hidden">
                <Button variant="ghost" size="icon" data-testid="button-mobile-menu">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-64">
                <Sidebar onLinkClick={() => setMobileOpen(false)} />
              </SheetContent>
            </Sheet>
            
            <div className="hidden sm:block">
              <h1 className="font-semibold">{currentPage?.title || "Admin"}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <NotificationsDropdown />
            <ThemeToggle />
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="gap-2" data-testid="button-user-menu">
                  <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center">
                    <User className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="hidden sm:inline-block text-sm font-medium">
                    {user?.fullName?.split(" ")[0] || "Admin"}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div>
                    <p className="font-medium">{user?.fullName}</p>
                    <p className="text-xs text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard">
                    <LogOut className="h-4 w-4 mr-2" />
                    Retour à l'app
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}