import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";

const COLORS = ["#3b82f6", "#f97316", "#22c55e", "#a855f7", "#ef4444", "#eab308", "#14b8a6", "#64748b"];

export default function InventoryEditDialog({ pkg, currentStock, onClose, onSaved }) {
  const [form, setForm] = useState({
    name: pkg.name || "",
    price: pkg.price ?? "",
    color: pkg.color || "#3b82f6",
    data_size_mb: pkg.data_size_mb ?? "",
    hours: pkg.hours ?? "",
    description: pkg.description || ""
  });
  const [newQty, setNewQty] = useState(String(currentStock ?? 0));
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  const save = async () => {
    if (!form.name || form.price === "") return;
    setSaving(true);
    try {
      await base44.entities.Package.update(pkg.id, {
        name: form.name,
        price: Number(form.price),
        data_size_mb: Number(form.data_size_mb) || 0,
        hours: Number(form.hours) || 0,
        color: form.color,
        description: form.description
      });
      const delta = Number(newQty) - currentStock;
      if (delta !== 0) {
        await base44.entities.InventoryMovement.create({
          package_id: pkg.id,
          package_name: form.name,
          quantity: Math.abs(delta),
          type: "adjust",
          unit_price: Number(form.price) || 0,
          reason: "تسوية مخزون",
          related_operation_id: "",
          related_operation_type: delta > 0 ? "adjust_up" : "adjust_down",
          notes: notes || ""
        });
      }
      toast({ title: "تم حفظ التعديلات" });
      onSaved();
      onClose();
    } catch (e) {
      toast({ title: "خطأ", description: e.message, variant: "destructive" });
    } finally { setSaving(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <Card className="w-full max-w-md p-5 max-h-[90vh] overflow-y-auto scrollbar-thin" onClick={(e) => e.stopPropagation()}>
        <h3 className="font-bold text-lg mb-4">تعديل الباقة والمخزون</h3>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><Label>الكمية الحالية</Label><Input value={currentStock} disabled /></div>
            <div><Label>الكمية الجديدة</Label><Input type="number" value={newQty} onChange={(e) => setNewQty(e.target.value)} /></div>
          </div>
          <div><Label>اسم الباقة</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>السعر (سعر الوحدة)</Label><Input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} /></div>
            <div><Label>اللون</Label><Input type="color" value={form.color} onChange={(e) => setForm({ ...form, color: e.target.value })} className="h-10" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>حجم البيانات (MB)</Label><Input type="number" value={form.data_size_mb} onChange={(e) => setForm({ ...form, data_size_mb: e.target.value })} /></div>
            <div><Label>عدد الساعات</Label><Input type="number" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} /></div>
          </div>
          <div><Label>الوصف</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} /></div>
          <div><Label>ملاحظات التسوية</Label><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} placeholder="سبب التعديل (اختياري)" /></div>
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose} disabled={saving}>إلغاء</Button>
            <Button onClick={save} disabled={saving || !form.name || form.price === ""}>{saving ? "جارٍ..." : "حفظ"}</Button>
          </div>
        </div>
      </Card>
    </div>
  );
}