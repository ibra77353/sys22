import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getPackageStock, logAudit } from "../../shared/finance.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "صلاحية المدير مطلوبة" }, { status: 403 });

    const body = await req.json();
    const { distributor_id, distributor_name, items, paid_amount, notes } = body;
    if (!distributor_id) return Response.json({ error: "اختر الموزع" }, { status: 200 });
    if (!items || !Array.isArray(items) || items.length === 0)
      return Response.json({ error: "أضف عنصراً واحداً على الأقل" }, { status: 200 });

    const paid = Number(paid_amount) || 0;
    if (paid < 0) return Response.json({ error: "المبلغ المدفوع لا يمكن أن يكون سالباً" }, { status: 200 });

    // Validate stock & compute totals
    let total_amount = 0;
    const enrichedItems = [];
    for (const it of items) {
      const qty = Number(it.quantity);
      const price = Number(it.unit_price);
      if (!qty || qty <= 0) return Response.json({ error: "الكمية يجب أن تكون موجبة" }, { status: 200 });
      if (price < 0) return Response.json({ error: "السعر لا يمكن أن يكون سالباً" }, { status: 200 });
      const stock = await getPackageStock(base44, it.package_id);
      if (qty > stock.current) {
        const pkg = await base44.asServiceRole.entities.Package.get(it.package_id);
        return Response.json({ error: `المخزون غير كافٍ للباقة ${pkg ? pkg.name : ""}. المتاح: ${stock.current}` }, { status: 200 });
      }
      const lineTotal = qty * price;
      total_amount += lineTotal;
      enrichedItems.push({ ...it, quantity: qty, unit_price: price, total_price: lineTotal });
    }

    if (paid > total_amount) return Response.json({ error: "المبلغ المدفوع أكبر من الإجمالي" }, { status: 200 });
    const remaining = total_amount - paid;

    // Generate invoice number
    const now = new Date();
    const invoice_number = "INV-" + now.getFullYear() + String(now.getMonth() + 1).padStart(2, "0") + String(now.getDate()).padStart(2, "0") + "-" + String(now.getTime()).slice(-5);

    // 1. Create sale
    const sale = await base44.asServiceRole.entities.Sale.create({
      invoice_number,
      distributor_id,
      distributor_name: distributor_name || "",
      total_amount,
      paid_amount: paid,
      remaining_amount: remaining,
      status: "active",
      sale_date: now.toISOString(),
      notes: notes || "",
      items: enrichedItems
    });

    // 2. Deduct inventory (sell movements)
    for (const it of enrichedItems) {
      const pkg = await base44.asServiceRole.entities.Package.get(it.package_id);
      await base44.asServiceRole.entities.InventoryMovement.create({
        package_id: it.package_id,
        package_name: pkg ? pkg.name : "",
        quantity: it.quantity,
        type: "sell",
        unit_price: it.unit_price,
        reason: `بيع - ${invoice_number}`,
        related_operation_id: sale.id,
        related_operation_type: "sale",
        notes: ""
      });
    }

    // 3. Cash transaction for paid amount
    if (paid > 0) {
      await base44.asServiceRole.entities.CashTransaction.create({
        type: "in",
        amount: paid,
        source: "sale",
        description: `تحصيل بيع ${invoice_number} - ${distributor_name || ""}`,
        reference_id: sale.id,
        reference_type: "sale",
        transaction_date: now.toISOString()
      });
    }

    // 4. Audit
    await logAudit(base44, "create_sale", `فاتورة ${invoice_number}`, sale.id, `بيع بمبلغ ${total_amount} للموزع ${distributor_name || ""}, مدفوع ${paid}, متبقي ${remaining}`);

    return Response.json({ success: true, sale });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}