import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { StatCard, PageHeader, LoadingState, EmptyState } from "@/components/ui-shared";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDateTime, CASH_SOURCES } from "@/lib/format";
import { Wallet, TrendingUp, TrendingDown, ArrowDownToLine } from "lucide-react";

export default function Cash() {
  const [txns, setTxns] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const [t, s] = await Promise.all([
          base44.entities.CashTransaction.list("-transaction_date", 1000),
          base44.entities.Settings.list()
        ]);
        setTxns(t);
        setSettings(s[0] || {});
      } finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <LoadingState />;

  const sym = settings?.currency_symbol || "ر.ي";
  const opening = Number(settings?.opening_balance) || 0;
  const totalIn = txns.filter((t) => t.type === "in").reduce((a, t) => a + (Number(t.amount) || 0), 0);
  const totalOut = txns.filter((t) => t.type === "out").reduce((a, t) => a + (Number(t.amount) || 0), 0);
  const balance = opening + totalIn - totalOut;

  const bySource = (src, type) => txns.filter((t) => t.source === src && t.type === type).reduce((a, t) => a + (Number(t.amount) || 0), 0);

  return (
    <div>
      <PageHeader title="الصندوق" description="رصيد الصندوق وحركاته المالية" />

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <StatCard title="الرصيد الحالي" value={formatCurrency(balance, sym)} icon={Wallet} tone="green" />
        <StatCard title="الرصيد الافتتاحي" value={formatCurrency(opening, sym)} icon={ArrowDownToLine} tone="primary" />
        <StatCard title="إجمالي المقبوضات" value={formatCurrency(totalIn, sym)} icon={TrendingUp} tone="green" />
        <StatCard title="إجمالي المدفوعات" value={formatCurrency(totalOut, sym)} icon={TrendingDown} tone="red" />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <Card className="p-3"><p className="text-xs text-muted-foreground">مقبوضات المبيعات</p><p className="font-bold text-emerald-600">{formatCurrency(bySource("sale", "in"), sym)}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">التحصيلات</p><p className="font-bold text-emerald-600">{formatCurrency(bySource("collection", "in"), sym)}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">المصروفات</p><p className="font-bold text-rose-500">{formatCurrency(bySource("expense", "out"), sym)}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">دفعات الخطوط</p><p className="font-bold text-rose-500">{formatCurrency(bySource("line_payment", "out"), sym)}</p></Card>
        <Card className="p-3"><p className="text-xs text-muted-foreground">سحوبات المالك</p><p className="font-bold text-rose-500">{formatCurrency(bySource("owner_withdrawal", "out"), sym)}</p></Card>
      </div>

      <h3 className="font-bold mb-3">سجل الحركات</h3>
      {txns.length === 0 ? <EmptyState title="لا توجد حركات" /> : (
        <Card className="divide-y divide-border">
          {txns.map((t) => (
            <div key={t.id} className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium truncate">{t.description}</p>
                <p className="text-xs text-muted-foreground">{CASH_SOURCES[t.source] || t.source} • {formatDateTime(t.transaction_date)}</p>
              </div>
              <span className={`text-sm font-bold shrink-0 ${t.type === "in" ? "text-emerald-600" : "text-rose-500"}`}>
                {t.type === "in" ? "+" : "-"}{formatCurrency(t.amount, sym)}
              </span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}