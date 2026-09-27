import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { logAudit } from "../../shared/finance.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "صلاحية المدير مطلوبة" }, { status: 403 });

    const body = await req.json();
    const { package_id, package_name, quantity, unit_price, notes } = body;
    if (!package_id) return Response.json({ error: "اختر الباقة" }, { status: 200 });
    const qty = Number(quantity);
    if (!qty || qty <= 0) return Response.json({ error: "الكمية يجب أن تكون موجبة" }, { status: 200 });
    const price = Number(unit_price) || 0;
    if (price < 0) return Response.json({ error: "السعر لا يمكن أن يكون سالباً" }, { status: 200 });

    const now = new Date().toISOString();
    const movement = await base44.asServiceRole.entities.InventoryMovement.create({
      package_id,
      package_name: package_name || "",
      quantity: qty,
      type: "add",
      unit_price: price,
      reason: "إضافة مخزون",
      related_operation_id: "",
      related_operation_type: "inventory_add",
      notes: notes || ""
    });

    await logAudit(base44, "add_inventory", `إضافة مخزون ${package_name || ""}`, movement.id, `كمية ${qty} بسعر ${price}`);

    return Response.json({ success: true, movement });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}