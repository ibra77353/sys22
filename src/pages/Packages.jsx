import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, LoadingState, EmptyState, ConfirmDialog } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Power } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

const COLORS = ["#3b82f6", "#f97316", "#22c55e", "#a855f7", "#ef4444", "#eab308", "#14b8a6", "#64748b"];

export default function Packages() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", data_size_mb: "", hours: "", color: "#3b82f6", description: "" });
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const list = await base44.entities.Package.list("-created_date", 200);
      setItems(list);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: "", price: "", data_size_mb: "", hours: "", color: "#3b82f6", description: "" }); setOpen(true); };
  const openEdit = (p) => { setEditing(p); setForm({ name: p.name, price: p.price, data_size_mb: p.data_size_mb, hours: p.hours, color: p.color, description: p.description || "" }); setOpen(true); };

  const save = async () => {
    if (!form.name || !form.price) return;
    setSaving(true);
    try {
      const payload = {
        name: form.name,
        price: Number(form.price),
        data_size_mb: Number(form.data_size_mb) || 0,
        hours: Number(form.hours) || 0,
        color: form.color,
        description: form.description
      };
      if (editing) await base44.entities.Package.update(editing.id, { ...payload, status: editing.status });
      else await base44.entities.Package.create({ ...payload, status: "active" });
      setOpen(false);
      load();
      toast({ title: editing ? "تم تحديث الباقة" : "تمت إضافة الباقة" });
    } catch (e) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); } finally { setSaving(false); }
  };

  const toggleStatus = async (p) => {
    await base44.entities.Package.update(p.id, { status: p.status === "active" ? "inactive" : "active" });
    load();
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader title="إدارة الباقات" description="إضافة وتعديل وتعطيل الباقات" action={
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> باقة جديدة</Button>
      } />

      {items.length === 0 ? (
        <EmptyState title="لا توجد باقات" description="أضف أول باقة للشبكة" action={<Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> إضافة باقة</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((p) => (
            <Card key={p.id} className="p-4 relative overflow-hidden" style={{ borderTopColor: p.color, borderTopWidth: 4 }}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                    <h3 className="font-bold text-lg">{p.name}</h3>
                  </div>
                  <p className="text-2xl font-bold text-primary mt-1">{Number(p.price).toLocaleString()} ر.ي</p>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs text-muted-foreground">
                    <span className="px-2 py-0.5 rounded bg-muted">{p.data_size_mb} MB</span>
                    <span className="px-2 py-0.5 rounded bg-muted">{p.hours} ساعة</span>
                  </div>
                  {p.description && <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{p.description}</p>}
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${p.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>
                  {p.status === "active" ? "نشطة" : "معطلة"}
                </span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => openEdit(p)} className="gap-1.5"><Pencil className="w-3.5 h-3.5" /> تعديل</Button>
                <Button size="sm" variant="outline" onClick={() => toggleStatus(p)} className="gap-1.5"><Power className="w-3.5 h-3.5" /> {p.status === "active" ? "تعطيل" : "تفعيل"}</Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <Card className="w-full max-w-md p-5 max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">{editing ? "تعديل باقة" : "باقة جديدة"}</h3>
            <div className="space-y-3">
              <div><Label>اسم الباقة</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="مثال: 100 ريال" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>السعر</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
                <div><Label>اللون</Label><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>حجم البيانات (MB)</Label><Input type="number" value={form.data_size_mb} onChange={(e) => setForm({ ...form, data_size_mb: e.target.value })} /></div>
                <div><Label>عدد الساعات</Label><Input type="number" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></div>
              </div>
              <div><Label>الوصف</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button onClick={save} disabled={saving || !form.name || !form.price}>{saving ? "جارٍ..." : "حفظ"}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}