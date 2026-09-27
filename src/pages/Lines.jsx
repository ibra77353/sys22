import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useNavigate } from "react-router-dom";
import { PageHeader, LoadingState, EmptyState } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency, formatDate } from "@/lib/format";
import { Plus, Pencil, Wifi, Power } from "lucide-react";

export default function Lines() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", provider: "", identifier: "", speed: "", cost: "", status: "active", subscription_date: "", notes: "" });

  const load = async () => {
    setLoading(true);
    try { setItems(await base44.entities.Line.list("-created_date", 500)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const openNew = () => { setEditing(null); setForm({ name: "", provider: "", identifier: "", speed: "", cost: "", status: "active", subscription_date: new Date().toISOString().slice(0, 10), notes: "" }); setOpen(true); };
  const openEdit = (l) => { setEditing(l); setForm({ name: l.name, provider: l.provider || "", identifier: l.identifier || "", speed: l.speed || "", cost: l.cost, status: l.status, subscription_date: (l.subscription_date || "").slice(0, 10), notes: l.notes || "" }); setOpen(true); };

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      const payload = { ...form, cost: Number(form.cost) || 0 };
      if (editing) await base44.entities.Line.update(editing.id, payload);
      else await base44.entities.Line.create(payload);
      setOpen(false);
      load();
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  const toggle = async (l) => { await base44.entities.Line.update(l.id, { status: l.status === "active" ? "inactive" : "active" }); load(); };

  const openDetail = (l) => navigate(`/lines/${l.id}`);

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader title="خطوط الإنترنت" description="إدارة خطوط الشبكة" action={
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> خط جديد</Button>
      } />
      {items.length === 0 ? (
        <EmptyState title="لا توجد خطوط" action={<Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> إضافة خط</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((l) => (
            <Card key={l.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><Wifi className="w-5 h-5 text-primary" /></div>
                  <div className="min-w-0"><h3 className="font-bold truncate">{l.name}</h3><p className="text-xs text-muted-foreground truncate">{l.provider}</p></div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${l.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>{l.status === "active" ? "نشط" : "معطل"}</span>
              </div>
              <div className="grid grid-cols-2 gap-2 mt-3 text-xs text-muted-foreground">
                <span>السرعة: {l.speed || "-"}</span>
                <span>التكلفة: {formatCurrency(l.cost)}</span>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => openDetail(l)}>تفاصيل</Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(l)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button size="sm" variant="ghost" onClick={() => toggle(l)}><Power className="w-3.5 h-3.5" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <Card className="w-full max-w-md p-5 max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">{editing ? "تعديل خط" : "خط جديد"}</h3>
            <div className="space-y-3">
              <div><Label>اسم الخط</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>مزود الخدمة</Label><Input value={form.provider} onChange={(e) => setForm({ ...form, provider: e.target.value })} /></div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>معرف الخط</Label><Input value={form.identifier} onChange={(e) => setForm({ ...form, identifier: e.target.value })} /></div>
                <div><Label>السرعة</Label><Input value={form.speed} onChange={(e) => setForm({ ...form, speed: e.target.value })} placeholder="مثال: 20 Mbps" /></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>التكلفة</Label><Input type="number" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} /></div>
                <div><Label>تاريخ الاشتراك</Label><Input type="date" value={form.subscription_date} onChange={(e) => setForm({ ...form, subscription_date: e.target.value })} /></div>
              </div>
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