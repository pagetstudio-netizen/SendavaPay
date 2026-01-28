import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  LayoutGrid,
  Wallet,
  Send,
  LinkIcon,
  Clock,
  KeyRound,
  FileText,
  ShieldCheck,
  Cog,
  LogOut,
  Users,
  TrendingUp,
  MessageSquare,
  Percent,
  CheckCircle,
  HelpCircle,
  CreditCard,
  BadgeCheck,
  Building2,
} from "lucide-react";
import logoPath from "@assets/20251211_105226_1765450558306.png";

const userMenuItems = [
  { icon: LayoutGrid, label: "Tableau de bord", href: "/dashboard" },
  { icon: CreditCard, label: "Dépôt", href: "/dashboard/deposit" },
  { icon: Send, label: "Retrait", href: "/dashboard/withdraw" },
  { icon: LinkIcon, label: "Liens de paiement", href: "/dashboard/payment-links" },
  { icon: Clock, label: "Historique", href: "/dashboard/history" },
  { icon: KeyRound, label: "Clés API", href: "/dashboard/api-keys" },
  { icon: BadgeCheck, label: "Vérification KYC", href: "/dashboard/kyc" },
  { icon: HelpCircle, label: "Besoin d'aide", href: "/dashboard/help" },
  { icon: Cog, label: "Paramètres", href: "/dashboard/settings" },
];

const adminMenuItems = [
  { icon: LayoutGrid, label: "Dashboard", href: "/admin" },
  { icon: Users, label: "Utilisateurs", href: "/admin/users" },
  { icon: Clock, label: "Transactions", href: "/admin/transactions" },
  { icon: Send, label: "Retraits", href: "/admin/withdrawals" },
  { icon: ShieldCheck, label: "Vérification KYC", href: "/admin/kyc" },
  { icon: KeyRound, label: "Clés API", href: "/admin/api-keys" },
  { icon: Percent, label: "Commissions", href: "/admin/commissions" },
  { icon: MessageSquare, label: "Messagerie", href: "/admin/messaging" },
  { icon: TrendingUp, label: "Rapports", href: "/admin/reports" },
  { icon: Cog, label: "Paramètres", href: "/admin/settings" },
];

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, logoutMutation } = useAuth();
  const [location] = useLocation();

  const isAdmin = user?.role === "admin";
  const menuItems = isAdmin && location.startsWith("/admin") ? adminMenuItems : userMenuItems;

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const sidebarStyle = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  } as React.CSSProperties;

  return (
    <SidebarProvider style={sidebarStyle}>
      <div className="flex min-h-screen w-full">
        <Sidebar>
          <SidebarHeader className="p-4">
            <Link href="/">
              <img src={logoPath} alt="SendavaPay" className="h-8" data-testid="img-sidebar-logo" />
            </Link>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup>
              <SidebarGroupLabel>
                {isAdmin && location.startsWith("/admin") ? "Administration" : "Menu principal"}
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu>
                  {menuItems.map((item) => (
                    <SidebarMenuItem key={item.href}>
                      <SidebarMenuButton
                        asChild
                        isActive={location === item.href}
                      >
                        <Link href={item.href} data-testid={`link-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
                          <item.icon className="h-4 w-4" />
                          <span>{item.label}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            {isAdmin && (
              <SidebarGroup>
                <SidebarGroupLabel>Espace</SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={!location.startsWith("/admin")}>
                        <Link href="/dashboard">
                          <Wallet className="h-4 w-4" />
                          <span>Mon compte</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={location.startsWith("/admin")}>
                        <Link href="/admin">
                          <Building2 className="h-4 w-4" />
                          <span>Administration</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            )}
          </SidebarContent>

          <SidebarFooter className="p-4">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="w-full justify-start gap-3 h-auto py-2">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="text-xs">
                      {user ? getInitials(user.fullName) : "?"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start text-left flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium truncate">{user?.fullName}</span>
                      {user?.isVerified && (
                        <CheckCircle className="h-3 w-3 text-green-500 flex-shrink-0" />
                      )}
                    </div>
                    <span className="text-xs text-muted-foreground truncate">{user?.email}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Mon compte</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/dashboard/settings" className="w-full cursor-pointer">
                    <Cog className="h-4 w-4 mr-2" />
                    Paramètres
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/api-docs" className="w-full cursor-pointer">
                    <FileText className="h-4 w-4 mr-2" />
                    Documentation API
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logoutMutation.mutate()}
                  className="text-destructive cursor-pointer"
                  data-testid="button-logout"
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Déconnexion
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 overflow-auto">
          <header className="sticky top-0 z-40 flex h-14 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 lg:px-6">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex-1" />
            {user && (
              <div className="flex items-center gap-2">
                {user.isVerified ? (
                  <Badge variant="secondary" className="text-green-600 bg-green-100 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Vérifié
                  </Badge>
                ) : (
                  <Badge variant="secondary" className="text-orange-600 bg-orange-100 dark:bg-orange-900/30 dark:text-orange-400">
                    Non vérifié
                  </Badge>
                )}
              </div>
            )}
          </header>
          <div className="p-4 lg:p-6">{children}</div>
        </main>
      </div>
    </SidebarProvider>
  );
}
