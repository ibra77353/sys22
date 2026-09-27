import React, { useEffect, useState, useMemo } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, LoadingState, EmptyState } from "@/components/ui-shared";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { DrawerSelect } from "@/components/DrawerSelect";
import { formatCurrency, formatDateTime, EXPENSE_CATEGORIES } from "@/lib/format";
import { BarChart3 } from "lucide-react";

const PERIODS = [
  { value: "today", label: "اليوم" },
  { value: "week", label: "هذا الأسبوع" },
  { value: "month", label: "هذا الشهر" },
  { value: "custom", label: "فترة مخصصة" }
];

export default function Reports() {
  const [all, setAll] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("month");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const [sales, collections, expenses, withdrawals, linePayments] = await Promise.all([
          base44.entities.Sale.list("-sale_date", 2000),
          base44.entities.Collection.list("-collection_date", 2000),
          base44.entities.Expense.list("-expense_date", 2000),
          base44.entities.OwnerWithdrawal.list("-withdrawal_date", 2000),
          base44.entities.LinePayment.list("-payment_date", 2000)
        ]);
        setAll({ sales, collections, expenses, withdrawals, linePayments });
      } finally { setLoading(false); }
    })();
  }, []);

  const range = useMemo(() => {
    const now = new Date();
    let start, end;
    if (period === "today") {
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (period === "week") {
      start = new Date(now); start.setDate(now.getDate() - 6); start.setHours(0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    } else if (period === "month") {
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    } else {
      start = from ? new Date(from) : new Date(0);
      end = to ? new Date(to + "T23:59:59") : new Date(8640000000000000);
    }
    return { start, end };
  }, [period, from, to]);

  const inRange = (d) => { try { const dt = new Date(d); return dt >= range.start && dt <= range.end; } catch { return false; } };

  const filtered = useMemo(() => {
    if (!all) return null;
    const sales = all.sales.filter((s) => s.status === "active" && inRange(s.sale_date));
    const collections = all.collections.filter((c) => inRange(c.collection_date));
    const expenses = all.expenses.filter((e) => inRange(e.expense_date));
    const withdrawals = all.withdrawals.filter((w) => inRange(w.withdrawal_date));
    const linePayments = all.linePayments.filter((p) => inRange(p.payment_date));
    const salesTotal = sales.reduce((a, s) => a + (Number(s.total_amount) || 0), 0);
    const collectionsTotal = collections.reduce((a, c) => a + (Number(c.amount) || 0), 0);
    const expensesTotal = expenses.reduce((a, e) => a + (Number(e.amount) || 0), 0);
    const withdrawalsTotal = withdrawals.reduce((a, w) => a + (Number(w.amount) || 0), 0);
    const linePaymentsTotal = linePayments.reduce((a, p) => a + (Number(p.amount) || 0), 0);

    // by distributor
    const byDist = {};
    for (const s of sales) { byDist[s.distributor_name || "غير محدد"] = (byDist[s.distributor_name || "غير محدد"] || 0) + (Number(s.total_amount) || 0); }
    // by package
    const byPkg = {};
    for (const s of sales) for (const it of (s.items || [])) { byPkg[it.package_name || "غير محدد"] = (byPkg[it.package_name || "غير محدد"] || 0) + (Number(it.total_price) || 0); }
    // expenses by category
    const expByCat = {};
    for (const e of expenses) { expByCat[e.category] = (expByCat[e.category] || 0) + (Number(e.amount) || 0); }

    return { sales, collections, expenses, withdrawals, linePayments, salesTotal, collectionsTotal, expensesTotal, withdrawalsTotal, linePaymentsTotal, byDist, byPkg, expByCat };
  }, [all, range]);

  if (loading || !filtered) return <LoadingState />;

  return (
    <div>
      <PageHeader title="التقارير" description="تقارير مبنية على البيانات الحقيقية" />

      <Card className="p-4 mb-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[160px]">
            <Label>الفترة</Label>
            <DrawerSelect
              value={period}
              onValueChange={setPeriod}
              placeholder="اختر الفترة"
              options={PERIODS.map((p) => ({ value: p.value, label: p.label }))}
            />
          </div>
          {period === "custom" && (
            <>
              <div><Label>من</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></div>
              <div><Label>إلى</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></div>
            </>
          )}
        </div>
      </Card>

      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
        <Card className="p-4"><p className="text-xs text-muted-foreground">إجمالي المبيعات</p><p className="text-xl font-bold text-primary">{formatCurrency(filtered.salesTotal)}</p><p className="text-xs text-muted-foreground">{filtered.sales.length} عملية</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">التحصيلات</p><p className="text-xl font-bold text-emerald-600">{formatCurrency(filtered.collectionsTotal)}</p><p className="text-xs text-muted-foreground">{filtered.collections.length} عملية</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">المصروفات</p><p className="text-xl font-bold text-rose-500">{formatCurrency(filtered.expensesTotal)}</p><p className="text-xs text-muted-foreground">{filtered.expenses.length} عملية</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">سحوبات المالك</p><p className="text-xl font-bold text-rose-500">{formatCurrency(filtered.withdrawalsTotal)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">دفعات الخطوط</p><p className="text-xl font-bold text-rose-500">{formatCurrency(filtered.linePaymentsTotal)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">صافي التدفق</p><p className="text-xl font-bold">{formatCurrency(filtered.collectionsTotal - filtered.expensesTotal - filtered.withdrawalsTotal - filtered.linePaymentsTotal)}</p></Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> المبيعات حسب الموزع</h3>
          {Object.keys(filtered.byDist).length === 0 ? <p className="text-sm text-muted-foreground">لا توجد بيانات</p> : (
            <div className="space-y-2">
              {Object.entries(filtered.byDist).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0"><span>{k}</span><span className="font-bold">{formatCurrency(v)}</span></div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-4">
          <h3 className="font-bold mb-3 flex items-center gap-2"><BarChart3 className="w-4 h-4" /> المبيعات حسب الباقة</h3>
          {Object.keys(filtered.byPkg).length === 0 ? <p className="text-sm text-muted-foreground">لا توجد بيانات</p> : (
            <div className="space-y-2">
              {Object.entries(filtered.byPkg).sort((a, b) => b[1] - a[1]).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0"><span>{k}</span><span className="font-bold">{formatCurrency(v)}</span></div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-4">
          <h3 className="font-bold mb-3">المصروفات حسب التصنيف</h3>
          {Object.keys(filtered.expByCat).length === 0 ? <p className="text-sm text-muted-foreground">لا توجد مصروفات</p> : (
            <div className="space-y-2">
              {Object.entries(filtered.expByCat).map(([k, v]) => (
                <div key={k} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0"><span>{EXPENSE_CATEGORIES[k] || k}</span><span className="font-bold text-rose-500">{formatCurrency(v)}</span></div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-4">
          <h3 className="font-bold mb-3">تفاصيل المبيعات</h3>
          {filtered.sales.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد مبيعات</p> : (
            <div className="space-y-2 max-h-72 overflow-y-auto scrollbar-thin">
              {filtered.sales.map((s) => (
                <div key={s.id} className="flex justify-between text-sm py-1.5 border-b border-border last:border-0">
                  <div><p className="font-medium">{s.invoice_number}</p><p className="text-xs text-muted-foreground">{s.distributor_name} • {formatDateTime(s.sale_date)}</p></div>
                  <span className="font-bold">{formatCurrency(s.total_amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}