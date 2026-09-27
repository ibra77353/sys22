import React, { useState, useEffect } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { useTheme } from "@/lib/useTheme";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import NotificationsBell from "@/components/NotificationsBell";
import {
  LayoutDashboard, Package, Boxes, Users, ShoppingCart, HandCoins,
  Wifi, CreditCard, Receipt, Wallet, BarChart3, Search, History,
  Settings, DatabaseBackup, Menu, Moon, Sun, LogOut, Network
} from "lucide-react";

const NAV = [
  { to: "/", label: "الرئيسية", icon: LayoutDashboard, end: true },
  { to: "/packages", label: "الباقات", icon: Package },
  { to: "/inventory", label: "المخزون", icon: Boxes },
  { to: "/distributors", label: "الموزعون", icon: Users },
  { to: "/sales", label: "المبيعات", icon: ShoppingCart },
  { to: "/collections", label: "التحصيلات", icon: HandCoins },
  { to: "/lines", label: "الخطوط", icon: Wifi },
  { to: "/line-payments", label: "دفعات الخطوط", icon: CreditCard },
  { to: "/expenses", label: "المصروفات", icon: Receipt },
  { to: "/owner-withdrawals", label: "سحوبات المالك", icon: Wallet },
  { to: "/cash", label: "الصندوق", icon: BarChart3 },
  { to: "/reports", label: "التقارير", icon: BarChart3 },
  { to: "/search", label: "البحث", icon: Search },
  { to: "/audit", label: "سجل التدقيق", icon: History },
  { to: "/settings", label: "الإعدادات", icon: Settings },
  { to: "/backup", label: "النسخ الاحتياطي", icon: DatabaseBackup }
];

const MOBILE_PRIMARY = ["/", "/packages", "/sales", "/cash", "/search"];

function NavLinks({ onNavigate }) {
  return (
    <nav className="flex flex-col gap-1 px-3">
      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          onClick={onNavigate}
          className={({ isActive }) =>
            `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              isActive
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`
          }
        >
          <item.icon className="w-5 h-5 shrink-0" />
          <span>{item.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}

function MobileBar() {
  return (
    <div className="mobile-bar md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur border-t border-border shadow-[0_-2px_12px_rgba(0,0,0,0.04)]" style={{ paddingBottom: "env(safe-area-inset-bottom)" }}>
      <div className="flex items-center justify-around px-1 py-1">
        {NAV.filter((n) => MOBILE_PRIMARY.includes(n.to)).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 min-w-[3.25rem] py-1.5 rounded-xl text-[10px] font-medium transition-all ${
                isActive ? "text-primary bg-primary/10" : "text-muted-foreground"
              }`
            }
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </div>
    </div>
  );
}

export default function Layout() {
  const { theme, toggle } = useTheme();
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const handleLogout = async () => {
    await base44.auth.logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex fixed top-0 right-0 bottom-0 w-64 flex-col bg-sidebar text-sidebar-foreground border-l border-sidebar-border z-30">
        <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
          <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center">
            <Network className="w-5 h-5 text-sidebar-primary-foreground" />
          </div>
          <div className="min-w-0">
            <p className="font-bold text-sm leading-tight">شبكة البرنس</p>
            <p className="text-[10px] text-sidebar-foreground/60">نظام إدارة الشبكة</p>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto py-3 scrollbar-thin">
          <NavLinks />
        </div>
        <div className="p-3 border-t border-sidebar-border">
          <div className="px-3 mb-2">
            <NotificationsBell dropUp />
          </div>
          <Button variant="ghost" size="sm" onClick={toggle} className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent mb-1">
            {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            <span>{theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}</span>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent">
            <LogOut className="w-4 h-4" />
            <span>تسجيل الخروج</span>
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="md:hidden sticky top-0 z-30 flex items-center justify-between px-4 h-14 bg-background/95 backdrop-blur border-b border-border" style={{ paddingTop: "env(safe-area-inset-top)" }}>
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon"><Menu className="w-5 h-5" /></Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 p-0 bg-sidebar text-sidebar-foreground">
            <div className="flex items-center gap-2.5 px-5 h-16 border-b border-sidebar-border">
              <div className="w-9 h-9 rounded-xl bg-sidebar-primary flex items-center justify-center">
                <Network className="w-5 h-5 text-sidebar-primary-foreground" />
              </div>
              <p className="font-bold text-sm">شبكة البرنس</p>
            </div>
            <div className="overflow-y-auto py-3 h-[calc(100%-4rem)] scrollbar-thin">
              <NavLinks onNavigate={() => setOpen(false)} />
              <div className="px-3 mt-3 space-y-1">
                <Button variant="ghost" size="sm" onClick={toggle} className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent">
                  {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span>{theme === "dark" ? "الوضع الفاتح" : "الوضع الداكن"}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={handleLogout} className="w-full justify-start gap-3 text-sidebar-foreground/80 hover:bg-sidebar-accent">
                  <LogOut className="w-4 h-4" />
                  <span>تسجيل الخروج</span>
                </Button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-primary" />
          <span className="font-bold">شبكة البرنس</span>
        </div>
        <div className="flex items-center gap-1">
          <NotificationsBell />
          <Button variant="ghost" size="icon" onClick={toggle}>
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>
        </div>
      </header>

      <main className="md:mr-64 pb-24 md:pb-8">
        <div className="max-w-6xl mx-auto px-3.5 sm:px-6 py-4 sm:py-6">
          <Outlet />
        </div>
      </main>

      <MobileBar />
    </div>
  );
}