import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, LoadingState, EmptyState, ConfirmDialog } from "@/components/ui-shared";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatDateTime } from "@/lib/format";
import { DatabaseBackup, Download, Upload, Trash2, RotateCcw } from "lucide-react";

export default function Backup() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [restoreUrl, setRestoreUrl] = useState(null);
  const [restoreLoading, setRestoreLoading] = useState(false);

  const load = async () => {
    setLoading(true);
    try { setItems(await base44.entities.Backup.list("-created_date", 100)); }
    finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const create = async () => {
    setCreating(true);
    try {
      const res = await base44.functions.invoke("createBackup", {});
      if (res.data?.error) { alert(res.data.error); return; }
      load();
    } catch (e) { alert(e.message); } finally { setCreating(false); }
  };

  const remove = async (b) => {
    if (!confirm("حذف هذه النسخة الاحتياطية؟")) return;
    await base44.entities.Backup.delete(b.id);
    load();
  };

  const restore = async () => {
    setRestoreLoading(true);
    try {
      const res = await base44.functions.invoke("restoreBackup", { file_url: restoreUrl });
      if (res.data?.error) { alert(res.data.error); return; }
      alert(`تمت الاستعادة بنجاح (${res.data.restored} سجل)`);
      setRestoreUrl(null);
    } catch (e) { alert(e.message); } finally { setRestoreLoading(false); }
  };

  if (loading) return <LoadingState />;

  return (
    <div>
      <PageHeader title="النسخ الاحتياطي والاستعادة" description="حماية بيانات الشبكة" action={
        <Button onClick={create} disabled={creating} className="gap-2"><DatabaseBackup className="w-4 h-4" /> {creating ? "جارٍ..." : "إنشاء نسخة"}</Button>
      } />

      {items.length === 0 ? (
        <EmptyState title="لا توجد نسخ احتياطية" description="أنشئ أول نسخة احتياطية لبياناتك" action={<Button onClick={create} className="gap-2"><DatabaseBackup className="w-4 h-4" /> إنشاء نسخة</Button>} />
      ) : (
        <Card className="divide-y divide-border">
          {items.map((b) => (
            <div key={b.id} className="flex items-center justify-between gap-2 p-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0"><DatabaseBackup className="w-5 h-5 text-primary" /></div>
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{b.file_name}</p>
                  <p className="text-xs text-muted-foreground">{formatDateTime(b.created_date)} • {b.record_count} سجل</p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button size="icon" variant="ghost" asChild><a href={b.file_url} target="_blank" rel="noreferrer" download><Download className="w-4 h-4" /></a></Button>
                <Button size="icon" variant="ghost" onClick={() => setRestoreUrl(b.file_url)} className="text-amber-500"><RotateCcw className="w-4 h-4" /></Button>
                <Button size="icon" variant="ghost" onClick={() => remove(b)} className="text-rose-500"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
          ))}
        </Card>
      )}

      <ConfirmDialog
        open={!!restoreUrl}
        onOpenChange={(v) => !v && setRestoreUrl(null)}
        title="استعادة نسخة احتياطية"
        description="تحذير: سيتم استبدال جميع البيانات الحالية بالبيانات من النسخة الاحتياطية. لا يمكن التراجع. تأكد من عمل نسخة احتياطية للبيانات الحالية أولاً."
        confirmText="استعادة"
        destructive
        loading={restoreLoading}
        onConfirm={restore}
      />
    </div>
  );
}