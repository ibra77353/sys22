import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, LoadingState, EmptyState } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Plus, Wallet } from "lucide-react";

export default function OwnerWithdrawals() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ amount: "", reason: "", notes: "" });

  const load = async () => {
    setLoading(true);
    try { setItems(await base44.entities.OwnerWithdrawal.list("-withdrawal_date", 500)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ amount: "", reason: "", notes: "" }); setOpen(true); };

  const save = async () => {
    if (!form.amount) return;
    setSaving(true);
    try {
      const res = await base44.functions.invoke("createOwnerWithdrawal", {
        amount: Number(form.amount),
        reason: form.reason,
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
      <PageHeader title="سحوبات المالك" description="سحب الأموال من الصندوق" action={
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> سحب جديد</Button>
      } />
      {items.length === 0 ? (
        <EmptyState title="لا توجد سحوبات" action={<Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> تسجيل سحب</Button>} />
      ) : (
        <Card className="divide-y divide-border">
          {items.map((w) => (
            <div key={w.id} className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{w.reason || "سحب مالك"}</p>
                <p className="text-xs text-muted-foreground">{formatDateTime(w.withdrawal_date)} {w.notes ? `• ${w.notes}` : ""}</p>
              </div>
              <span className="text-sm font-bold text-rose-500">-{formatCurrency(w.amount)}</span>
            </div>
          ))}
        </Card>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <Card className="w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Wallet className="w-5 h-5" /> سحب جديد</h3>
            <div className="space-y-3">
              <div><Label>المبلغ</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>السبب</Label><Input value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
              <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button onClick={save} disabled={saving}>{saving ? "جارٍ..." : "تأكيد السحب"}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}