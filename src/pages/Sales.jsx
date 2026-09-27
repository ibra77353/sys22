import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, LoadingState, EmptyState, ConfirmDialog } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DrawerSelect } from "@/components/DrawerSelect";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Plus, Trash2, ShoppingCart, X, Printer } from "lucide-react";
import InvoiceModal from "@/components/InvoiceModal";
import AdvancedSearchBar from "@/components/AdvancedSearchBar";

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [cancelId, setCancelId] = useState(null);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [invoiceSale, setInvoiceSale] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [form, setForm] = useState({ distributor_id: "", items: [], paid_amount: "", notes: "" });
  const [newItem, setNewItem] = useState({ package_id: "", quantity: "", unit_price: "" });

  const load = async () => {
    setLoading(true);
    try {
      const query = {};
      const term = searchText.trim();
      if (term) {
        query.$or = [
          { distributor_name: { $regex: term, $options: "i" } },
          { invoice_number: { $regex: term, $options: "i" } }
        ];
      }
      if (dateFrom || dateTo) {
        const d = {};
        if (dateFrom) d.$gte = new Date(dateFrom).toISOString();
        if (dateTo) { const e = new Date(dateTo); e.setDate(e.getDate() + 1); d.$lt = e.toISOString(); }
        query.sale_date = d;
      }
      const [s, d, p, st] = await Promise.all([
        base44.entities.Sale.filter(query, { sort: "-sale_date", limit: 500 }),
        base44.entities.Distributor.filter({ status: "active" }),
        base44.entities.Package.filter({ status: "active" }),
        base44.entities.Settings.list()
      ]);
      setSales(s.items || []); setDistributors(d); setPackages(p);
      if (st && st.length) setSettings(st[0]);
    } finally { setLoading(false); }
  };

  useEffect(() => {
    const t = setTimeout(() => { load(); }, 300);
    return () => clearTimeout(t);
  }, [searchText, dateFrom, dateTo]);

  const total = form.items.reduce((a, it) => a + (Number(it.quantity) || 0) * (Number(it.unit_price) || 0), 0);
  const paid = Number(form.paid_amount) || 0;
  const remaining = total - paid;

  const addItem = () => {
    if (!newItem.package_id || !newItem.quantity) return;
    const pkg = packages.find((p) => p.id === newItem.package_id);
    const price = newItem.unit_price || pkg?.price || 0;
    setForm({ ...form, items: [...form.items, { package_id: newItem.package_id, package_name: pkg?.name || "", quantity: Number(newItem.quantity), unit_price: Number(price) }] });
    setNewItem({ package_id: "", quantity: "", unit_price: "" });
  };

  const removeItem = (i) => setForm({ ...form, items: form.items.filter((_, idx) => idx !== i) });

  const openNew = () => { setForm({ distributor_id: "", items: [], paid_amount: "", notes: "" }); setNewItem({ package_id: "", quantity: "", unit_price: "" }); setOpen(true); };

  const save = async () => {
    if (!form.distributor_id || form.items.length === 0) return;
    setSaving(true);
    try {
      const dist = distributors.find((d) => d.id === form.distributor_id);
      const res = await base44.functions.invoke("createSale", {
        distributor_id: form.distributor_id,
        distributor_name: dist?.name || "",
        items: form.items,
        paid_amount: paid,
        notes: form.notes
      });
      if (res.data?.error) { alert(res.data.error); return; }
      setOpen(false);
      load();
      if (res.data?.sale) setInvoiceSale(res.data.sale);
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  const cancelSale = async () => {
    setCancelLoading(true);
    try {
      const res = await base44.functions.invoke("cancelSale", { sale_id: cancelId });
      if (res.data?.error) { alert(res.data.error); return; }
      setCancelId(null);
      load();
    } catch (e) { alert(e.message); } finally { setCancelLoading(false); }
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader title="المبيعات" description="إنشاء وإدارة عمليات البيع" action={
        <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> بيع جديد</Button>
      } />

      <AdvancedSearchBar
        searchText={searchText} setSearchText={setSearchText}
        dateFrom={dateFrom} setDateFrom={setDateFrom}
        dateTo={dateTo} setDateTo={setDateTo}
        placeholder="بحث برقم الفاتورة أو اسم الموزع..."
      />

      {sales.length === 0 ? (
        <EmptyState title={searchText || dateFrom || dateTo ? "لا توجد نتائج مطابقة" : "لا توجد مبيعات"} action={searchText || dateFrom || dateTo ? undefined : <Button onClick={openNew} className="gap-2"><Plus className="w-4 h-4" /> إنشاء بيع</Button>} />
      ) : (
        <Card className="divide-y divide-border">
          {sales.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 p-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-bold">{s.invoice_number}</p>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full ${s.status === "active" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-500"}`}>{s.status === "active" ? "نشط" : "ملغي"}</span>
                </div>
                <p className="text-xs text-muted-foreground">{s.distributor_name} • {formatDateTime(s.sale_date)} • {s.items?.length || 0} عنصر</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <div className="text-left">
                  <p className="text-sm font-bold">{formatCurrency(s.total_amount)}</p>
                  <p className="text-xs text-muted-foreground">متبقي {formatCurrency(s.remaining_amount)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <Button size="sm" variant="outline" onClick={() => setInvoiceSale(s)} className="gap-1.5"><Printer className="w-3.5 h-3.5" /> فاتورة</Button>
                  {s.status === "active" && (
                    <Button size="sm" variant="outline" onClick={() => setCancelId(s.id)} className="gap-1.5 text-rose-500"><X className="w-3.5 h-3.5" /> إلغاء</Button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </Card>
      )}

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setOpen(false)}>
          <Card className="w-full max-w-lg p-5 max-h-[92vh] overflow-y-auto scrollbar-thin" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-lg mb-4">عملية بيع جديدة</h3>
            <div className="space-y-3">
              <div><Label>الموزع</Label>
                <DrawerSelect
                  value={form.distributor_id}
                  onValueChange={(v) => setForm({ ...form, distributor_id: v })}
                  placeholder="اختر الموزع"
                  options={distributors.map((d) => ({ value: d.id, label: d.name }))}
                />
              </div>

              <div className="rounded-xl border border-border p-3 space-y-2">
                <Label>إضافة عنصر</Label>
                <div className="grid grid-cols-12 gap-2">
                  <div className="col-span-5">
                    <DrawerSelect
                      value={newItem.package_id}
                      onValueChange={(v) => setNewItem({ ...newItem, package_id: v })}
                      placeholder="الباقة"
                      options={packages.map((p) => ({ value: p.id, label: p.name }))}
                    />
                  </div>
                  <Input className="col-span-3" type="number" placeholder="كمية" value={newItem.quantity} onChange={(e) => setNewItem({ ...newItem, quantity: e.target.value })} />
                  <Input className="col-span-3" type="number" placeholder="سعر" value={newItem.unit_price} onChange={(e) => setNewItem({ ...newItem, unit_price: e.target.value })} />
                  <Button className="col-span-1 px-0" onClick={addItem}><Plus className="w-4 h-4" /></Button>
                </div>
              </div>

              {form.items.length > 0 && (
                <div className="space-y-1.5">
                  {form.items.map((it, i) => (
                    <div key={i} className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-muted text-sm">
                      <span>{it.package_name} × {it.quantity}</span>
                      <span className="font-medium">{formatCurrency(it.quantity * it.unit_price)}</span>
                      <Button size="icon" variant="ghost" onClick={() => removeItem(i)}><Trash2 className="w-3.5 h-3.5 text-rose-500" /></Button>
                    </div>
                  ))}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border">
                <div><Label>الإجمالي</Label><div className="text-lg font-bold text-primary">{formatCurrency(total)}</div></div>
                <div><Label>المتبقي</Label><div className="text-lg font-bold text-rose-500">{formatCurrency(remaining)}</div></div>
              </div>
              <div><Label>المبلغ المدفوع</Label><Input type="number" value={form.paid_amount} onChange={(e) => setForm({ ...form, paid_amount: e.target.value })} /></div>
              <div><Label>ملاحظات</Label><Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} /></div>
              <div className="flex gap-2 justify-end pt-2">
                <Button variant="outline" onClick={() => setOpen(false)}>إلغاء</Button>
                <Button onClick={save} disabled={saving || !form.distributor_id || form.items.length === 0} className="gap-2"><ShoppingCart className="w-4 h-4" /> {saving ? "جارٍ..." : "تأكيد البيع"}</Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <ConfirmDialog
        open={!!cancelId}
        onOpenChange={(v) => !v && setCancelId(null)}
        title="إلغاء عملية البيع"
        description="سيتم إعادة الكمية للمخزون وعكس الأثر المالي. لا يمكن التراجع."
        confirmText="إلغاء البيع"
        destructive
        loading={cancelLoading}
        onConfirm={cancelSale}
      />

      <InvoiceModal sale={invoiceSale} settings={settings} distributorPhone={invoiceSale ? distributors.find((d) => d.id === invoiceSale.distributor_id)?.phone : undefined} onClose={() => setInvoiceSale(null)} />
    </div>
  );
}