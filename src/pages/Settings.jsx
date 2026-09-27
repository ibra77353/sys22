import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { base44 } from "@/api/base44Client";
import { PageHeader, LoadingState, ConfirmDialog } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Settings as SettingsIcon, Trash2, AlertTriangle } from "lucide-react";

export default function Settings() {
  const navigate = useNavigate();
  const [settings, setSettings] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ network_name: "", currency: "", currency_symbol: "", admin_email: "", opening_balance: 0, low_stock_threshold: 10 });
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    (async () => {
      const list = await base44.entities.Settings.list();
      const s = list[0];
      if (s) {
        setSettings(s);
        setForm({ network_name: s.network_name || "", currency: s.currency || "", currency_symbol: s.currency_symbol || "", admin_email: s.admin_email || "", opening_balance: s.opening_balance || 0, low_stock_threshold: s.low_stock_threshold || 10 });
      } else {
        setSettings({});
      }
    })();
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, opening_balance: Number(form.opening_balance) || 0, low_stock_threshold: Number(form.low_stock_threshold) || 10 };
      if (settings?.id) await base44.entities.Settings.update(settings.id, payload);
      else { const created = await base44.entities.Settings.create(payload); setSettings(created); }
      alert("تم حفظ الإعدادات");
    } catch (e) { alert(e.message); } finally { setSaving(false); }
  };

  if (settings === null) return <LoadingState rows={4} />;

  return (
    <div>
      <PageHeader title="الإعدادات" description="إعدادات الشبكة والنظام" />
      <Card className="p-5 max-w-xl space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-border"><SettingsIcon className="w-5 h-5 text-primary" /><h3 className="font-bold">معلومات الشبكة</h3></div>
        <div><Label>اسم الشبكة</Label><Input value={form.network_name} onChange={(e) => setForm({ ...form, network_name: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>العملة</Label><Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} /></div>
          <div><Label>رمز العملة</Label><Input value={form.currency_symbol} onChange={(e) => setForm({ ...form, currency_symbol: e.target.value })} /></div>
        </div>
        <div><Label>بريد المدير</Label><Input type="email" value={form.admin_email} onChange={(e) => setForm({ ...form, admin_email: e.target.value })} /></div>
        <div className="grid grid-cols-2 gap-3">
          <div><Label>الرصيد الافتتاحي</Label><Input type="number" value={form.opening_balance} onChange={(e) => setForm({ ...form, opening_balance: e.target.value })} /></div>
          <div><Label>حد تنبيه المخزون</Label><Input type="number" value={form.low_stock_threshold} onChange={(e) => setForm({ ...form, low_stock_threshold: e.target.value })} /></div>
        </div>
        <div className="pt-2">
          <Button onClick={save} disabled={saving} className="gap-2"><Save className="w-4 h-4" /> {saving ? "جارٍ..." : "حفظ الإعدادات"}</Button>
        </div>
      </Card>

      <Card className="p-5 max-w-xl mt-4">
        <h3 className="font-bold mb-2">معلومات التطبيق</h3>
        <div className="text-sm text-muted-foreground space-y-1">
          <p>التطبيق: شبكة البرنس — نظام إدارة شبكة الإنترنت</p>
          <p>الإصدار: 1.0.0</p>
          <p>العملة الافتراضية: ريال يمني</p>
        </div>
      </Card>

      <Card className="p-5 max-w-xl mt-4 border-rose-200">
        <div className="flex items-center gap-2 pb-2 border-b border-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-500" />
          <h3 className="font-bold text-rose-600">منطقة الخطر</h3>
        </div>
        <div className="mt-3 space-y-2">
          <p className="text-sm text-muted-foreground">
            حذف الحساب يؤدي إلى إزالة بياناتك نهائياً. لا يمكن التراجع عن هذه العملية.
          </p>
          <Button variant="destructive" onClick={() => setDeleteOpen(true)} className="gap-2">
            <Trash2 className="w-4 h-4" /> حذف الحساب
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="حذف الحساب نهائياً"
        description="سيتم حذف حسابك وجميع بياناتك المرتبطة بشكل دائم. لا يمكن التراجع عن هذا الإجراء."
        confirmText="حذف نهائي"
        destructive
        loading={deleting}
        onConfirm={async () => {
          setDeleting(true);
          try {
            const res = await base44.functions.invoke("deleteAccount", {});
            if (res.data?.error) { alert(res.data.error); return; }
            await base44.auth.logout();
            navigate("/login", { replace: true });
          } catch (e) { alert(e.message); } finally { setDeleting(false); }
        }}
      />
    </div>
  );
}