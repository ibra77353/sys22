import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, LoadingState, EmptyState } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DrawerSelect } from "@/components/DrawerSelect";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Plus, CreditCard } from "lucide-react";

export default function LinePayments() {
  const [items, setItems] = useState([]);
  const [lines, setLines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ line_id: "", amount: "", period: "", notes: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [p, l] = await Promise.all([
        base44.entities.LinePayment.list("-payment_date", 500),
        base44.entities.Line.filter({ status: "active" })
      ]);
      setItems(p); setLines(l);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ line_id: "", amount: "", period: "", notes: "" }); setOpen(true); };

  const save = async () => {
    if (!form.line_id || !form.amount) return;
    setSaving(true);
    try {
      const line = lines.find((l) => l.id === form.line_id);
      const res = await base44.functions.invoke("createLinePayment", {
        line_id: form.line_id,
        line_name: line?.name || "",
        amount: Number(form.amount),
        period: form.period,
        notes: form.notes
      });
      if (res.data?.error) { alert(res.data.error); return; }
      setOpen(false);
      load();
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader title="دفعات الخطوط" description="تسجيل دفعات اشتراكات الخطوط" action={
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> دفعة جديدة</Button>
      } />
      {items.length === 0 ? (
        <EmptyState title="لا توجد دفعات" action={<Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> تسجيل دفعة</Button>} />
      ) : (
        <Card className="divide-y divide-border">
          {items.map((p) => (
            <div key={p.id} className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{p.line_name} {p.period ? `— ${p.period}` : ""}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(p.payment_date)} {p.notes ? `• ${p.notes}` : ""}</p>
              </div>
              <span className="text-sm font-bold text-rose-500">-{formatCurrency(p.amount)}</span>
            </div>
          ))}
        </Card>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <Card className="w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><CreditCard className="w-5 h-5" /> دفعة خط</h3>
            <div className="space-y-3">
              <div><Label>الخط</Label>
                <DrawerSelect
                  value={form.line_id}
                  onValueChange={(v) => setForm({ ...form, line_id: v })}
                  placeholder="اختر الخط"
                  options={lines.map((l) => ({ value: l.id, label: l.name }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>المبلغ</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
                <div><Label>الفترة</Label><Input value={form.period} onChange={(e) => setForm({ ...form, period: e.target.value })} placeholder="مثال: أكتوبر 2026" /></div>
              </div>
              <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button onClick={save} disabled={saving}>{saving ? "جارٍ..." : "تأكيد"}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}