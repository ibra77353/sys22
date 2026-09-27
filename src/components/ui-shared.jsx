import React from "react";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Inbox } from "lucide-react";

export function StatCard({ title, value, icon: Icon, tone = "primary", subtitle }) {
  const tones = {
    primary: { grad: "from-blue-500/10 to-blue-500/5", ink: "text-blue-600 dark:text-blue-400", chip: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
    green: { grad: "from-emerald-500/10 to-emerald-500/5", ink: "text-emerald-600 dark:text-emerald-400", chip: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
    amber: { grad: "from-amber-500/10 to-amber-500/5", ink: "text-amber-600 dark:text-amber-400", chip: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
    red: { grad: "from-rose-500/10 to-rose-500/5", ink: "text-rose-600 dark:text-rose-400", chip: "bg-rose-500/10 text-rose-600 dark:text-rose-400" },
    purple: { grad: "from-violet-500/10 to-violet-500/5", ink: "text-violet-600 dark:text-violet-400", chip: "bg-violet-500/10 text-violet-600 dark:text-violet-400" }
  };
  const t = tones[tone] || tones.primary;
  return (
    <Card className="p-3.5 sm:p-5 relative overflow-hidden transition-shadow hover:shadow-md">
      <div className={`absolute inset-0 bg-gradient-to-bl ${t.grad} opacity-70 pointer-events-none`} />
      <div className="relative flex items-start justify-between gap-2.5">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] sm:text-sm text-muted-foreground font-medium truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-bold mt-1 truncate">{value}</p>
          {subtitle && <p className="text-[11px] sm:text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>}
        </div>
        {Icon && (
          <div className={`shrink-0 w-9 h-9 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${t.chip}`}>
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
      </div>
    </Card>
  );
}

export function PageHeader({ title, description, action }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3 mb-4 sm:mb-5">
      <div className="min-w-0 flex-1">
        <h1 className="text-lg sm:text-2xl font-bold leading-tight">{title}</h1>
        {description && <p className="text-xs sm:text-sm text-muted-foreground mt-1">{description}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function LoadingState({ rows = 5 }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-16 w-full rounded-xl" />
      ))}
    </div>
  );
}

export function EmptyState({ title = "لا توجد بيانات", description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <Inbox className="w-8 h-8 text-muted-foreground" />
      </div>
      <h3 className="font-semibold text-lg">{title}</h3>
      {description && <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function ConfirmDialog({ open, onOpenChange, title, description, confirmText = "تأكيد", onConfirm, loading, destructive }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => onOpenChange(false)}>
      <Card className="w-full max-w-md p-6" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground mb-5">{description}</p>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>إلغاء</Button>
          <Button variant={destructive ? "destructive" : "default"} onClick={onConfirm} disabled={loading}>
            {loading ? "جارٍ..." : confirmText}
          </Button>
        </div>
      </Card>
    </div>
  );
}