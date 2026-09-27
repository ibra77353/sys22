import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getCashBalance, logAudit } from "../../shared/finance.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "صلاحية المدير مطلوبة" }, { status: 403 });

    const body = await req.json();
    const { line_id, line_name, amount, period, notes } = body;
    if (!line_id) return Response.json({ error: "اختر الخط" }, { status: 200 });
    const amt = Number(amount);
    if (!amt || amt <= 0) return Response.json({ error: "المبلغ يجب أن يكون موجباً" }, { status: 200 });

    const cash = await getCashBalance(base44);
    if (amt > cash.balance) return Response.json({ error: `رصيد الصندوق غير كافٍ. الرصيد: ${cash.balance}` }, { status: 200 });

    const now = new Date().toISOString();
    const payment = await base44.asServiceRole.entities.LinePayment.create({
      line_id,
      line_name: line_name || "",
      amount: amt,
      period: period || "",
      payment_date: now,
      notes: notes || ""
    });

    await base44.asServiceRole.entities.CashTransaction.create({
      type: "out",
      amount: amt,
      source: "line_payment",
      description: `دفعة خط ${line_name || ""} - ${period || ""}`,
      reference_id: payment.id,
      reference_type: "line_payment",
      transaction_date: now
    });

    await logAudit(base44, "line_payment", `دفعة خط ${line_name || ""}`, payment.id, `مبلغ ${amt}`);

    return Response.json({ success: true, payment });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}