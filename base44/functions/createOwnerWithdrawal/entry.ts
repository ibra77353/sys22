import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { getCashBalance, logAudit } from "../../shared/finance.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "صلاحية المدير مطلوبة" }, { status: 403 });

    const body = await req.json();
    const { amount, reason, notes } = body;
    const amt = Number(amount);
    if (!amt || amt <= 0) return Response.json({ error: "المبلغ يجب أن يكون موجباً" }, { status: 200 });

    const cash = await getCashBalance(base44);
    if (amt > cash.balance) return Response.json({ error: `رصيد الصندوق غير كافٍ. الرصيد: ${cash.balance}` }, { status: 200 });

    const now = new Date().toISOString();
    const withdrawal = await base44.asServiceRole.entities.OwnerWithdrawal.create({
      amount: amt,
      reason: reason || "",
      notes: notes || "",
      withdrawal_date: now
    });

    await base44.asServiceRole.entities.CashTransaction.create({
      type: "out",
      amount: amt,
      source: "owner_withdrawal",
      description: `سحب المالك: ${reason || ""}`,
      reference_id: withdrawal.id,
      reference_type: "owner_withdrawal",
      transaction_date: now
    });

    await logAudit(base44, "owner_withdrawal", "سحب مالك", withdrawal.id, `مبلغ ${amt}`);

    return Response.json({ success: true, withdrawal });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}