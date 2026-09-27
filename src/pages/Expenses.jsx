import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, LoadingState, EmptyState } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DrawerSelect } from "@/components/DrawerSelect";
import { formatCurrency, formatDateTime, EXPENSE_CATEGORIES } from "@/lib/format";
import { Plus, Receipt } from "lucide-react";

export default function Expenses() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ category: "internet", description: "", amount: "", notes: "" });

  const load = async () => {
    setLoading(true);
    try { setItems(await base44.entities.Expense.list("-expense_date", 500)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setForm({ category: "internet", description: "", amount: "", notes: "" }); setOpen(true); };

  const save = async () => {
    if (!form.amount) return;
    setSaving(true);
    try {
      const res = await base44.functions.invoke("createExpense", {
        category: form.category,
        description: form.description,
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
      <PageHeader title="المصروفات" description="تسجيل مصروفات الشبكة" action={
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> مصروف جديد</Button>
      } />
      {items.length === 0 ? (
        <EmptyState title="لا توجد مصروفات" action={<Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> إضافة مصروف</Button>} />
      ) : (
        <Card className="divide-y divide-border">
          {items.map((e) => (
            <div key={e.id} className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <p className="text-sm font-medium">{e.description || EXPENSE_CATEGORIES[e.category]}</p>
                <p className="text-xs text-muted-foreground">{EXPENSE_CATEGORIES[e.category]} • {formatDateTime(e.expense_date)}</p>
              </div>
              <span className="text-sm font-bold text-rose-500">-{formatCurrency(e.amount)}</span>
            </div>
          ))}
        </Card>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <Card className="w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><Receipt className="w-5 h-5" /> مصروف جديد</h3>
            <div className="space-y-3">
              <div><Label>التصنيف</Label>
                <DrawerSelect
                  value={form.category}
                  onValueChange={(v) => setForm({ ...form, category: v })}
                  placeholder="اختر التصنيف"
                  options={Object.entries(EXPENSE_CATEGORIES).map(([k, v]) => ({ value: k, label: v }))}
                />
              </div>
              <div><Label>الوصف</Label><Input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
              <div><Label>المبلغ</Label><Input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} /></div>
              <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button onClick={save} disabled={saving}>{saving ? "جارٍ..." : "حفظ"}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}