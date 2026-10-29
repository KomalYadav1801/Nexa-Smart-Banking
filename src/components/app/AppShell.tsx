import { useEffect, useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  ArrowLeftRight,
  Receipt,
  CreditCard,
  PiggyBank,
  Users,
  FileText,
  UserCog,
  Bell,
  LogOut,
  Menu,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useNotifications, useRefreshBanking } from "@/lib/banking";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ThemeSwitcher } from "@/components/app/ThemeSwitcher";
import { cn } from "@/lib/utils";
import { longDateTime } from "@/lib/formats";

const NAV = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/transfer", label: "Transfer Money", icon: ArrowLeftRight },
  { to: "/transactions", label: "Transactions", icon: FileText },
  { to: "/bills", label: "Bills & Recharge", icon: Receipt },
  { to: "/cards", label: "Cards", icon: CreditCard },
  { to: "/deposits", label: "Deposits", icon: PiggyBank },
  { to: "/beneficiaries", label: "Beneficiaries", icon: Users },
  { to: "/profile", label: "Profile & Security", icon: UserCog },
] as const;

export function BrandMark({ light = false }: { light?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="bg-gradient-brand shadow-glow flex size-9 items-center justify-center rounded-xl">
        <span className="text-primary-foreground font-display text-lg font-bold">N</span>
      </div>
      <div className="leading-none">
        <p
          className={cn(
            "font-display text-[15px] font-bold tracking-tight",
            light ? "text-navy-foreground" : "text-foreground",
          )}
        >
          Nexa
        </p>
        <p className="text-muted-foreground text-[11px] font-medium">SMART BANKING</p>
      </div>
    </div>
  );
}

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="space-y-1">
      {NAV.map((item) => {
        const active = path === item.to;
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            className={cn(
              "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all",
              active
                ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-glow"
                : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
            )}
          >
            <item.icon className="size-[18px]" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}

export function AppShell({
  children,
  title,
  subtitle,
}: {
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const refresh = useRefreshBanking();
  const [ready, setReady] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { data: notifications } = useNotifications();

  useEffect(() => {
    if (!loading && !user) void navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { error } = await supabase.rpc("ensure_user_setup", {
        _full_name: (user.user_metadata?.["full_name"] as string) ?? "",
      });
      if (error) console.error(error);
      if (!cancelled) {
        refresh();
        setReady(true);
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const unread = (notifications ?? []).filter((n) => !n.is_read).length;

  if (loading || !user || !ready) {
    return (
      <div className="bg-background flex min-h-screen items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="bg-gradient-brand shadow-glow size-12 animate-pulse rounded-2xl" />
          <p className="text-muted-foreground text-sm">Securing your session…</p>
        </div>
      </div>
    );
  }

  const initials = (user.email ?? "NX").slice(0, 2).toUpperCase();

  return (
    <div className="bg-background flex min-h-screen">
      <aside className="bg-sidebar border-sidebar-border hidden w-[264px] shrink-0 flex-col border-r p-4 lg:flex">
        <div className="px-2 py-3">
          <BrandMark light />
        </div>
        <div className="mt-4 flex-1">
          <NavLinks />
        </div>
        <div className="bg-sidebar-accent text-sidebar-accent-foreground rounded-xl p-3 text-xs">
          <div className="flex items-center gap-2 font-semibold">
            <ShieldCheck className="text-success size-4" />
            256-bit secured
          </div>
          <p className="text-sidebar-foreground/70 mt-1">
            Last login {longDateTime(user.last_sign_in_at ?? new Date())}
          </p>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="bg-card/80 supports-[backdrop-filter]:bg-card/60 sticky top-0 z-30 flex h-16 items-center gap-3 border-b px-4 backdrop-blur-xl md:px-6">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="lg:hidden">
                <Menu className="size-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="bg-sidebar w-[270px] p-4">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <div className="px-2 py-2">
                <BrandMark light />
              </div>
              <div className="mt-4">
                <NavLinks onNavigate={() => setMobileOpen(false)} />
              </div>
            </SheetContent>
          </Sheet>

          <div className="min-w-0 flex-1">
            <h1 className="font-display truncate text-base font-bold md:text-lg">{title}</h1>
            {subtitle && (
              <p className="text-muted-foreground truncate text-xs">{subtitle}</p>
            )}
          </div>

          <Link to="/insights">
            <Button variant="outline" size="sm" className="hidden gap-2 sm:flex">
              <Sparkles className="text-primary size-4" />
              AI Insights
            </Button>
          </Link>

          <ThemeSwitcher />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="size-5" />
                {unread > 0 && (
                  <Badge className="bg-primary text-primary-foreground absolute -top-0.5 -right-0.5 size-4 justify-center p-0 text-[10px]">
                    {unread}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <DropdownMenuLabel>Notifications</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {(notifications ?? []).slice(0, 6).map((n) => (
                <DropdownMenuItem key={n.id} className="flex-col items-start gap-0.5 py-2">
                  <span className="text-sm font-semibold">{n.title}</span>
                  <span className="text-muted-foreground text-xs">{n.message}</span>
                </DropdownMenuItem>
              ))}
              {(notifications ?? []).length === 0 && (
                <p className="text-muted-foreground px-2 py-4 text-center text-sm">
                  No notifications yet
                </p>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className="size-9 cursor-pointer">
                <AvatarFallback className="bg-gradient-brand text-primary-foreground text-xs font-bold">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile">Profile & Security</Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={async () => {
                  await signOut();
                  void navigate({ to: "/auth" });
                }}
              >
                <LogOut className="mr-2 size-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
      </div>
    </div>
  );
}
