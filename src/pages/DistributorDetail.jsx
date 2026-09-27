import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader, LoadingState, EmptyState } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrowRight } from "lucide-react";

export default function DistributorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const d = await base44.entities.Distributor.get(id);
        const [sales, collections] = await Promise.all([
          base44.entities.Sale.filter({ distributor_id: id }),
          base44.entities.Collection.filter({ distributor_id: id })
        ]);
        const activeSales = sales.filter((s) => s.status === "active");
        const totalSales = activeSales.reduce((a, s) => a + (Number(s.total_amount) || 0), 0);
        const totalPaid = activeSales.reduce((a, s) => a + (Number(s.paid_amount) || 0), 0);
        const totalCollected = collections.reduce((a, c) => a + (Number(c.amount) || 0), 0);
        const debt = Math.max(0, totalSales - totalPaid - totalCollected);
        setDetail({ distributor: d, sales, collections, totalSales, totalPaid, totalCollected, debt });
      } catch (e) { setError(e.message); } finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <LoadingState />;
  if (error) return <EmptyState title="تعذر تحميل البيانات" description={error} action={<Button onClick={() => navigate("/distributors")}>رجوع للموزعين</Button>} />;

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate("/distributors")} className="gap-1.5 mb-3"><ArrowRight className="w-4 h-4" /> رجوع</Button>
      <PageHeader title={detail.distributor.name} description={`هاتف: ${detail.distributor.phone || "-"} • عنوان: ${detail.distributor.address || "-"}`} />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
        <Card className="p-4"><p className="text-xs text-muted-foreground">إجمالي المبيعات</p><p className="text-xl font-bold text-primary">{formatCurrency(detail.totalSales)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">إجمالي التحصيلات</p><p className="text-xl font-bold text-emerald-600">{formatCurrency(detail.totalCollected)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">المدفوع عند البيع</p><p className="text-xl font-bold">{formatCurrency(detail.totalPaid)}</p></Card>
        <Card className="p-4"><p className="text-xs text-muted-foreground">الرصيد المستحق</p><p className="text-xl font-bold text-rose-500">{formatCurrency(detail.debt)}</p></Card>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <Card className="p-4">
          <h3 className="font-bold mb-3">سجل المبيعات</h3>
          {detail.sales.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد مبيعات</p> : (
            <div className="space-y-2">
              {detail.sales.map((s) => (
                <div key={s.id} className="flex justify-between py-2 border-b border-border last:border-0">
                  <div><p className="text-sm font-medium">{s.invoice_number}</p><p className="text-xs text-muted-foreground">{formatDate(s.sale_date)} • {s.status === "active" ? "نشط" : "ملغي"}</p></div>
                  <span className="text-sm font-bold">{formatCurrency(s.total_amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-4">
          <h3 className="font-bold mb-3">سجل التحصيلات</h3>
          {detail.collections.length === 0 ? <p className="text-sm text-muted-foreground">لا توجد تحصيلات</p> : (
            <div className="space-y-2">
              {detail.collections.map((c) => (
                <div key={c.id} className="flex justify-between py-2 border-b border-border last:border-0">
                  <div><p className="text-sm font-medium">تحصيل</p><p className="text-xs text-muted-foreground">{formatDate(c.collection_date)}</p></div>
                  <span className="text-sm font-bold text-emerald-600">{formatCurrency(c.amount)}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}