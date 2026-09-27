import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { logAudit } from "../../shared/finance.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "صلاحية المدير مطلوبة" }, { status: 403 });

    const body = await req.json();
    const { sale_id } = body;
    if (!sale_id) return Response.json({ error: "معرف البيع مطلوب" }, { status: 200 });

    const sale = await base44.asServiceRole.entities.Sale.get(sale_id);
    if (!sale) return Response.json({ error: "العملية غير موجودة" }, { status: 200 });
    if (sale.status === "cancelled") return Response.json({ error: "العملية ملغاة مسبقاً" }, { status: 200 });

    // 1. Mark sale cancelled
    await base44.asServiceRole.entities.Sale.update(sale_id, { status: "cancelled" });

    // 2. Return inventory (return movements)
    const items = sale.items || [];
    for (const it of items) {
      await base44.asServiceRole.entities.InventoryMovement.create({
        package_id: it.package_id,
        package_name: it.package_name || "",
        quantity: Number(it.quantity) || 0,
        type: "return",
        unit_price: Number(it.unit_price) || 0,
        reason: `إلغاء بيع - ${sale.invoice_number}`,
        related_operation_id: sale_id,
        related_operation_type: "sale_cancel",
        notes: ""
      });
    }

    // 3. Reverse cash transaction (out) for the paid amount
    if (Number(sale.paid_amount) > 0) {
      await base44.asServiceRole.entities.CashTransaction.create({
        type: "out",
        amount: Number(sale.paid_amount),
        source: "sale",
        description: `عكس تحصيل بيع ملغي ${sale.invoice_number}`,
        reference_id: sale_id,
        reference_type: "sale_cancel",
        transaction_date: new Date().toISOString()
      });
    }

    // 4. Audit
    await logAudit(base44, "cancel_sale", `فاتورة ${sale.invoice_number}`, sale_id, `إلغاء بيع بمبلغ ${sale.total_amount}, مدفوع ${sale.paid_amount}`);

    return Response.json({ success: true });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}