import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { logAudit } from "../../shared/finance.ts";

const ENTITY_NAMES = ["Package", "InventoryMovement", "Distributor", "Sale", "Collection", "Expense", "OwnerWithdrawal", "Line", "LinePayment", "CashTransaction", "Settings", "AuditLog"];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "صلاحية المدير مطلوبة" }, { status: 403 });

    const data = {};
    let recordCount = 0;
    for (const name of ENTITY_NAMES) {
      const items = await base44.asServiceRole.entities[name].list("-created_date", 5000);
      data[name] = items;
      recordCount += items.length;
    }

    const json = JSON.stringify({ app: "Prince Network", version: 1, created: new Date().toISOString(), data }, null, 2);
    const bytes = new TextEncoder().encode(json);
    const file = new File([bytes], `prince_backup_${Date.now()}.json`, { type: "application/json" });
    const { file_url } = await base44.asServiceRole.integrations.Core.UploadPublicFile({ file });

    const backup = await base44.asServiceRole.entities.Backup.create({
      file_url,
      file_name: `prince_backup_${new Date().toISOString().slice(0, 10)}.json`,
      record_count: recordCount,
      size_bytes: bytes.length,
      notes: "نسخة احتياطية كاملة"
    });

    await logAudit(base44, "create_backup", "نسخة احتياطية", backup.id, `${recordCount} سجل`);

    return Response.json({ success: true, backup });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}