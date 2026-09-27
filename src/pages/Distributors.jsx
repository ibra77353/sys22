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
import { Plus, Pencil, Phone, MapPin, User } from "lucide-react";
import AdvancedSearchBar from "@/components/AdvancedSearchBar";

export default function Distributors() {
  const navigate = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", address: "", notes: "", status: "active" });
  const [saving, setSaving] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const query = {};
      const term = searchText.trim();
      if (term) {
        query.$or = [
          { name: { $regex: term, $options: "i" } },
          { phone: { $regex: term, $options: "i" } }
        ];
      }
      if (dateFrom || dateTo) {
        const d = {};
        if (dateFrom) d.$gte = dateFrom;
        if (dateTo) { const e = new Date(dateTo); e.setDate(e.getDate() + 1); d.$lt = e.toISOString().slice(0, 10); }
        query.registration_date = d;
      }
      const res = await base44.entities.Distributor.filter(query, { sort: "-created_date", limit: 500 });
      setItems(res.items || []);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(t);
  }, [searchText, dateFrom, dateTo]);

  const openNew = () => { setEditing(null); setForm({ name: "", phone: "", address: "", notes: "", status: "active" }); setOpen(true); };
  const openEdit = (d) => { setEditing(d); setForm({ name: d.name, phone: d.phone || "", address: d.address || "", notes: d.notes || "", status: d.status }); setOpen(true); };

  const save = async () => {
    if (!form.name) return;
    setSaving(true);
    try {
      if (editing) await base44.entities.Distributor.update(editing.id, form);
      else await base44.entities.Distributor.create({ ...form, registration_date: new Date().toISOString().slice(0, 10) });
      setOpen(false);
      load();
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  const openDetail = (d) => navigate(`/distributors/${d.id}`);

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader title="إدارة الموزعين" description="إدارة بيانات الموزعين وكشوف الحسابات" action={
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> موزع جديد</Button>
      } />
      <AdvancedSearchBar
        searchText={searchText} setSearchText={setSearchText}
        dateFrom={dateFrom} setDateFrom={setDateFrom}
        dateTo={dateTo} setDateTo={setDateTo}
        placeholder="بحث بالاسم أو رقم الهاتف..."
      />

      {items.length === 0 ? (
        <EmptyState title={searchText || dateFrom || dateTo ? "لا توجد نتائج مطابقة" : "لا يوجد موزعون"} action={searchText || dateFrom || dateTo ? undefined : <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> إضافة موزع</Button>} />
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((d) => (
            <Card key={d.id} className="p-4">
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><User className="w-5 h-5 text-primary" /></div>
                  <div className="min-w-0"><h3 className="font-bold truncate">{d.name}</h3><p className="text-xs text-muted-foreground">{formatDate(d.registration_date)}</p></div>
                </div>
                <span className={`text-[10px] px-2 py-0.5 rounded-full ${d.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-muted text-muted-foreground"}`}>{d.status === "active" ? "نشط" : "معطل"}</span>
              </div>
              {d.phone && <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><Phone className="w-3 h-3" /> {d.phone}</p>}
              {d.address && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" /> {d.address}</p>}
              <div className="flex gap-2 mt-3">
                <Button size="sm" variant="outline" onClick={() => openDetail(d)} className="gap-1.5">كشف حساب</Button>
                <Button size="sm" variant="ghost" onClick={() => openEdit(d)} className="gap-1.5"><Pencil className="w-3.5 h-3.5" /></Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <Card className="w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">{editing ? "تعديل موزع" : "موزع جديد"}</h3>
            <div className="space-y-3">
              <div><Label>الاسم</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
              <div><Label>رقم الهاتف</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
              <div><Label>العنوان</Label><Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} /></div>
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