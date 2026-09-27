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
import { Plus, HandCoins } from "lucide-react";

export default function Collections() {
  const [items, setItems] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ distributor_id: "", amount: "", notes: "" });

  const load = async () => {
    setLoading(true);
    try {
      const [c, d] = await Promise.all([
        base44.entities.Collection.list("-collection_date", 500),
        base44.entities.Distributor.filter({ status: "active" })
      ]);
      setItems(c); setDistributors(d);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ distributor_id: "", amount: "", notes: "" }); setOpen(true); };

  const save = async () => {
    if (!form.distributor_id || !form.amount) return;
    setSaving(true);
    try {
      const dist = distributors.find((d) => d.id === form.distributor_id);
      const res = await base44.functions.invoke("createCollection", {
        distributor_id: form.distributor_id,
        distributor_name: dist?.name || "",
        amount: Number(form.amount),
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
      <PageHeader title="التحصيلات" description="تحصيل الأموال من الموزعين" action={
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> تحصيل جديد</Button>
      } />
      {items.length === 0 ? (
        <EmptyState title="لا توجد تحصيلات" action={<Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> تسجيل تحصيل</Button>} />
      ) : (
        <Card className="divide-y divide-border">
          {items.map((c) => (
            <div key={c.id} className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{c.distributor_name}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(c.collection_date)} {c.notes ? `• ${c.notes}` : ""}</p>
              </div>
              <span className="text-sm font-bold text-emerald-600">+{formatCurrency(c.amount)}</span>
            </div>
          ))}
        </Card>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <Card className="w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><HandCoins className="w-5 h-5" /> تسجيل تحصيل</h3>
            <div className="space-y-3">
              <div><Label>الموزع</Label>
                <DrawerSelect
                  value={form.distributor_id}
                  onValueChange={(v) => setForm({ ...form, distributor_id: v })}
                  placeholder="اختر الموزع"
                  options={distributors.map((d) => ({ value: d.id, label: d.name }))}
                />
              </div>
              <div><Label>المبلغ</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
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