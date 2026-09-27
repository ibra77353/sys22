import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getDistributorBalance, logAudit } from "../../shared/finance.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "صلاحية المدير مطلوبة" }, { status: 403 });

    const body = await req.json();
    const { distributor_id, distributor_name, sale_id, invoice_number, amount, notes } = body;
    if (!distributor_id) return Response.json({ error: "اختر الموزع" }, { status: 200 });
    const amt = Number(amount);
    if (!amt || amt <= 0) return Response.json({ error: "المبلغ يجب أن يكون موجباً" }, { status: 200 });

    // Check debt
    const bal = await getDistributorBalance(base44, distributor_id);
    if (amt > bal.debt) return Response.json({ error: `المبلغ أكبر من الدين المستحق (${bal.debt})` }, { status: 200 });

    const now = new Date().toISOString();
    const collection = await base44.asServiceRole.entities.Collection.create({
      distributor_id,
      distributor_name: distributor_name || "",
      sale_id: sale_id || "",
      invoice_number: invoice_number || "",
      amount: amt,
      collection_date: now,
      notes: notes || ""
    });

    await base44.asServiceRole.entities.CashTransaction.create({
      type: "in",
      amount: amt,
      source: "collection",
      description: `تحصيل من ${distributor_name || ""}`,
      reference_id: collection.id,
      reference_type: "collection",
      transaction_date: now
    });

    await logAudit(base44, "create_collection", `تحصيل من ${distributor_name || ""}`, collection.id, `مبلغ ${amt}`);

    return Response.json({ success: true, collection });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}