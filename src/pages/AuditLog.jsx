import React, { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { PageHeader, LoadingState, EmptyState } from "@/components/ui-shared";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatDateTime } from "@/lib/format";
import { History, Search } from "lucide-react";

const OP_LABELS = {
  create_sale: "إنشاء بيع",
  cancel_sale: "إلغاء بيع",
  add_inventory: "إضافة مخزون",
  create_collection: "تحصيل",
  create_expense: "مصروف",
  owner_withdrawal: "سحب مالك",
  line_payment: "دفعة خط",
  create_backup: "نسخة احتياطية",
  restore_backup: "استعادة نسخة",
  create_package: "إنشاء باقة",
  update_package: "تعديل باقة",
  toggle_package: "تعطيل/تفعيل باقة"
};

export default function AuditLog() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  useEffect(() => {
    (async () => {
      try { setItems(await base44.entities.AuditLog.list("-log_date", 500)); }
      finally { setLoading(false); }
    })();
  }, []);

  if (loading) return <LoadingState />;

  const filtered = items.filter((i) => !filter || (i.operation_type + i.affected_item + i.details + i.user_email).toLowerCase().includes(filter.toLowerCase()));

  return (
    <div>
      <PageHeader title="سجل التدقيق" description="سجل العمليات الحساسة في النظام" />
      <div className="relative mb-4">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pr-9" placeholder="تصفية السجل..." value={filter} onChange={(e) => setFilter(e.target.value)} />
      </div>
      {filtered.length === 0 ? (
        <EmptyState title="لا توجد عمليات مسجلة" />
      ) : (
        <Card className="divide-y divide-border">
          {filtered.map((i) => (
            <div key={i.id} className="flex items-start gap-3 p-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0"><History className="w-4 h-4 text-primary" /></div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{OP_LABELS[i.operation_type] || i.operation_type}</span>
                  {i.affected_item && <span className="text-xs text-muted-foreground">• {i.affected_item}</span>}
                </div>
                {i.details && <p className="text-xs text-muted-foreground mt-0.5">{i.details}</p>}
                <p className="text-[11px] text-muted-foreground mt-0.5">{formatDateTime(i.log_date)} • {i.user_email || "system"}</p>
              </div>
            </div>
          ))}
        </Card>
      )}
    </div>
  );
}