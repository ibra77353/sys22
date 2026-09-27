import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { logAudit } from "../../shared/finance.ts";

const RESTORE_ENTITIES = ["Package", "InventoryMovement", "Distributor", "Sale", "Collection", "Expense", "OwnerWithdrawal", "Line", "LinePayment", "CashTransaction", "Settings", "AuditLog"];

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "صلاحية المدير مطلوبة" }, { status: 403 });

    const body = await req.json();
    const { file_url } = body;
    if (!file_url) return Response.json({ error: "رابط الملف مطلوب" }, { status: 400 });

    const resp = await fetch(file_url);
    const text = await resp.text();
    const parsed = JSON.parse(text);
    const data = parsed.data || parsed;

    // Clear existing data for each entity (except AuditLog which we keep)
    for (const name of RESTORE_ENTITIES) {
      if (name === "AuditLog") continue;
      const existing = await base44.asServiceRole.entities[name].list("-created_date", 5000);
      for (const item of existing) {
        await base44.asServiceRole.entities[name].delete(item.id);
      }
    }

    // Restore records
    let restored = 0;
    for (const name of RESTORE_ENTITIES) {
      const items = data[name];
      if (!items || !Array.isArray(items)) continue;
      for (const item of items) {
        const { id, created_date, updated_date, created_by_id, created_by, ...rest } = item;
        await base44.asServiceRole.entities[name].create(rest);
        restored++;
      }
    }

    await logAudit(base44, "restore_backup", "استعادة نسخة احتياطية", "", `استعادة ${restored} سجل`);

    return Response.json({ success: true, restored });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}