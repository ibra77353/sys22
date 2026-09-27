import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { StatCard, PageHeader, LoadingState, EmptyState } from "@/components/ui-shared";
import { formatCurrency, formatDateTime } from "@/lib/format";
import {
  TrendingUp, CalendarDays, HandCoins, AlertTriangle, Wallet,
  Boxes, Package, Users, Receipt, ArrowDownToLine, Activity, Wifi
} from "lucide-react";

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await base44.functions.invoke("getDashboard", {});
      setData(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading || !data) return <LoadingState rows={6} />;
  const { stats, alerts, recent, settings } = data;
  const sym = settings?.currency_symbol || "ر.ي";

  return (
    <div>
      <PageHeader title="لوحة التحكم" description={`مرحباً بك في ${settings?.network_name || "شبكة البرنس"}`} />

      {/* Alerts */}
      {(alerts?.lowStock?.length > 0 || alerts?.indebtedDistributors?.length > 0) && (
        <div className="space-y-2 mb-5">
          {alerts.lowStock.map((a, i) => (
            <div key={`ls${i}`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 text-amber-700 dark:text-amber-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>المخزون منخفض: {a.name} — المتبقي {a.current}</span>
            </div>
          ))}
          {alerts.indebtedDistributors.map((a, i) => (
            <div key={`id${i}`} className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-500/10 text-rose-700 dark:text-rose-400 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>دين مستحق على {a.name} — {formatCurrency(a.debt, sym)}</span>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-4 mb-5 sm:mb-6">
        <StatCard title="مبيعات اليوم" value={formatCurrency(stats.todaySalesTotal, sym)} icon={TrendingUp} tone="primary" />
        <StatCard title="مبيعات الشهر" value={formatCurrency(stats.monthSalesTotal, sym)} icon={CalendarDays} tone="green" />
        <StatCard title="تحصيلات اليوم" value={formatCurrency(stats.todayCollectionsTotal, sym)} icon={HandCoins} tone="purple" />
        <StatCard title="ديون الموزعين" value={formatCurrency(stats.totalDistributorDebt, sym)} icon={AlertTriangle} tone="red" />
        <StatCard title="رصيد الصندوق" value={formatCurrency(stats.cashBalance, sym)} icon={Wallet} tone="green" />
        <StatCard title="قيمة المخزون" value={formatCurrency(stats.inventoryValue, sym)} icon={Boxes} tone="amber" />
        <StatCard title="عدد الباقات" value={`${stats.packagesCount} (${stats.activePackagesCount} نشطة)`} icon={Package} tone="primary" />
        <StatCard title="عدد الموزعين" value={stats.distributorsCount} icon={Users} tone="purple" />
        <StatCard title="إجمالي المصروفات" value={formatCurrency(stats.totalExpenses, sym)} icon={Receipt} tone="red" />
        <StatCard title="سحوبات المالك" value={formatCurrency(stats.totalWithdrawals, sym)} icon={ArrowDownToLine} tone="amber" />
        <StatCard title="مقبوضات الصندوق" value={formatCurrency(stats.cashIn, sym)} icon={TrendingUp} tone="green" />
        <StatCard title="مدفوعات الصندوق" value={formatCurrency(stats.cashOut, sym)} icon={ArrowDownToLine} tone="red" />
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Activity className="w-4 h-4" /> العمليات الأخيرة</h3>
          {recent.length === 0 ? (
            <EmptyState title="لا توجد عمليات بعد" />
          ) : (
            <div className="space-y-2">
              {recent.map((r, i) => (
                <div key={i} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{r.label}</p>
                    <p className="text-xs text-muted-foreground">{formatDateTime(r.date)} {r.distributor ? `• ${r.distributor}` : ""}</p>
                  </div>
                  <span className={`text-sm font-bold shrink-0 ${r.type === "expense" || r.type === "withdrawal" ? "text-rose-500" : "text-emerald-500"}`}>
                    {r.type === "expense" || r.type === "withdrawal" ? "-" : "+"}{formatCurrency(r.amount, sym)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Boxes className="w-4 h-4" /> حالة المخزون</h3>
          {data.stockByPackage.length === 0 ? (
            <EmptyState title="لا توجد باقات" />
          ) : (
            <div className="space-y-2">
              {data.stockByPackage.map((p) => (
                <div key={p.package_id} className="flex items-center justify-between gap-2 py-2 border-b border-border last:border-0">
                  <span className="text-sm font-medium">{p.name}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{formatCurrency(p.price, sym)}</span>
                    <span className={`text-sm font-bold px-2.5 py-0.5 rounded-lg ${p.current <= (settings?.low_stock_threshold || 10) ? "bg-rose-500/10 text-rose-500" : "bg-emerald-500/10 text-emerald-600"}`}>
                      {p.current}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}