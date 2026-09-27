import { createClientFromRequest } from 'npm:@base44/sdk@0.8.44';
import { logAudit } from "../../shared/finance.ts";

export default async function(req) {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: "غير مصرح" }, { status: 401 });
    if (user.role !== "admin") return Response.json({ error: "صلاحية المدير مطلوبة" }, { status: 403 });

    const body = await req.json();
    const { category, description, amount, notes } = body;
    if (!category) return Response.json({ error: "اختر التصنيف" }, { status: 200 });
    const amt = Number(amount);
    if (!amt || amt <= 0) return Response.json({ error: "المبلغ يجب أن يكون موجباً" }, { status: 200 });

    const now = new Date().toISOString();
    const expense = await base44.asServiceRole.entities.Expense.create({
      category,
      description: description || "",
      amount: amt,
      expense_date: now,
      notes: notes || ""
    });

    await base44.asServiceRole.entities.CashTransaction.create({
      type: "out",
      amount: amt,
      source: "expense",
      description: `مصروف: ${description || category}`,
      reference_id: expense.id,
      reference_type: "expense",
      transaction_date: now
    });

    await logAudit(base44, "create_expense", `مصروف ${category}`, expense.id, `مبلغ ${amt}`);

    return Response.json({ success: true, expense });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}