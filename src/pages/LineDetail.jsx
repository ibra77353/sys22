import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader, LoadingState, EmptyState } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatCurrency, formatDate } from "@/lib/format";
import { ArrowRight } from "lucide-react";

export default function LineDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const line = await base44.entities.Line.get(id);
        const payments = await base44.entities.LinePayment.filter({ line_id: id });
        const total = payments.reduce((a, p) => a + (Number(p.amount) || 0), 0);
        setDetail({ line, payments, total });
      } catch (e) { setError(e.message); } finally { setLoading(false); }
    })();
  }, [id]);

  if (loading) return <LoadingState />;
  if (error) return <EmptyState title="تعذر تحميل البيانات" description={error} action={<Button onClick={() => navigate("/lines")}>رجوع للخطوط</Button>} />;

  return (
    <div>
      <Button variant="ghost" size="sm" onClick={() => navigate("/lines")} className="gap-1.5 mb-3"><ArrowRight className="w-4 h-4" /> رجوع</Button>
      <PageHeader title={detail.line.name} description={`${detail.line.provider || ""} • ${detail.line.speed || ""}`} />
      <Card className="p-4 mb-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><p className="text-muted-foreground">معرف الخط</p><p className="font-medium">{detail.line.identifier || "-"}</p></div>
          <div><p className="text-muted-foreground">التكلفة</p><p className="font-medium">{formatCurrency(detail.line.cost)}</p></div>
          <div><p className="text-muted-foreground">تاريخ الاشتراك</p><p className="font-medium">{formatDate(detail.line.subscription_date)}</p></div>
          <div><p className="text-muted-foreground">إجمالي المدفوع</p><p className="font-medium text-rose-500">{formatCurrency(detail.total)}</p></div>
        </div>
      </Card>
      <h3 className="font-bold mb-2">الدفعات</h3>
      {detail.payments.length === 0 ? <EmptyState title="لا توجد دفعات" /> : (
        <Card className="divide-y divide-border">
          {detail.payments.map((p) => (
            <div key={p.id} className="flex justify-between p-3">
              <div><p className="text-sm font-medium">{p.period || "دفعة"}</p><p className="text-xs text-muted-foreground">{formatDate(p.payment_date)}</p></div>
              <span className="text-sm font-bold text-rose-500">-{formatCurrency(p.amount)}</span>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}