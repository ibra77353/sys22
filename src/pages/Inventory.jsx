import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, LoadingState, EmptyState } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DrawerSelect } from "@/components/DrawerSelect";
import { formatCurrency, formatDateTime, MOVEMENT_TYPES } from "@/lib/format";
import { Plus, Boxes, History, Pencil } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import InventoryEditDialog from "@/components/InventoryEditDialog";

export default function Inventory() {
  const [packages, setPackages] = useState([]);
  const [movements, setMovements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("stock");
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ package_id: "", quantity: "", unit_price: "", notes: "" });
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const { toast } = useToast();

  const load = async () => {
    setLoading(true);
    try {
      const [pkgs, movs] = await Promise.all([
        base44.entities.Package.list("-created_date", 500),
        base44.entities.InventoryMovement.list("-created_date", 200)
      ]);
      setPackages(pkgs);
      setMovements(movs);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const stockOf = (pid) => {
    let added = 0, sold = 0, returned = 0, adjust = 0;
    for (const m of movements) {
      if (m.package_id !== pid) continue;
      const q = Number(m.quantity) || 0;
      if (m.type === "add") added += q;
      else if (m.type === "sell") sold += q;
      else if (m.type === "return") returned += q;
      else if (m.type === "adjust") adjust += (m.related_operation_type === "adjust_down" ? -q : q);
    }
    return { added, sold, returned, current: added - sold + returned + adjust };
  };

  const openAdd = () => { setForm({ package_id: "", quantity: "", unit_price: "", notes: "" }); setOpen(true); };

  const save = async () => {
    if (!form.package_id || !form.quantity) return;
    setSaving(true);
    try {
      const pkg = packages.find((p) => p.id === form.package_id);
      const res = await base44.functions.invoke("addInventory", {
        package_id: form.package_id,
        package_name: pkg?.name || "",
        quantity: Number(form.quantity),
        unit_price: Number(form.unit_price) || 0,
        notes: form.notes
      });
      if (res.data?.error) { toast({ title: "خطأ", description: res.data.error, variant: "destructive" }); return; }
      setOpen(false);
      load();
      toast({ title: "تمت إضافة المخزون" });
    } catch (e) { toast({ title: "خطأ", description: e.message, variant: "destructive" }); } finally { setSaving(false); }
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader title="إدارة المخزون" description="متابعة الكميات وحركة المخزون" action={
        <Button onClick={openAdd} className="gap-2"><Plus className="w-4 h-4" /> إضافة مخزون</Button>
      } />

      <div className="flex gap-2 mb-4">
        <Button variant={tab === "stock" ? "default" : "outline"} size="sm" onClick={() => setTab("stock")} className="gap-1.5"><Boxes className="w-4 h-4" /> المخزون الحالي</Button>
        <Button variant={tab === "history" ? "default" : "outline"} size="sm" onClick={() => setTab("history")} className="gap-1.5"><History className="w-4 h-4" /> سجل الحركات</Button>
      </div>

      {tab === "stock" ? (
        packages.length === 0 ? <EmptyState title="لا توجد باقات" /> : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {packages.map((p) => {
              const s = stockOf(p.id);
              return (
                <Card key={p.id} className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="w-3 h-3 rounded-full" style={{ background: p.color }} />
                    <h3 className="font-bold">{p.name}</h3>
                  </div>
                  <p className="text-3xl font-bold text-primary">{s.current}</p>
                  <p className="text-xs text-muted-foreground">الكمية المتبقية</p>
                  <div className="grid grid-cols-3 gap-1 mt-3 text-center text-xs">
                    <div className="p-1.5 rounded-lg bg-emerald-500/10"><p className="font-bold text-emerald-600">{s.added}</p><p className="text-muted-foreground">مضاف</p></div>
                    <div className="p-1.5 rounded-lg bg-rose-500/10"><p className="font-bold text-rose-500">{s.sold}</p><p className="text-muted-foreground">مباع</p></div>
                    <div className="p-1.5 rounded-lg bg-blue-500/10"><p className="font-bold text-blue-600">{s.returned}</p><p className="text-muted-foreground">مرتجع</p></div>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">قيمة المخزون: {formatCurrency(s.current * (Number(p.price) || 0))}</p>
                  <Button size="sm" variant="outline" onClick={() => setEditing({ pkg: p, stock: s.current })} className="gap-1.5 mt-2 w-full"><Pencil className="w-3.5 h-3.5" /> تعديل</Button>
                </Card>
              );
            })}
          </div>
        )
      ) : (
        movements.length === 0 ? <EmptyState title="لا توجد حركات" /> : (
          <Card className="divide-y divide-border">
            {movements.map((m) => (
              <div key={m.id} className="flex items-center justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium">{m.package_name} — {MOVEMENT_TYPES[m.type] || m.type}</p>
                  <p className="text-xs text-muted-foreground">{m.reason} • {formatDateTime(m.created_date)}</p>
                </div>
                <span className={`text-sm font-bold ${m.type === "add" || m.type === "return" ? "text-emerald-600" : "text-rose-500"}`}>
                  {m.type === "add" || m.type === "return" ? "+" : "-"}{m.quantity}
                </span>
              </div>
            ))}
          </Card>
        )
      )}

      {editing && (
        <InventoryEditDialog
          pkg={editing.pkg}
          currentStock={editing.stock}
          onClose={() => setEditing(null)}
          onSaved={load}
        />
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <Card className="w-full max-w-md p-5" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">إضافة مخزون</h3>
            <div className="space-y-3">
              <div><Label>الباقة</Label>
                <DrawerSelect
                  value={form.package_id}
                  onValueChange={(v) => setForm({ ...form, package_id: v })}
                  placeholder="اختر الباقة"
                  options={packages.map((p) => ({ value: p.id, label: p.name }))}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div><Label>الكمية</Label><Input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} /></div>
                <div><Label>سعر الوحدة</Label><Input type="number" value={form.unit_price} onChange={(e) => setForm({ ...form, unit_price: e.target.value })} /></div>
              </div>
              <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button onClick={save} disabled={saving || !form.package_id || !form.quantity}>{saving ? "جارٍ..." : "إضافة"}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}